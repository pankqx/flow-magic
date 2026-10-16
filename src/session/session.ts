import type { ItemSource, StageItem } from '../domain/types';
import { maxStep } from '../domain/visual';

export const MAX_HISTORY = 50;

export interface HistoryEntry {
  item: StageItem;
  step: number;
  source: ItemSource;
  query?: string;
  /** Human-readable reason, e.g. `matched "dns lookup"` or `AI · gemini`. */
  detail?: string;
}

export type Notice =
  | { kind: 'none'; query: string; suggestions: string[] }
  | { kind: 'ambiguous'; query: string; candidates: string[] }
  | { kind: 'invalid'; query: string; reason: string }
  | { kind: 'error'; query: string; message: string }
  | { kind: 'info'; message: string };

export interface SessionState {
  title: string;
  history: HistoryEntry[];
  cursor: number;
  cleared: boolean;
  presentMode: boolean;
  notice?: Notice;
  /** Something is loading (AI / picture). */
  busy?: string;
  /** Last called-out phrase, waiting for a summon gesture. */
  pending?: string;
}

export type SessionEvent =
  | { type: 'SHOW'; item: StageItem; source: ItemSource; query?: string; detail?: string }
  | { type: 'NOTICE'; notice: Notice }
  | { type: 'DISMISS_NOTICE' }
  | { type: 'BACK' }
  | { type: 'FORWARD' }
  | { type: 'GOTO'; index: number }
  | { type: 'STEP_NEXT' }
  | { type: 'STEP_PREV' }
  | { type: 'STEP_ALL' }
  | { type: 'CLEAR' }
  | { type: 'RESET' }
  | { type: 'TOGGLE_PRESENT'; value?: boolean }
  | { type: 'RENDER_FAILED' }
  | { type: 'BUSY'; label?: string }
  | { type: 'PENDING'; text?: string }
  | { type: 'SET_TITLE'; title: string };

export const initialState: SessionState = {
  title: 'Untitled session',
  history: [],
  cursor: -1,
  cleared: false,
  presentMode: false,
};

export function itemMaxStep(item: StageItem): number {
  return item.kind === 'visual' ? maxStep(item.visual) : 1;
}

export function currentEntry(s: SessionState): HistoryEntry | undefined {
  return s.cleared || s.cursor < 0 ? undefined : s.history[s.cursor];
}

function setStep(s: SessionState, f: (step: number, max: number) => number): SessionState {
  const e = currentEntry(s);
  if (!e) return s;
  const step = Math.min(Math.max(1, f(e.step, itemMaxStep(e.item))), itemMaxStep(e.item));
  if (step === e.step) return s;
  const history = s.history.slice();
  history[s.cursor] = { ...e, step };
  return { ...s, history };
}

export function reducer(s: SessionState, ev: SessionEvent): SessionState {
  switch (ev.type) {
    case 'SHOW': {
      const cur = currentEntry(s);
      // Re-showing what's already on stage only clears notices (avoids duplicate history from live speech).
      if (cur && cur.item.id === ev.item.id) return { ...s, notice: undefined, busy: undefined };
      let history = s.history.slice(0, s.cursor + 1);
      history.push({ item: ev.item, step: 1, source: ev.source, query: ev.query, detail: ev.detail });
      if (history.length > MAX_HISTORY) history = history.slice(history.length - MAX_HISTORY);
      return {
        ...s,
        history,
        cursor: history.length - 1,
        cleared: false,
        notice: undefined,
        busy: undefined,
      };
    }
    case 'NOTICE':
      return { ...s, notice: ev.notice, busy: undefined };
    case 'DISMISS_NOTICE':
      return { ...s, notice: undefined };
    case 'BACK':
      if (s.cleared && s.cursor >= 0) return { ...s, cleared: false };
      return s.cursor > 0 ? { ...s, cursor: s.cursor - 1, cleared: false, notice: undefined } : s;
    case 'FORWARD':
      return s.cursor < s.history.length - 1
        ? { ...s, cursor: s.cursor + 1, cleared: false, notice: undefined }
        : s;
    case 'GOTO':
      return ev.index >= 0 && ev.index < s.history.length
        ? { ...s, cursor: ev.index, cleared: false, notice: undefined }
        : s;
    case 'STEP_NEXT':
      return setStep(s, (st) => st + 1);
    case 'STEP_PREV':
      return setStep(s, (st) => st - 1);
    case 'STEP_ALL':
      return setStep(s, (_st, max) => max);
    case 'CLEAR':
      return { ...s, cleared: true, notice: undefined };
    case 'RESET':
      return { ...initialState };
    case 'TOGGLE_PRESENT':
      return { ...s, presentMode: ev.value ?? !s.presentMode };
    case 'RENDER_FAILED': {
      // FR-007: drop the failed entry and keep the previous valid one visible.
      if (s.cursor < 0) return s;
      const history = s.history.filter((_, i) => i !== s.cursor);
      return {
        ...s,
        history,
        cursor: Math.min(s.cursor - 1, history.length - 1),
        notice: {
          kind: 'error',
          query: '',
          message: "That visual couldn't be drawn, so the previous one is still shown.",
        },
      };
    }
    case 'BUSY':
      return { ...s, busy: ev.label };
    case 'PENDING':
      return { ...s, pending: ev.text };
    case 'SET_TITLE':
      return { ...s, title: ev.title.slice(0, 80) };
  }
}
