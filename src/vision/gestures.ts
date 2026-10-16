/**
 * Gesture interpretation on top of MediaPipe's GestureRecognizer output. Pure and testable:
 * feed it one frame at a time, it emits at most one action per frame.
 */
export type GestureAction = 'summon' | 'next' | 'prev' | 'all' | 'clear' | 'back' | 'magic';

export interface HandFrame {
  /** MediaPipe category name: Open_Palm, Closed_Fist, Pointing_Up, Thumb_Up, Thumb_Down, Victory, ILoveYou, None */
  gesture: string;
  score: number;
  /** Thumb tip ↔ index tip distance divided by hand size (wrist ↔ middle knuckle). */
  pinch: number;
  t: number;
}

const HOLD: Record<string, [GestureAction, number]> = {
  Thumb_Up: ['next', 350],
  Thumb_Down: ['prev', 350],
  Pointing_Up: ['all', 600],
  Open_Palm: ['clear', 1300],
  Closed_Fist: ['back', 900],
  Victory: ['magic', 600],
};

export const GESTURE_HELP: { gesture: string; emoji: string; action: string }[] = [
  { gesture: 'Pinch, then spread fingers', emoji: '🤏→🖐', action: 'Summon what you just said' },
  { gesture: 'Thumb up', emoji: '👍', action: 'Next step' },
  { gesture: 'Thumb down', emoji: '👎', action: 'Previous step' },
  { gesture: 'Point up', emoji: '☝️', action: 'Show all steps' },
  { gesture: 'Victory', emoji: '✌️', action: 'AI: draw what I just said' },
  { gesture: 'Fist (hold)', emoji: '✊', action: 'Previous visual' },
  { gesture: 'Open palm (hold)', emoji: '✋', action: 'Clear the board' },
];

export class GestureInterpreter {
  private held?: { gesture: string; since: number; fired: boolean };
  private pinchedAt?: number;
  private cooldownUntil = 0;

  constructor(
    private readonly cooldownMs = 1200,
    private readonly minScore = 0.6,
  ) {}

  push(f: HandFrame | undefined): GestureAction | undefined {
    if (!f) {
      this.held = undefined;
      return undefined;
    }
    // Zoom/spread: pinch closed (< 0.35) then opened wide (> 0.9) within 900 ms.
    if (f.pinch < 0.35) this.pinchedAt = f.t;
    else if (f.pinch > 0.9 && this.pinchedAt && f.t - this.pinchedAt < 900) {
      this.pinchedAt = undefined;
      return this.fire('summon', f.t);
    }
    const g = f.score >= this.minScore ? f.gesture : 'None';
    if (!this.held || this.held.gesture !== g) this.held = { gesture: g, since: f.t, fired: false };
    const rule = HOLD[g];
    if (rule && !this.held.fired && f.t - this.held.since >= rule[1]) {
      this.held.fired = true;
      return this.fire(rule[0], f.t);
    }
    return undefined;
  }

  private fire(a: GestureAction, t: number): GestureAction | undefined {
    if (t < this.cooldownUntil) return undefined;
    this.cooldownUntil = t + this.cooldownMs;
    return a;
  }
}
