/** Per-browser settings. The API key never leaves this browser except to openrouter.ai (ADR-005). */
export interface AiSettings {
  apiKey: string;
  model: string;
  /** Hard cap on AI calls per minute — protects the credit balance during live speech. */
  maxPerMinute: number;
}

export const MODEL_PRESETS = [
  { id: 'google/gemini-2.5-flash-lite', note: 'very cheap, fast (default)' },
  { id: 'google/gemini-3.1-flash-lite', note: 'cheap, newer' },
  { id: 'openai/gpt-4o-mini', note: 'cheap, reliable JSON' },
  { id: 'google/gemini-2.5-flash', note: 'smarter, ~3× cost' },
];

const KEY = 'fm.ai.settings';
const SPEND = 'fm.ai.spend';
const CACHE = 'fm.ai.cache.v1';

export const defaultSettings: AiSettings = { apiKey: '', model: MODEL_PRESETS[0]!.id, maxPerMinute: 6 };

function read<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}
function write(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage unavailable: keep in memory only */
  }
}

export const loadSettings = () => read<AiSettings>(KEY, defaultSettings);
export const saveSettings = (s: AiSettings) => write(KEY, s);

export interface Spend {
  calls: number;
  usd: number;
}
export const loadSpend = () => read<Spend>(SPEND, { calls: 0, usd: 0 });
export function addSpend(usd: number): Spend {
  const s = loadSpend();
  const next = { calls: s.calls + 1, usd: s.usd + (Number.isFinite(usd) ? usd : 0) };
  write(SPEND, next);
  return next;
}
export const resetSpend = () => write(SPEND, { calls: 0, usd: 0 });

type Cache = Record<string, unknown>;
export function cacheGet(key: string): unknown {
  return read<Cache>(CACHE, {})[key];
}
export function cachePut(key: string, value: unknown) {
  const c = read<Cache>(CACHE, {});
  c[key] = value;
  const keys = Object.keys(c);
  for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete c[k];
  write(CACHE, c);
}
