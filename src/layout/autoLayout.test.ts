import { describe, expect, it } from 'vitest';
import { layoutFlow } from './autoLayout';

const chain = (n: number) => {
  const nodes = Array.from({ length: n }, (_, i) => ({ id: `n${i}`, label: `Node ${i}` }));
  const edges = nodes.slice(1).map((nd, i) => ({ from: `n${i}`, to: nd.id }));
  return layoutFlow(nodes, edges);
};

describe('layoutFlow', () => {
  it('keeps a short chain on one row', () => {
    expect(new Set(chain(3).map((n) => n.row))).toEqual(new Set([1]));
  });
  it('wraps a 5-step chain into a 3-wide snake', () => {
    const placed = chain(5);
    expect(Math.max(...placed.map((n) => n.col))).toBe(3);
    expect(Math.max(...placed.map((n) => n.row))).toBe(2);
    // second row runs right-to-left, so the 4th node sits under the 3rd
    expect(placed[3]).toMatchObject({ col: 3, row: 2 });
  });
  it('gives every node a unique cell and steps in chain order', () => {
    const placed = chain(9);
    expect(new Set(placed.map((n) => `${n.col},${n.row}`)).size).toBe(9);
    expect(placed.map((n) => n.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
  it('lays out a branching graph in columns by depth', () => {
    const placed = layoutFlow(
      [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ],
      [
        { from: 'a', to: 'b' },
        { from: 'a', to: 'c' },
      ],
    );
    expect(placed.find((n) => n.id === 'a')).toMatchObject({ col: 1 });
    expect(placed.filter((n) => n.col === 2)).toHaveLength(2);
  });
});
