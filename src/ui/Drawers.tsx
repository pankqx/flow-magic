import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { catalog } from '../content/catalog';
import { MODEL_PRESETS, type AiSettings, type Spend } from '../ai/settings';
import { COLOR_FILTERS } from '../vision/camera';
import { FACE_FILTERS } from '../vision/faceFilters';
import { GESTURE_HELP } from '../vision/gestures';
import { EFFECTS, THEMES, type CameraLayout, type Prefs } from './prefs';
import s from './shell.module.css';

function Drawer({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input, button, select')?.focus();
    return () => prev?.focus?.();
  }, []);
  return (
    <div className={s.scrim} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        className={`${s.drawer} ${wide ? s.drawerWide : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), onClose())}
      >
        <header className={s.drawerHead}>
          <h2>{title}</h2>
          <button className={s.iconBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className={s.drawerBody}>{children}</div>
      </div>
    </div>
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  networking: 'Networking',
  'software-engineering': 'Software engineering',
  science: 'Science',
};

export function LibraryDrawer({
  onPick,
  onTry,
  onClose,
}: {
  onPick: (id: string) => void;
  onTry: (t: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const f = q.trim().toLowerCase();
    const list = catalog
      .list()
      .filter(
        (c) =>
          !f ||
          c.title.toLowerCase().includes(f) ||
          c.aliases.some((a) => a.includes(f)) ||
          c.keywords.includes(f),
      );
    const g = new Map<string, typeof list>();
    for (const c of list) g.set(c.category, [...(g.get(c.category) ?? []), c]);
    return [...g.entries()];
  }, [q]);
  return (
    <Drawer title="Library" onClose={onClose}>
      <label className={s.field}>
        <span>Filter</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. git, network, cycle" />
      </label>
      {groups.length === 0 && <p className={s.muted}>Nothing in the library matches “{q}”.</p>}
      {groups.map(([cat, items]) => (
        <section key={cat} className={s.group}>
          <h3>{CATEGORY_LABEL[cat] ?? cat}</h3>
          <ul className={s.cards}>
            {items.map((c) => (
              <li key={c.id}>
                <button onClick={() => onPick(c.id)}>
                  <strong>{c.title}</strong>
                  <span>{c.summary}</span>
                  <em>{c.visual.type}</em>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className={s.group}>
        <h3>Beyond the library (needs AI or internet)</h3>
        <div className={s.chips}>
          {[
            'picture of the Taj Mahal',
            'flowchart of a login system',
            'mind map of machine learning',
            'list of sorting algorithms',
            'life cycle of a butterfly',
            'layers of the earth',
          ].map((t) => (
            <button key={t} onClick={() => onTry(t)}>
              {t}
            </button>
          ))}
        </div>
      </section>
    </Drawer>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className={s.seg} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          className={value === o.id ? s.on : ''}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className={s.toggle}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}

const LAYOUTS: { id: CameraLayout; label: string }[] = [
  { id: 'bubble', label: 'Bubble' },
  { id: 'corner', label: 'Corner box' },
  { id: 'presenter', label: 'Weather-presenter' },
];

const LANGS = [
  { id: 'en-IN', label: 'English (India)' },
  { id: 'en-US', label: 'English (US)' },
  { id: 'en-GB', label: 'English (UK)' },
];

export function SettingsDrawer(p: {
  prefs: Prefs;
  setPrefs: (f: Partial<Prefs>) => void;
  ai: AiSettings;
  setAi: (a: AiSettings) => void;
  spend: Spend;
  onResetSpend: () => void;
  onClose: () => void;
}) {
  const { prefs, setPrefs, ai, setAi } = p;
  const [showKey, setShowKey] = useState(false);
  return (
    <Drawer title="Settings" onClose={p.onClose} wide>
      <section className={s.group}>
        <h3>Stage look</h3>
        <div className={s.swatches}>
          {THEMES.map((t) => (
            <button
              key={t.id}
              data-swatch={t.id}
              className={prefs.theme === t.id ? s.on : ''}
              aria-pressed={prefs.theme === t.id}
              onClick={() => setPrefs({ theme: t.id })}
            >
              <i />
              {t.label}
            </button>
          ))}
        </div>
        <p className={s.label}>Screen effect</p>
        <Seg
          label="Screen effect"
          value={prefs.effect}
          options={EFFECTS}
          onChange={(effect) => setPrefs({ effect })}
        />
      </section>

      <section className={s.group}>
        <h3>Camera</h3>
        <p className={s.muted}>
          The camera only starts when you press Camera. Video stays in this browser; gesture models download
          from Google the first time.
        </p>
        <p className={s.label}>Where you appear</p>
        <Seg
          label="Camera layout"
          value={prefs.cameraLayout}
          options={LAYOUTS}
          onChange={(cameraLayout) => setPrefs({ cameraLayout })}
        />
        <p className={s.label}>Colour filter</p>
        <Seg
          label="Colour filter"
          value={prefs.colorFilter}
          options={COLOR_FILTERS}
          onChange={(colorFilter) => setPrefs({ colorFilter })}
        />
        <p className={s.label}>Face filter</p>
        <div className={s.emojiGrid}>
          {FACE_FILTERS.map((f) => (
            <button
              key={f.id}
              className={prefs.faceFilter === f.id ? s.on : ''}
              aria-pressed={prefs.faceFilter === f.id}
              title={f.label}
              onClick={() => setPrefs({ faceFilter: f.id })}
            >
              <span aria-hidden="true">{f.emoji}</span>
              <small>{f.label}</small>
            </button>
          ))}
        </div>
        <Toggle
          checked={prefs.removeBackground}
          onChange={(removeBackground) => setPrefs({ removeBackground })}
          label="Remove my background"
          hint="Best with the Weather-presenter layout: you stand on the stage itself. Uses more CPU."
        />
        <Toggle
          checked={prefs.wand}
          onChange={(wand) => setPrefs({ wand })}
          label="Magic wand sparkles on my fingertip"
        />
      </section>

      <section className={s.group}>
        <h3>AI drawing (OpenRouter)</h3>
        <p className={s.muted}>
          Your key is stored only in this browser and sent only to openrouter.ai. Fine for your own demo
          laptop; don't use it on a shared computer.
        </p>
        <Toggle
          checked={prefs.aiEnabled}
          onChange={(aiEnabled) => setPrefs({ aiEnabled })}
          label="Let AI draw things the library doesn't have"
        />
        <label className={s.field}>
          <span>API key</span>
          <div className={s.row}>
            <input
              type={showKey ? 'text' : 'password'}
              value={ai.apiKey}
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-or-…"
              onChange={(e) => setAi({ ...ai, apiKey: e.target.value.trim() })}
            />
            <button className={s.btn} onClick={() => setShowKey((v) => !v)}>
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        <label className={s.field}>
          <span>Model</span>
          <select
            value={MODEL_PRESETS.some((m) => m.id === ai.model) ? ai.model : '__custom'}
            onChange={(e) => e.target.value !== '__custom' && setAi({ ...ai, model: e.target.value })}
          >
            {MODEL_PRESETS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} — {m.note}
              </option>
            ))}
            {!MODEL_PRESETS.some((m) => m.id === ai.model) && (
              <option value="__custom">{ai.model} (custom)</option>
            )}
          </select>
        </label>
        <label className={s.field}>
          <span>Custom model id (optional)</span>
          <input
            placeholder="provider/model"
            defaultValue={MODEL_PRESETS.some((m) => m.id === ai.model) ? '' : ai.model}
            onBlur={(e) => e.target.value.trim() && setAi({ ...ai, model: e.target.value.trim() })}
          />
        </label>
        <label className={s.field}>
          <span>Max AI calls per minute: {ai.maxPerMinute}</span>
          <input
            type="range"
            min={1}
            max={20}
            value={ai.maxPerMinute}
            onChange={(e) => setAi({ ...ai, maxPerMinute: Number(e.target.value) })}
          />
        </label>
        <div className={s.spend}>
          <span>
            Spent in this browser: <strong>${p.spend.usd.toFixed(4)}</strong> over {p.spend.calls} call
            {p.spend.calls === 1 ? '' : 's'}. Repeated topics come from the cache for free.
          </span>
          <button className={s.btn} onClick={p.onResetSpend}>
            Reset counter
          </button>
        </div>
      </section>

      <section className={s.group}>
        <h3>Voice</h3>
        <p className={s.muted}>
          Uses your browser's speech recognition (best in Chrome or Edge). Chrome sends the audio to Google to
          transcribe it.
        </p>
        <Seg label="Language" value={prefs.lang} options={LANGS} onChange={(lang) => setPrefs({ lang })} />
        <Toggle
          checked={prefs.captions}
          onChange={(captions) => setPrefs({ captions })}
          label="Show live captions on the stage"
        />
      </section>
    </Drawer>
  );
}

const KEYS: [string, string][] = [
  ['/', 'Type a concept (also works in Present mode)'],
  ['→ / Space', 'Next step'],
  ['←', 'Previous step'],
  ['A', 'Show all steps'],
  ['[ / ]', 'Previous / next visual'],
  ['C', 'Clear the board'],
  ['S', 'Summon the word you just said'],
  ['M', 'Listen on / off'],
  ['V', 'Camera on / off'],
  ['L', 'Library'],
  ['F', 'Present mode'],
  ['?', 'This help'],
];

const PHRASES: [string, string][] = [
  ['“Let me explain DNS”', 'Shows the curated diagram, or asks AI to draw it'],
  ['“…a picture of a dinosaur”', 'Finds a picture on Wikipedia'],
  ['“…a flowchart of making tea”', 'AI draws a flowchart'],
  ['“…a mind map of machine learning”', 'AI draws a mind map'],
  ['“…a list of planets”', 'AI draws a list'],
  ['“Next” · “Previous” · “Show all”', 'Steps through the visual'],
  ['“Clear the board” · “Go back”', 'Clears, or returns to the last visual'],
];

export function HelpDrawer({ onClose }: { onClose: () => void }) {
  return (
    <Drawer title="How to make magic" onClose={onClose} wide>
      <section className={s.group}>
        <h3>Two modes</h3>
        <p>
          <strong>⚡ Auto</strong> — just talk. When you name a topic, it appears by itself.
          <br />
          <strong>✋ Manual</strong> — call out a word (“dinosaur!”), then spread your fingers (pinch, then
          open) or press <kbd>S</kbd> to summon it.
        </p>
      </section>
      <section className={s.group}>
        <h3>Say</h3>
        <dl className={s.table}>
          {PHRASES.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className={s.group}>
        <h3>Gestures (camera on)</h3>
        <dl className={s.table}>
          {GESTURE_HELP.map((g) => (
            <div key={g.gesture}>
              <dt>
                <span aria-hidden="true">{g.emoji}</span> {g.gesture}
              </dt>
              <dd>{g.action}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className={s.group}>
        <h3>Keyboard</h3>
        <dl className={s.table}>
          {KEYS.map(([k, v]) => (
            <div key={k}>
              <dt>
                <kbd>{k}</kbd>
              </dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Drawer>
  );
}
