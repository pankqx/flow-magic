import { z } from 'zod';
import { anyVisual } from '../domain/schema';
import type { Visual } from '../domain/types';
import { semanticProblems } from '../domain/visual';
import { layoutFlow } from '../layout/autoLayout';

/**
 * The model returns a *loose* shape (no ids, no steps, no coordinates). We build the strict
 * descriptor ourselves, then validate it with the same schema the curated content uses.
 * Model output is only ever data; nothing is executed or injected (ADR-003).
 */
const txt = (max: number) => z.string().trim().min(1).transform((s) => (s.length > max ? s.slice(0, max - 1) + '…' : s));
const item = z.object({ label: txt(80), detail: txt(120).optional() });

export const looseVisual = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('flow'),
    title: txt(80),
    description: z.string().optional(),
    nodes: z.array(z.object({ id: z.string().optional(), label: txt(80), kind: z.enum(['process', 'store', 'external', 'output']).optional().catch(undefined) })).min(2).max(12),
    edges: z.array(z.object({ from: z.string(), to: z.string(), label: txt(40).optional() })).min(1).max(20),
  }),
  z.object({
    type: z.literal('sequence'),
    title: txt(80),
    description: z.string().optional(),
    actors: z.array(z.union([z.string(), z.object({ label: z.string() }).transform((a) => a.label)])).min(2).max(6),
    messages: z.array(z.object({ from: z.string(), to: z.string(), label: txt(80) })).min(1).max(20),
  }),
  z.object({ type: z.literal('cycle'), title: txt(80), description: z.string().optional(), nodes: z.array(item).min(3).max(8) }),
  z.object({ type: z.literal('layers'), title: txt(80), description: z.string().optional(), layers: z.array(item).min(2).max(10) }),
  z.object({ type: z.literal('list'), title: txt(80), description: z.string().optional(), ordered: z.boolean().optional(), items: z.array(item).min(2).max(10) }),
  z.object({
    type: z.literal('mindmap'),
    title: txt(80),
    description: z.string().optional(),
    center: txt(80),
    branches: z.array(z.object({ label: txt(80), children: z.array(txt(60)).max(4).optional() })).min(2).max(8),
  }),
]);

function slugify(s: string, i: number, used: Set<string>): string {
  let base =
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || `n${i + 1}`;
  if (!/^[a-z0-9]/.test(base)) base = `n${base}`;
  let id = base;
  for (let k = 2; used.has(id); k++) id = `${base}-${k}`;
  used.add(id);
  return id;
}

function describe(title: string, d: string | undefined, fallback: string): string {
  let s = (d ?? '').trim();
  if (s.length < 20) s = `${title}. ${fallback}`;
  if (s.length < 20) s = s.padEnd(20, '.');
  return s.slice(0, 600);
}

/** Loose model JSON → strict, validated Visual. Throws an Error listing problems. */
export function buildVisual(json: unknown): Visual {
  const loose = looseVisual.parse(json);
  let v: unknown;
  switch (loose.type) {
    case 'flow': {
      const used = new Set<string>();
      const idMap = new Map<string, string>();
      const nodes = loose.nodes.map((n, i) => {
        const id = slugify(n.id ?? n.label, i, used);
        idMap.set((n.id ?? n.label).toLowerCase(), id);
        idMap.set(n.label.toLowerCase(), id);
        return { id, label: n.label, kind: n.kind };
      });
      const resolve = (ref: string) => idMap.get(ref.toLowerCase()) ?? idMap.get(slugify(ref, 0, new Set()));
      const seenPairs = new Set<string>();
      const edges = loose.edges
        .map((e) => ({ from: resolve(e.from), to: resolve(e.to), label: e.label }))
        .filter((e): e is { from: string; to: string; label: string | undefined } => {
          if (!e.from || !e.to || e.from === e.to) return false;
          const key = [e.from, e.to].sort().join('|');
          if (seenPairs.has(key)) return false;
          seenPairs.add(key);
          return true;
        });
      if (!edges.length) throw new Error('flow has no valid edges');
      const placed = layoutFlow(nodes, edges);
      const stepOf = new Map(placed.map((p) => [p.id, p.step]));
      v = {
        type: 'flow',
        title: loose.title,
        description: describe(loose.title, loose.description, placed.map((p) => p.label).join(' → ')),
        nodes: placed.map((p) => ({ id: p.id, label: p.label, col: p.col, row: p.row, step: p.step, ...(p.kind ? { kind: p.kind } : {}) })),
        edges: edges.map((e, i) => ({
          id: `e${i + 1}`,
          from: e.from,
          to: e.to,
          step: Math.max(stepOf.get(e.from)!, stepOf.get(e.to)!),
          ...(e.label ? { label: e.label } : {}),
        })),
      };
      break;
    }
    case 'sequence': {
      const used = new Set<string>();
      const actors = loose.actors.map((a, i) => ({ id: slugify(a, i, used), label: a.slice(0, 80) }));
      const find = (ref: string) =>
        actors.find((a) => a.label.toLowerCase() === ref.toLowerCase() || a.id === ref.toLowerCase())?.id;
      const messages = loose.messages
        .map((m) => ({ from: find(m.from), to: find(m.to), label: m.label }))
        .filter((m) => m.from && m.to && m.from !== m.to)
        .map((m, i) => ({ id: `m${i + 1}`, from: m.from!, to: m.to!, label: m.label, step: i + 1 }));
      v = {
        type: 'sequence',
        title: loose.title,
        description: describe(loose.title, loose.description, messages.map((m) => m.label).join(', then ')),
        actors,
        messages,
      };
      break;
    }
    case 'cycle':
    case 'layers':
    case 'list': {
      const src = loose.type === 'cycle' ? loose.nodes : loose.type === 'layers' ? loose.layers : loose.items;
      const used = new Set<string>();
      const items = src.map((it, i) => ({
        id: slugify(it.label, i, used),
        label: it.label,
        step: i + 1,
        ...(it.detail ? { detail: it.detail } : {}),
      }));
      const key = loose.type === 'cycle' ? 'nodes' : loose.type === 'layers' ? 'layers' : 'items';
      v = {
        type: loose.type,
        title: loose.title,
        description: describe(loose.title, loose.description, items.map((x) => x.label).join(', ')),
        [key]: items,
        ...(loose.type === 'list' && loose.ordered !== undefined ? { ordered: loose.ordered } : {}),
      };
      break;
    }
    case 'mindmap': {
      const used = new Set<string>();
      v = {
        type: 'mindmap',
        title: loose.title,
        center: loose.center,
        description: describe(loose.title, loose.description, loose.branches.map((b) => b.label).join(', ')),
        branches: loose.branches.map((b, i) => ({
          id: slugify(b.label, i, used),
          label: b.label,
          step: i + 1,
          ...(b.children?.length ? { children: b.children } : {}),
        })),
      };
      break;
    }
  }
  const visual = anyVisual.parse(v);
  const problems = semanticProblems(visual);
  if (problems.length) throw new Error(problems.join('; '));
  return visual;
}

/** Extracts the first JSON object from model text (tolerates ```json fences and chatter). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1]! : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no JSON object in model output');
  return JSON.parse(body.slice(start, end + 1));
}
