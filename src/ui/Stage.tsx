import { useEffect, useState, type RefObject } from 'react';
import { catalog } from '../content/catalog';
import type { Picture } from '../domain/types';
import { RenderBoundary, VisualView } from '../renderers/VisualView';
import { currentEntry, itemMaxStep, type Notice, type SessionState } from '../session/session';
import type { CameraLayout, StageEffect, Theme } from './prefs';
import s from './Stage.module.css';

interface Props {
  state: SessionState;
  theme: Theme;
  effect: StageEffect;
  cameraOn: boolean;
  cameraLayout: CameraLayout;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  captions?: { interim: string; last?: string };
  flash?: string;
  onExample: (text: string) => void;
  onPick: (id: string) => void;
  onDismiss: () => void;
  onLibrary: () => void;
  onRenderFailed: () => void;
  onSummon: () => void;
}

export const EXAMPLES = [
  'TCP handshake',
  'water cycle',
  'picture of a dinosaur',
  'flowchart of making tea',
  'list of planets',
];

function PictureView({ p }: { p: Picture }) {
  return (
    <figure className={s.picture}>
      <div className={s.frame}>
        <img src={p.imageUrl} alt={p.title} referrerPolicy="no-referrer" />
      </div>
      <figcaption>
        <strong>{p.title}</strong>
        {p.caption && <span>{p.caption}</span>}
        <small>
          {p.credit}
          {p.pageUrl && (
            <>
              {' · '}
              <a href={p.pageUrl} target="_blank" rel="noreferrer noopener">
                source
              </a>
            </>
          )}
        </small>
      </figcaption>
    </figure>
  );
}

function NoticeCard({
  n,
  onPick,
  onExample,
  onDismiss,
  onLibrary,
}: { n: Notice } & Pick<Props, 'onPick' | 'onExample' | 'onDismiss' | 'onLibrary'>) {
  const title = (id: string) => catalog.get(id)?.title ?? id;
  let body: React.ReactNode;
  switch (n.kind) {
    case 'none':
      body = (
        <>
          <p>
            I don't have a visual for “{n.query}” yet.
            {n.suggestions.length > 0 && ' Did you mean:'}
          </p>
          <div className={s.choices}>
            {n.suggestions.slice(0, 3).map((id) => (
              <button key={id} onClick={() => onPick(id)}>
                {title(id)}
              </button>
            ))}
            <button onClick={() => onExample(`diagram of ${n.query}`)}>✨ Ask AI to draw it</button>
            <button onClick={() => onExample(`picture of ${n.query}`)}>🖼 Find a picture</button>
            <button onClick={onLibrary}>Browse the library</button>
          </div>
        </>
      );
      break;
    case 'ambiguous':
      body = (
        <>
          <p>“{n.query}” could mean:</p>
          <div className={s.choices}>
            {n.candidates.map((id) => (
              <button key={id} onClick={() => onPick(id)}>
                {title(id)}
              </button>
            ))}
          </div>
        </>
      );
      break;
    case 'invalid':
      body = (
        <p>
          {n.reason === 'empty'
            ? 'Type a concept to begin.'
            : n.reason === 'too_long'
              ? 'Please keep it under 200 characters.'
              : 'Try a concept name, for example “DNS lookup”.'}
        </p>
      );
      break;
    case 'error':
      body = <p>{n.message}</p>;
      break;
    case 'info':
      body = <p>{n.message}</p>;
  }
  return (
    <div
      className={`${s.notice} ${n.kind === 'error' ? s.noticeError : ''}`}
      role={n.kind === 'error' ? 'alert' : 'status'}
    >
      {body}
      <button className={s.close} onClick={onDismiss} aria-label="Dismiss message">
        ✕
      </button>
    </div>
  );
}

export function Stage(p: Props) {
  const { state } = p;
  const entry = currentEntry(state);
  const max = entry ? itemMaxStep(entry.item) : 0;
  const [hint, setHint] = useState(true);

  useEffect(() => {
    if (!state.presentMode) return;
    setHint(true);
    let t = setTimeout(() => setHint(false), 3000);
    const wake = () => {
      setHint(true);
      clearTimeout(t);
      t = setTimeout(() => setHint(false), 3000);
    };
    window.addEventListener('mousemove', wake);
    window.addEventListener('keydown', wake);
    return () => {
      clearTimeout(t);
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('keydown', wake);
    };
  }, [state.presentMode]);

  const presenter = p.cameraOn && p.cameraLayout === 'presenter';
  return (
    <section
      className={`${s.stage} ${state.presentMode ? s.present : ''}`}
      data-theme={p.theme}
      data-effect={p.effect}
      aria-label="Canvas"
    >
      <div className={s.backdrop} aria-hidden="true" />
      <canvas
        ref={p.canvasRef}
        className={`${s.camera} ${s[`cam_${p.cameraLayout}`]}`}
        hidden={!p.cameraOn}
        aria-label="Your camera"
      />

      <div className={`${s.content} ${presenter ? s.contentSide : ''}`}>
        {entry ? (
          <div key={entry.item.id} className={s.item}>
            {entry.item.kind === 'visual' ? (
              <RenderBoundary onError={p.onRenderFailed} resetKey={entry.item.id}>
                {entry.item.visual.type !== 'cycle' && (
                  <h2 className={s.vTitle}>{entry.item.visual.title}</h2>
                )}
                <div className={s.svgWrap}>
                  <VisualView v={entry.item.visual} step={entry.step} uid={`st-${state.cursor}`} />
                </div>
              </RenderBoundary>
            ) : (
              <PictureView p={entry.item.picture} />
            )}
            <div className={s.burst} aria-hidden="true">
              {Array.from({ length: 14 }, (_, i) => (
                <i key={i} style={{ ['--i' as string]: i } as React.CSSProperties} />
              ))}
            </div>
          </div>
        ) : (
          !state.busy && (
            <div className={s.empty}>
              <p className={s.emptyTitle}>
                {state.cleared ? 'The board is clear.' : 'Say it, type it, or wave it into being.'}
              </p>
              <p className={s.emptySub}>
                {state.cleared ? 'Press [ to bring the last visual back.' : 'Try one of these:'}
              </p>
              {!state.cleared && (
                <div className={s.choices}>
                  {EXAMPLES.map((e) => (
                    <button key={e} onClick={() => p.onExample(e)}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {state.busy && (
        <div className={s.busy} role="status">
          <span className={s.orb} aria-hidden="true" />
          {state.busy}
        </div>
      )}

      {state.pending && (
        <button className={s.pending} onClick={p.onSummon} title="Spread your fingers (or press S) to summon">
          <span aria-hidden="true">🖐</span> Summon “{state.pending}”
        </button>
      )}

      {p.flash && (
        <div key={p.flash} className={s.flash} aria-live="polite">
          {p.flash}
        </div>
      )}

      {state.notice && (
        <NoticeCard
          n={state.notice}
          onPick={p.onPick}
          onExample={p.onExample}
          onDismiss={p.onDismiss}
          onLibrary={p.onLibrary}
        />
      )}

      {p.captions && (p.captions.interim || p.captions.last) && (
        <div className={s.captions} aria-live="off">
          {p.captions.interim || p.captions.last}
        </div>
      )}

      {entry && max > 1 && (
        <div className={s.dots} aria-hidden="true">
          {Array.from({ length: max }, (_, i) => (
            <i key={i} className={i < entry.step ? s.dotOn : ''} />
          ))}
        </div>
      )}

      {state.presentMode && (
        <div className={`${s.hint} ${hint ? '' : s.hintHidden}`}>Esc to exit · ← → steps · / to type</div>
      )}
    </section>
  );
}
