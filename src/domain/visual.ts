import type { Visual } from './types';

/** Highest step number among a visual's elements (1 if none). */
export function maxStep(v: Visual): number {
  const steps: number[] = (() => {
    switch (v.type) {
      case 'flow':
        return [...v.nodes, ...v.edges].map((e) => e.step);
      case 'sequence':
        return v.messages.map((m) => m.step);
      case 'cycle':
        return v.nodes.map((n) => n.step);
      case 'layers':
        return v.layers.map((n) => n.step);
      case 'list':
        return v.items.map((n) => n.step);
      case 'mindmap':
        return v.branches.map((b) => b.step);
    }
  })();
  return Math.max(1, ...steps);
}

/** Semantic rules from tests/reference/validate_content.py. Returns problems (empty = valid). */
export function semanticProblems(v: Visual): string[] {
  const p: string[] = [];
  const uniq = (ids: string[], what: string) => {
    if (new Set(ids).size !== ids.length) p.push(`duplicate ${what} ids`);
  };
  let steps: number[] = [];
  const ordered = (s: number[], what: string) => {
    if (s.some((x, i) => x !== i + 1)) p.push(`${what} steps must be 1..n in order`);
  };
  switch (v.type) {
    case 'flow': {
      uniq(
        v.nodes.map((n) => n.id),
        'node',
      );
      uniq(
        v.edges.map((e) => e.id),
        'edge',
      );
      const ids = new Set(v.nodes.map((n) => n.id));
      const cells = v.nodes.map((n) => `${n.col},${n.row}`);
      if (new Set(cells).size !== cells.length) p.push('two nodes share a grid cell');
      for (const e of v.edges) {
        if (!ids.has(e.from) || !ids.has(e.to)) p.push(`edge ${e.id} references unknown node`);
        if (e.from === e.to) p.push(`edge ${e.id} is a self-loop`);
      }
      const pairs = v.edges.map((e) => [e.from, e.to].sort().join('|'));
      if (new Set(pairs).size !== pairs.length) p.push('two edges connect the same node pair');
      steps = [...v.nodes, ...v.edges].map((x) => x.step);
      break;
    }
    case 'sequence': {
      uniq(
        v.actors.map((a) => a.id),
        'actor',
      );
      uniq(
        v.messages.map((m) => m.id),
        'message',
      );
      const ids = new Set(v.actors.map((a) => a.id));
      for (const m of v.messages) {
        if (!ids.has(m.from) || !ids.has(m.to)) p.push(`message ${m.id} references unknown actor`);
        if (m.from === m.to) p.push(`message ${m.id} is a self-message`);
      }
      steps = v.messages.map((m) => m.step);
      if (steps.some((s, i) => i > 0 && s <= steps[i - 1]!)) p.push('sequence steps must be strictly increasing');
      break;
    }
    case 'cycle':
      uniq(
        v.nodes.map((n) => n.id),
        'node',
      );
      steps = v.nodes.map((n) => n.step);
      ordered(steps, 'cycle');
      break;
    case 'layers':
      uniq(
        v.layers.map((n) => n.id),
        'layer',
      );
      steps = v.layers.map((n) => n.step);
      ordered(steps, 'layer');
      break;
    case 'list':
      uniq(
        v.items.map((n) => n.id),
        'item',
      );
      steps = v.items.map((n) => n.step);
      ordered(steps, 'list');
      break;
    case 'mindmap':
      uniq(
        v.branches.map((n) => n.id),
        'branch',
      );
      steps = v.branches.map((n) => n.step);
      break;
  }
  const distinct = [...new Set(steps)].sort((a, b) => a - b);
  if (distinct.some((s, i) => s !== i + 1)) p.push(`steps must be contiguous from 1 (got ${distinct.join(',')})`);
  return p;
}
