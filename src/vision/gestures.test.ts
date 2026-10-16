import { describe, expect, it } from 'vitest';
import { GestureInterpreter, type HandFrame } from './gestures';

const frames = (g: string, from: number, to: number, pinch = 0.6): HandFrame[] => {
  const out: HandFrame[] = [];
  for (let t = from; t <= to; t += 33) out.push({ gesture: g, score: 0.9, pinch, t });
  return out;
};
const run = (gi: GestureInterpreter, fs: HandFrame[]) => fs.map((f) => gi.push(f)).filter(Boolean);

describe('GestureInterpreter', () => {
  it('fires a held gesture once', () => {
    const gi = new GestureInterpreter();
    expect(run(gi, frames('Thumb_Up', 0, 1500))).toEqual(['next']);
  });
  it('requires the hold time', () => {
    const gi = new GestureInterpreter();
    expect(run(gi, frames('Open_Palm', 0, 900))).toEqual([]);
  });
  it('detects pinch then spread as summon', () => {
    const gi = new GestureInterpreter();
    const fs = [...frames('None', 0, 200, 0.2), ...frames('None', 233, 500, 1.2)];
    expect(run(gi, fs)).toEqual(['summon']);
  });
  it('ignores slow spreads and respects cooldown', () => {
    const gi = new GestureInterpreter();
    expect(run(gi, [...frames('None', 0, 100, 0.2), ...frames('None', 1500, 1600, 1.2)])).toEqual([]);
    const g2 = new GestureInterpreter();
    expect(run(g2, [...frames('Thumb_Up', 0, 500), ...frames('Thumb_Down', 533, 1100)])).toEqual(['next']);
  });
});
