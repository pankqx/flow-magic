/**
 * Assigns grid cells (col 1..6, row 1..4) and reveal steps to a flow graph that has none
 * (AI output). Layered layout: column = longest path from a source (back-edges ignored);
 * falls back to a snake grid when the graph is too wide or too tall.
 */
export interface RawNode {
  id: string;
  label: string;
  kind?: 'process' | 'store' | 'external' | 'output';
}
export interface RawEdge {
  from: string;
  to: string;
  label?: string;
}
export interface PlacedNode extends RawNode {
  col: number;
  row: number;
  step: number;
}

export function layoutFlow(nodes: RawNode[], edges: RawEdge[]): PlacedNode[] {
  const ids = nodes.map((n) => n.id);
  const out = new Map(ids.map((id) => [id, [] as string[]]));
  const indeg = new Map(ids.map((id) => [id, 0]));
  // Remove back edges with a DFS so the rest is a DAG.
  const state = new Map<string, number>();
  const dag: RawEdge[] = [];
  const adj = new Map(ids.map((id) => [id, edges.filter((e) => e.from === id)]));
  const visit = (id: string) => {
    state.set(id, 1);
    for (const e of adj.get(id) ?? []) {
      const st = state.get(e.to) ?? 0;
      if (st === 1) continue; // back edge
      dag.push(e);
      if (st === 0) visit(e.to);
    }
    state.set(id, 2);
  };
  for (const id of ids) if (!state.get(id)) visit(id);
  for (const e of dag) {
    out.get(e.from)?.push(e.to);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  }
  // Longest-path ranks via Kahn's algorithm (also gives a topological order for steps).
  const rank = new Map(ids.map((id) => [id, 0]));
  const queue = ids.filter((id) => indeg.get(id) === 0);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const t of out.get(id) ?? []) {
      rank.set(t, Math.max(rank.get(t)!, rank.get(id)! + 1));
      indeg.set(t, indeg.get(t)! - 1);
      if (indeg.get(t) === 0) queue.push(t);
    }
  }
  for (const id of ids) if (!order.includes(id)) order.push(id);

  const byRank = new Map<number, string[]>();
  for (const id of order) {
    const r = rank.get(id)!;
    byRank.set(r, [...(byRank.get(r) ?? []), id]);
  }
  const cols = byRank.size;
  const tallest = Math.max(...[...byRank.values()].map((v) => v.length));
  const pos = new Map<string, { col: number; row: number }>();
  if (cols <= 6 && tallest <= 4) {
    for (const [r, list] of byRank) list.forEach((id, i) => pos.set(id, { col: r + 1, row: i + 1 }));
  } else {
    // Snake: left→right, then right→left, 4 per row (max 12 nodes → 3 rows).
    order.forEach((id, i) => {
      const row = Math.floor(i / 4);
      const c = i % 4;
      pos.set(id, { col: row % 2 === 0 ? c + 1 : 4 - c, row: row + 1 });
    });
  }
  const stepOf = new Map(order.map((id, i) => [id, i + 1]));
  return nodes.map((n) => ({ ...n, ...pos.get(n.id)!, step: stepOf.get(n.id)! }));
}
