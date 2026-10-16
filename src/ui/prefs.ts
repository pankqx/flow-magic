import type { ColorFilter } from '../vision/camera';
import type { FaceFilter } from '../vision/faceFilters';

export type Theme = 'chalk' | 'blueprint' | 'whiteboard' | 'neon' | 'notebook';
export type StageEffect = 'none' | 'spotlight' | 'grain' | 'scanlines' | 'aurora';
export type CameraLayout = 'bubble' | 'corner' | 'presenter';

export const THEMES: { id: Theme; label: string }[] = [
  { id: 'chalk', label: 'Chalkboard' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'whiteboard', label: 'Whiteboard' },
  { id: 'neon', label: 'Neon night' },
  { id: 'notebook', label: 'Notebook' },
];
export const EFFECTS: { id: StageEffect; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'grain', label: 'Film grain' },
  { id: 'scanlines', label: 'Retro TV' },
];

/** Per-viewer UI conveniences only (ADR-004 allows non-content preferences in localStorage). */
export interface Prefs {
  theme: Theme;
  effect: StageEffect;
  autoMode: boolean;
  aiEnabled: boolean;
  captions: boolean;
  lang: string;
  cameraLayout: CameraLayout;
  colorFilter: ColorFilter;
  faceFilter: FaceFilter;
  removeBackground: boolean;
  wand: boolean;
}

export const defaultPrefs: Prefs = {
  theme: 'chalk',
  effect: 'none',
  autoMode: true,
  aiEnabled: true,
  captions: true,
  lang: 'en-IN',
  cameraLayout: 'bubble',
  colorFilter: 'none',
  faceFilter: 'none',
  removeBackground: false,
  wand: true,
};

const KEY = 'fm.prefs';
export function loadPrefs(): Prefs {
  try {
    return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return defaultPrefs;
  }
}
export function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
