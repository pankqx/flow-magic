import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  loadSettings,
  loadSpend,
  resetSpend,
  saveSettings,
  type AiSettings,
  type Spend,
} from '../ai/settings';
import { currentEntry, itemMaxStep } from '../session/session';
import { useSpeech } from '../speech/useSpeech';
import type { GestureAction } from '../vision/gestures';
import { HelpDrawer, LibraryDrawer, SettingsDrawer } from './Drawers';
import { loadPrefs, savePrefs, type Prefs } from './prefs';
import { EXAMPLES, Stage } from './Stage';
import { useCamera } from './useCamera';
import { useController } from './useController';
import s from './shell.module.css';

type DrawerKind = 'library' | 'settings' | 'help';

const GESTURE_LABEL: Record<GestureAction, string> = {
  summon: '🖐 Summon',
  next: '👍 Next step',
  prev: '👎 Previous step',
  all: '☝️ Show all',
  clear: '✋ Clear',
  back: '✊ Previous visual',
  magic: '✌️ AI magic',
};

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);

export function App() {
  const [prefs, setPrefsState] = useState<Prefs>(loadPrefs);
  const [ai, setAiState] = useState<AiSettings>(loadSettings);
  const [spend, setSpend] = useState<Spend>(loadSpend);
  const [listen, setListen] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [drawer, setDrawer] = useState<DrawerKind>();
  const [quick, setQuick] = useState(false);
  const [text, setText] = useState('');
  const [flash, setFlash] = useState<string>();
  const [lastHeard, setLastHeard] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const quickRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const presentBtnRef = useRef<HTMLButtonElement>(null);

  const setPrefs = useCallback((f: Partial<Prefs>) => {
    setPrefsState((p) => {
      const n = { ...p, ...f };
      savePrefs(n);
      return n;
    });
  }, []);
  const setAi = useCallback((a: AiSettings) => {
    setAiState(a);
    saveSettings(a);
  }, []);

  const aiReady = prefs.aiEnabled && ai.apiKey.length > 10;
  const live = useRef({ ai, aiReady, auto: prefs.autoMode });
  live.current = { ai, aiReady, auto: prefs.autoMode };

  const ctrl = useController({
    ai: () => live.current.ai,
    aiOn: () => live.current.aiReady,
    autoMode: () => live.current.auto,
    onSpend: setSpend,
  });
  const { state, dispatch } = ctrl;
  const entry = currentEntry(state);
  const max = entry ? itemMaxStep(entry.item) : 0;

  // ---- speech ----
  const onFinal = useCallback(
    (t: string) => {
      setLastHeard(t);
      ctrl.onUtterance(t);
    },
    [ctrl],
  );
  const speech = useSpeech(listen, prefs.lang, onFinal);
  useEffect(() => {
    if (speech.status === 'error') setListen(false);
  }, [speech.status]);

  // ---- camera ----
  const showFlash = useCallback((t: string) => {
    setFlash(`${t}#${Date.now()}`);
  }, []);
  const onGesture = useCallback(
    (a: GestureAction) => {
      showFlash(GESTURE_LABEL[a]);
      ctrl.onGesture(a);
    },
    [ctrl, showFlash],
  );
  const camOpts = useMemo(
    () => ({
      gestures: true,
      face: prefs.faceFilter,
      color: prefs.colorFilter,
      removeBackground: prefs.removeBackground,
      wand: prefs.wand,
    }),
    [prefs.faceFilter, prefs.colorFilter, prefs.removeBackground, prefs.wand],
  );
  const camera = useCamera(canvasRef, cameraOn, camOpts, onGesture);
  useEffect(() => {
    if (camera.status.state === 'error') {
      dispatch({
        type: 'NOTICE',
        notice: { kind: 'error', query: '', message: camera.status.message ?? 'Camera problem.' },
      });
      if (camera.status.message?.startsWith('Camera permission')) setCameraOn(false);
    }
  }, [camera.status, dispatch]);

  // ---- present mode + fullscreen ----
  const setPresent = useCallback(
    (on: boolean) => {
      dispatch({ type: 'TOGGLE_PRESENT', value: on });
      if (on) document.documentElement.requestFullscreen?.().catch(() => undefined);
      else {
        if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
        setQuick(false);
        setTimeout(() => presentBtnRef.current?.focus(), 0);
      }
    },
    [dispatch],
  );
  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) {
        dispatch({ type: 'TOGGLE_PRESENT', value: false });
        setQuick(false);
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, [dispatch]);

  // ---- submit ----
  const submit = useCallback(
    (t: string) => {
      const v = t.trim();
      if (!v) {
        dispatch({ type: 'NOTICE', notice: { kind: 'invalid', query: '', reason: 'empty' } });
        return;
      }
      void ctrl.resolve(v, 'typed');
    },
    [ctrl, dispatch],
  );
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(text);
    setText('');
    // Hand the keyboard back to the stage so arrows/shortcuts work straight away while presenting.
    inputRef.current?.blur();
  };

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Escape') {
        if (quick) return setQuick(false);
        if (drawer) return;
        if (state.notice) return dispatch({ type: 'DISMISS_NOTICE' });
        if (isTyping(e.target)) return (e.target as HTMLElement).blur();
        if (state.presentMode) return setPresent(false);
        return;
      }
      if (isTyping(e.target) || drawer) return;
      const k = e.key;
      const act = (f: () => void) => {
        e.preventDefault();
        f();
      };
      if (k === '/') return act(() => (state.presentMode ? setQuick(true) : inputRef.current?.focus()));
      if (k === 'ArrowRight' || k === ' ') return act(() => dispatch({ type: 'STEP_NEXT' }));
      if (k === 'ArrowLeft') return act(() => dispatch({ type: 'STEP_PREV' }));
      if (k === ']') return act(() => dispatch({ type: 'FORWARD' }));
      if (k === '[') return act(() => dispatch({ type: 'BACK' }));
      if (k === '?') return act(() => setDrawer('help'));
      switch (k.toLowerCase()) {
        case 'a':
          return act(() => dispatch({ type: 'STEP_ALL' }));
        case 'c':
          return act(() => dispatch({ type: 'CLEAR' }));
        case 'l':
          return act(() => setDrawer('library'));
        case 'f':
          return act(() => setPresent(!state.presentMode));
        case 's':
          return act(() => ctrl.summon());
        case 'm':
          return act(() => setListen((v) => !v));
        case 'v':
          return act(() => setCameraOn((v) => !v));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ctrl, dispatch, drawer, quick, setPresent, state.notice, state.presentMode]);

  useEffect(() => {
    if (quick) quickRef.current?.focus();
  }, [quick]);

  const status = state.busy
    ? state.busy
    : entry
      ? `Showing: ${entry.item.kind === 'visual' ? entry.item.visual.title : entry.item.picture.title}${entry.detail ? ` · ${entry.detail}` : ''}`
      : state.cleared
        ? 'Board cleared'
        : 'Nothing on stage yet';

  const titleOf = (i: number) => {
    const it = state.history[i]!.item;
    return it.kind === 'visual' ? it.visual.title : it.picture.title;
  };

  return (
    <div className={s.app}>
      <header className={s.header}>
        <div className={s.brand}>
          <span className={s.logo} aria-hidden="true">
            ✦
          </span>
          Flow <em>&amp;</em> Magic
        </div>
        <input
          className={s.title}
          value={state.title}
          aria-label="Session title"
          onChange={(e) => dispatch({ type: 'SET_TITLE', title: e.target.value })}
        />
        <div className={s.headerRight}>
          <span className={s.spendPill} title="OpenRouter spend tracked in this browser">
            {aiReady ? `AI · $${spend.usd.toFixed(4)}` : 'AI off'}
          </span>
          <button className={s.btn} onClick={() => setDrawer('library')}>
            Library
          </button>
          <button className={s.btn} onClick={() => setDrawer('settings')}>
            Settings
          </button>
          <button className={s.btn} onClick={() => setDrawer('help')} aria-label="Help">
            ?
          </button>
          <button className={s.btn} onClick={() => dispatch({ type: 'RESET' })}>
            New
          </button>
          <button ref={presentBtnRef} className={`${s.btn} ${s.primary}`} onClick={() => setPresent(true)}>
            Present
          </button>
        </div>
      </header>

      <aside className={s.side}>
        <form onSubmit={onSubmit} className={s.inputForm}>
          <label htmlFor="concept" className={s.label}>
            Concept, picture or diagram
          </label>
          <div className={s.row}>
            <input
              id="concept"
              ref={inputRef}
              value={text}
              maxLength={200}
              autoComplete="off"
              placeholder="e.g. DNS lookup"
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className={`${s.btn} ${s.primary}`}>
              Show
            </button>
          </div>
        </form>

        <div className={s.modes}>
          <button
            className={`${s.mode} ${listen ? s.modeOn : ''}`}
            aria-pressed={listen}
            onClick={() => setListen((v) => !v)}
            disabled={speech.status === 'unsupported'}
          >
            <span aria-hidden="true">🎙</span>
            <b>{listen ? 'Listening' : 'Listen'}</b>
            <small>{speech.status === 'unsupported' ? 'Use Chrome/Edge' : 'M'}</small>
          </button>
          <button
            className={`${s.mode} ${cameraOn ? s.modeOn : ''}`}
            aria-pressed={cameraOn}
            onClick={() => setCameraOn((v) => !v)}
          >
            <span aria-hidden="true">📷</span>
            <b>Camera</b>
            <small>
              {camera.status.state === 'loading'
                ? 'loading…'
                : cameraOn
                  ? camera.hand
                    ? camera.hand.replace('_', ' ')
                    : 'no hand'
                  : 'V'}
            </small>
          </button>
          <button
            className={`${s.mode} ${prefs.autoMode ? s.modeOn : ''}`}
            aria-pressed={prefs.autoMode}
            onClick={() => setPrefs({ autoMode: !prefs.autoMode })}
          >
            <span aria-hidden="true">{prefs.autoMode ? '⚡' : '✋'}</span>
            <b>{prefs.autoMode ? 'Auto' : 'Manual'}</b>
            <small>{prefs.autoMode ? 'appears as you talk' : 'call out + gesture'}</small>
          </button>
          <button
            className={`${s.mode} ${aiReady ? s.modeOn : ''}`}
            aria-pressed={aiReady}
            onClick={() => (ai.apiKey ? setPrefs({ aiEnabled: !prefs.aiEnabled }) : setDrawer('settings'))}
          >
            <span aria-hidden="true">✨</span>
            <b>AI</b>
            <small>{ai.apiKey ? (prefs.aiEnabled ? ai.model.split('/').pop() : 'off') : 'add key'}</small>
          </button>
        </div>
        {speech.error && <p className={s.warn}>{speech.error}</p>}

        <div className={s.try}>
          <p className={s.label}>Try</p>
          <div className={s.chips}>
            {EXAMPLES.map((e) => (
              <button key={e} onClick={() => submit(e)}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <nav className={s.recent} aria-label="Shown this session">
          <p className={s.label}>This session</p>
          {state.history.length === 0 ? (
            <p className={s.muted}>Visuals you show will be listed here.</p>
          ) : (
            <ol>
              {state.history.map((h, i) => (
                <li key={`${h.item.id}-${i}`}>
                  <button
                    className={i === state.cursor && !state.cleared ? s.current : ''}
                    onClick={() => dispatch({ type: 'GOTO', index: i })}
                  >
                    <span className={s.src} title={h.source}>
                      {h.source === 'speech'
                        ? '🎙'
                        : h.source === 'gesture'
                          ? '🖐'
                          : h.item.kind === 'picture'
                            ? '🖼'
                            : h.item.kind === 'visual' && h.item.origin === 'ai'
                              ? '✨'
                              : '•'}
                    </span>
                    {titleOf(i)}
                  </button>
                </li>
              ))}
            </ol>
          )}
        </nav>
      </aside>

      <main className={s.main}>
        <Stage
          state={state}
          theme={prefs.theme}
          effect={prefs.effect}
          cameraOn={cameraOn}
          cameraLayout={prefs.cameraLayout}
          canvasRef={canvasRef}
          captions={listen && prefs.captions ? { interim: speech.interim, last: lastHeard } : undefined}
          flash={flash?.split('#')[0]}
          onExample={submit}
          onPick={(id) => ctrl.showCurated(id, 'suggestion')}
          onDismiss={() => dispatch({ type: 'DISMISS_NOTICE' })}
          onLibrary={() => setDrawer('library')}
          onRenderFailed={() => dispatch({ type: 'RENDER_FAILED' })}
          onSummon={ctrl.summon}
        />

        <div className={s.controls} role="toolbar" aria-label="Presenter controls">
          <div className={s.group2}>
            <button
              className={s.btn}
              onClick={() => dispatch({ type: 'BACK' })}
              disabled={state.cursor <= 0 && !state.cleared}
              title="["
            >
              ◀ Back
            </button>
            <button
              className={s.btn}
              onClick={() => dispatch({ type: 'FORWARD' })}
              disabled={state.cursor >= state.history.length - 1}
              title="]"
            >
              Forward ▶
            </button>
          </div>
          <div className={s.group2}>
            <button
              className={s.btn}
              onClick={() => dispatch({ type: 'STEP_PREV' })}
              disabled={!entry || entry.step <= 1}
              aria-label="Previous step"
              title="←"
            >
              ‹
            </button>
            <span className={s.stepCount} aria-live="polite">
              {entry ? `Step ${entry.step} / ${max}` : 'Step –'}
            </span>
            <button
              className={s.btn}
              onClick={() => dispatch({ type: 'STEP_NEXT' })}
              disabled={!entry || entry.step >= max}
              aria-label="Next step"
              title="→"
            >
              ›
            </button>
            <button
              className={s.btn}
              onClick={() => dispatch({ type: 'STEP_ALL' })}
              disabled={!entry || entry.step >= max}
              title="A"
            >
              Show all
            </button>
          </div>
          <button className={s.btn} onClick={() => dispatch({ type: 'CLEAR' })} disabled={!entry} title="C">
            Clear
          </button>
          <p className={s.status} aria-live="polite">
            {status}
          </p>
        </div>
      </main>

      {quick && (
        <form
          className={s.quick}
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
            setText('');
            setQuick(false);
          }}
        >
          <input
            ref={quickRef}
            value={text}
            maxLength={200}
            aria-label="Concept"
            placeholder="Type and press Enter…"
            onChange={(e) => setText(e.target.value)}
            onBlur={() => setQuick(false)}
          />
        </form>
      )}

      {drawer === 'library' && (
        <LibraryDrawer
          onClose={() => setDrawer(undefined)}
          onPick={(id) => {
            ctrl.showCurated(id, 'library');
            setDrawer(undefined);
          }}
          onTry={(t) => {
            submit(t);
            setDrawer(undefined);
          }}
        />
      )}
      {drawer === 'settings' && (
        <SettingsDrawer
          prefs={prefs}
          setPrefs={setPrefs}
          ai={ai}
          setAi={setAi}
          spend={spend}
          onResetSpend={() => {
            resetSpend();
            setSpend(loadSpend());
          }}
          onClose={() => setDrawer(undefined)}
        />
      )}
      {drawer === 'help' && <HelpDrawer onClose={() => setDrawer(undefined)} />}
    </div>
  );
}
