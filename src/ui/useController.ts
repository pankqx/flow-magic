import { useCallback, useReducer, useRef } from 'react';
import { catalog } from '../content/catalog';
import type { ItemSource, StageItem, Visual } from '../domain/types';
import { match, matchedAlias } from '../matcher/matcher';
import { initialState, reducer, currentEntry, type SessionEvent } from '../session/session';
import { calloutOf, parseIntent, type Command } from '../speech/intent';
import { generateVisual } from '../ai/openrouter';
import type { AiSettings, Spend } from '../ai/settings';
import { findPicture } from '../pictures/wikipedia';
import type { GestureAction } from '../vision/gestures';

const AUTO_COOLDOWN_MS = 3500;

export interface ControllerDeps {
  ai: () => AiSettings;
  aiOn: () => boolean;
  autoMode: () => boolean;
  onSpend: (s: Spend) => void;
}

export function curatedItem(id: string): StageItem | undefined {
  const c = catalog.get(id);
  return c && { kind: 'visual', id: `c:${c.id}`, visual: c.visual, origin: 'curated', conceptId: c.id };
}

const cmdEvent: Record<Command, SessionEvent['type']> = {
  next: 'STEP_NEXT',
  prev: 'STEP_PREV',
  all: 'STEP_ALL',
  clear: 'CLEAR',
  back: 'BACK',
  forward: 'FORWARD',
};

/**
 * Orchestrates input → intent → curated/picture/AI → session events.
 * The reducer stays pure; all async work lives here.
 */
export function useController(deps: ControllerDeps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const depsRef = useRef(deps);
  depsRef.current = deps;
  const abortRef = useRef<AbortController | undefined>(undefined);
  const lastAutoRef = useRef(0);
  const transcriptRef = useRef<string[]>([]);

  const fresh = () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    return ac;
  };

  const showCurated = useCallback((id: string, source: ItemSource, query?: string) => {
    const it = curatedItem(id);
    if (!it) return;
    const alias = query ? matchedAlias(query, catalog.get(id)!) : undefined;
    dispatch({
      type: 'SHOW',
      item: it,
      source,
      query,
      detail: alias ? `matched “${alias}”` : 'from the library',
    });
  }, []);

  const picture = useCallback(
    async (subject: string, source: ItemSource, fallbackToAi = false): Promise<boolean> => {
      const ac = fresh();
      dispatch({ type: 'BUSY', label: `Finding a picture of ${subject}…` });
      try {
        const pic = await findPicture(subject, ac.signal);
        if (ac.signal.aborted) return false;
        if (pic) {
          dispatch({
            type: 'SHOW',
            item: { kind: 'picture', id: `p:${pic.imageUrl}`, picture: pic },
            source,
            query: subject,
            detail: 'picture from Wikipedia',
          });
          return true;
        }
        if (fallbackToAi && depsRef.current.aiOn()) return generate(subject, source);
        dispatch({
          type: 'NOTICE',
          notice: { kind: 'error', query: subject, message: `No picture found for “${subject}”.` },
        });
      } catch (e) {
        if ((e as Error).name === 'AbortError') return false;
        dispatch({
          type: 'NOTICE',
          notice: { kind: 'error', query: subject, message: 'Picture search needs an internet connection.' },
        });
      }
      return false;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  const generate = useCallback(
    async (
      subject: string,
      source: ItemSource,
      visualType?: Visual['type'],
      context?: string,
    ): Promise<boolean> => {
      const d = depsRef.current;
      if (!d.aiOn()) {
        dispatch({
          type: 'NOTICE',
          notice: {
            kind: 'error',
            query: subject,
            message: 'AI drawing is off. Add your OpenRouter key in Settings and switch AI on.',
          },
        });
        return false;
      }
      const ac = fresh();
      dispatch({ type: 'BUSY', label: `Drawing ${subject}…` });
      try {
        const r = await generateVisual(d.ai(), subject, { visualType, context, signal: ac.signal });
        if (ac.signal.aborted) return false;
        if (r.spend) d.onSpend(r.spend);
        dispatch({
          type: 'SHOW',
          item: {
            kind: 'visual',
            id: `ai:${visualType ?? 'auto'}:${subject.toLowerCase()}`,
            visual: r.visual,
            origin: 'ai',
          },
          source,
          query: subject,
          detail: r.cached
            ? 'AI · from cache (free)'
            : `AI · ${d.ai().model.split('/').pop()}${r.costUsd ? ` · $${r.costUsd.toFixed(5)}` : ''}`,
        });
        return true;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return false;
        dispatch({
          type: 'NOTICE',
          notice: { kind: 'error', query: subject, message: (e as Error).message },
        });
        return false;
      }
    },
    [],
  );

  /** Typed text, a summon gesture, or a library-less request: always gives visible feedback. */
  const resolve = useCallback(
    async (text: string, source: ItemSource) => {
      const intent = parseIntent(text);
      switch (intent.kind) {
        case 'command':
          dispatch({ type: cmdEvent[intent.cmd] } as SessionEvent);
          return;
        case 'picture':
          await picture(intent.subject, source, true);
          return;
        case 'generate': {
          if (!intent.visualType) {
            const m = match(intent.subject, catalog);
            if (m.status === 'match') return showCurated(m.conceptId, source, intent.subject);
          }
          await generate(intent.subject, source, intent.visualType);
          return;
        }
        case 'topic':
        case 'plain': {
          const q = intent.kind === 'topic' ? intent.subject : intent.text;
          const m = match(q, catalog);
          if (m.status === 'match') return showCurated(m.conceptId, source, q);
          if (m.status === 'ambiguous') {
            dispatch({
              type: 'NOTICE',
              notice: { kind: 'ambiguous', query: q, candidates: m.candidates.slice(0, 3) },
            });
            return;
          }
          if (m.status === 'invalid') {
            dispatch({ type: 'NOTICE', notice: { kind: 'invalid', query: q, reason: m.reason } });
            return;
          }
          if (source === 'gesture') {
            // "dinosaur" + zoom gesture: a topic gets a diagram, a thing gets a picture.
            if (intent.kind === 'topic' && depsRef.current.aiOn()) await generate(q, source);
            else await picture(q, source, true);
            return;
          }
          if (intent.kind === 'topic' && depsRef.current.aiOn()) {
            await generate(q, source);
            return;
          }
          dispatch({ type: 'NOTICE', notice: { kind: 'none', query: q, suggestions: m.suggestions } });
        }
      }
    },
    [generate, picture, showCurated],
  );

  /** One finished spoken phrase. */
  const onUtterance = useCallback(
    (text: string) => {
      transcriptRef.current = [...transcriptRef.current, text].slice(-6);
      const intent = parseIntent(text);
      if (intent.kind === 'command') {
        dispatch({ type: cmdEvent[intent.cmd] } as SessionEvent);
        return;
      }
      const callout = intent.kind === 'plain' ? calloutOf(text) : intent.subject;
      dispatch({ type: 'PENDING', text: callout || undefined });
      if (!depsRef.current.autoMode()) return; // manual: wait for a summon gesture

      const now = Date.now();
      if (intent.kind === 'picture' || intent.kind === 'generate') {
        lastAutoRef.current = now;
        dispatch({ type: 'PENDING', text: undefined });
        void resolve(text, 'speech');
        return;
      }
      const q = intent.kind === 'topic' ? intent.subject : intent.text;
      const m = match(q, catalog);
      const cur = currentEntry(stateRef.current);
      if (m.status === 'match') {
        if (cur?.item.id === `c:${m.conceptId}`) return;
        if (now - lastAutoRef.current < AUTO_COOLDOWN_MS && intent.kind !== 'topic') return;
        lastAutoRef.current = now;
        dispatch({ type: 'PENDING', text: undefined });
        showCurated(m.conceptId, 'speech', q);
        return;
      }
      // "Let me explain X" with no curated match → AI draws it.
      if (intent.kind === 'topic' && depsRef.current.aiOn()) {
        lastAutoRef.current = now;
        dispatch({ type: 'PENDING', text: undefined });
        void generate(q, 'speech', undefined, transcriptRef.current.slice(-2).join(' '));
      }
    },
    [generate, resolve, showCurated],
  );

  const summon = useCallback(() => {
    const p = stateRef.current.pending;
    if (!p) {
      dispatch({
        type: 'NOTICE',
        notice: {
          kind: 'info',
          message: 'Say a word first (Listen must be on), then spread your fingers to summon it.',
        },
      });
      return;
    }
    dispatch({ type: 'PENDING', text: undefined });
    void resolve(p, 'gesture');
  }, [resolve]);

  const onGesture = useCallback(
    (a: GestureAction) => {
      switch (a) {
        case 'summon':
          return summon();
        case 'next':
          return dispatch({ type: 'STEP_NEXT' });
        case 'prev':
          return dispatch({ type: 'STEP_PREV' });
        case 'all':
          return dispatch({ type: 'STEP_ALL' });
        case 'clear':
          return dispatch({ type: 'CLEAR' });
        case 'back':
          return dispatch({ type: 'BACK' });
        case 'magic': {
          const recent = transcriptRef.current.slice(-2).join(' ');
          const subject = stateRef.current.pending ?? transcriptRef.current.at(-1);
          if (!subject) {
            dispatch({
              type: 'NOTICE',
              notice: { kind: 'info', message: 'Say something first, then show ✌️ to have AI draw it.' },
            });
            return;
          }
          dispatch({ type: 'PENDING', text: undefined });
          void generate(subject, 'gesture', undefined, recent);
        }
      }
    },
    [generate, summon],
  );

  return { state, dispatch, resolve, onUtterance, onGesture, summon, generate, picture, showCurated };
}
