import { describe, expect, it } from 'vitest';
import { buildVisual, extractJson } from './build';
import { render } from '@testing-library/react';
import { VisualView } from '../renderers/VisualView';
import { maxStep } from '../domain/visual';

const flow = {
  type: 'flow',
  title: 'User login',
  nodes: [
    { id: 'start', label: 'Open login page' },
    { id: 'enter', label: 'Enter credentials' },
    { id: 'check', label: 'Check password', kind: 'process' },
    { id: 'db', label: 'Users DB', kind: 'store' },
    { id: 'ok', label: 'Dashboard', kind: 'output' },
    { id: 'err', label: 'Show error', kind: 'weird' },
  ],
  edges: [
    { from: 'start', to: 'enter' },
    { from: 'enter', to: 'check' },
    { from: 'check', to: 'db', label: 'lookup' },
    { from: 'check', to: 'ok', label: 'valid' },
    { from: 'check', to: 'err', label: 'invalid' },
    { from: 'err', to: 'enter', label: 'retry' },
    { from: 'Check password', to: 'Users DB' },
  ],
};

describe('AI descriptor builder', () => {
  it('builds a valid, laid-out flow from loose model output (cycles, label refs, bad kinds, duplicates)', () => {
    const v = buildVisual(flow);
    expect(v.type).toBe('flow');
    if (v.type !== 'flow') return;
    expect(v.nodes.every((n) => n.col >= 1 && n.col <= 6 && n.row >= 1 && n.row <= 4)).toBe(true);
    expect(v.edges).toHaveLength(6);
    const { container } = render(<VisualView v={v} step={maxStep(v)} uid="x" />);
    expect(container.querySelectorAll('.fm-node').length).toBe(6);
  });

  it('lays out long chains with the snake fallback', () => {
    const nodes = Array.from({ length: 10 }, (_, i) => ({ id: `n${i}`, label: `Step ${i}` }));
    const edges = nodes.slice(1).map((n, i) => ({ from: `n${i}`, to: n.id }));
    const v = buildVisual({ type: 'flow', title: 'Long', nodes, edges });
    if (v.type !== 'flow') throw new Error();
    const cells = new Set(v.nodes.map((n) => `${n.col},${n.row}`));
    expect(cells.size).toBe(10);
  });

  it.each([
    {
      type: 'list',
      title: 'Sorting algorithms',
      items: [{ label: 'Bubble sort', detail: 'O(n²)' }, { label: 'Merge sort' }],
    },
    {
      type: 'cycle',
      title: 'Life of a butterfly',
      nodes: [{ label: 'Egg' }, { label: 'Larva' }, { label: 'Pupa' }, { label: 'Adult' }],
    },
    {
      type: 'layers',
      title: 'Computer',
      layers: [{ label: 'Apps' }, { label: 'OS' }, { label: 'Hardware' }],
    },
    {
      type: 'sequence',
      title: 'Ordering food',
      actors: ['Customer', 'Waiter', 'Kitchen'],
      messages: [
        { from: 'Customer', to: 'Waiter', label: 'Order' },
        { from: 'waiter', to: 'kitchen', label: 'Ticket' },
      ],
    },
    {
      type: 'mindmap',
      title: 'ML',
      center: 'Machine learning',
      branches: [{ label: 'Supervised', children: ['Regression'] }, { label: 'Unsupervised' }],
    },
  ])('builds $type', (input) => {
    const v = buildVisual(input);
    expect(v.type).toBe(input.type);
    expect(v.description.length).toBeGreaterThanOrEqual(20);
  });

  it('rejects garbage', () => {
    expect(() => buildVisual({ type: 'flow', title: 'x', nodes: [], edges: [] })).toThrow();
    expect(() => buildVisual({ type: 'html', html: '<script>' })).toThrow();
  });

  it('extracts JSON from fenced or chatty output', () => {
    expect(extractJson('Sure!\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('here {"b":2} done')).toEqual({ b: 2 });
    expect(() => extractJson('nothing')).toThrow();
  });
});
