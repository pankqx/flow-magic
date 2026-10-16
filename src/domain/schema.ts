import { z } from 'zod';

/**
 * Zod mirror of schemas/concept.schema.json (curated content) plus the runtime-only
 * visual types (list, mindmap) that AI generation may produce. Everything that reaches a
 * renderer has passed through one of these schemas first (ADR-003).
 */

export const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .max(60);
const step = z.number().int().min(1).max(50);
const label = z.string().min(1).max(80);
const visualBase = { title: label, description: z.string().min(20).max(600) };

export const flowNode = z.strictObject({
  id: slug,
  label,
  col: z.number().int().min(1).max(6),
  row: z.number().int().min(1).max(4),
  kind: z.enum(['process', 'store', 'external', 'output']).optional(),
  step,
});
export const flowEdge = z.strictObject({
  id: slug,
  from: slug,
  to: slug,
  label: z.string().max(40).optional(),
  step,
});
export const flowVisual = z.strictObject({
  type: z.literal('flow'),
  ...visualBase,
  nodes: z.array(flowNode).min(2).max(12),
  edges: z.array(flowEdge).min(1).max(20),
});
export const sequenceVisual = z.strictObject({
  type: z.literal('sequence'),
  ...visualBase,
  actors: z
    .array(z.strictObject({ id: slug, label }))
    .min(2)
    .max(6),
  messages: z
    .array(z.strictObject({ id: slug, from: slug, to: slug, label, step }))
    .min(1)
    .max(20),
});
const ringItem = z.strictObject({ id: slug, label, detail: z.string().max(120).optional(), step });
export const cycleVisual = z.strictObject({
  type: z.literal('cycle'),
  ...visualBase,
  direction: z.enum(['clockwise', 'counterclockwise']).optional(),
  nodes: z.array(ringItem).min(3).max(8),
});
export const layersVisual = z.strictObject({
  type: z.literal('layers'),
  ...visualBase,
  layers: z.array(ringItem).min(2).max(10),
});

/** Runtime-only types (AI or future content). Not allowed in content/concepts until the JSON Schema adds them. */
export const listVisual = z.strictObject({
  type: z.literal('list'),
  ...visualBase,
  ordered: z.boolean().optional(),
  items: z.array(ringItem).min(2).max(10),
});
export const mindmapVisual = z.strictObject({
  type: z.literal('mindmap'),
  ...visualBase,
  center: label,
  branches: z
    .array(
      z.strictObject({
        id: slug,
        label,
        step,
        children: z.array(z.string().min(1).max(60)).max(4).optional(),
      }),
    )
    .min(2)
    .max(8),
});

export const curatedVisual = z.discriminatedUnion('type', [
  flowVisual,
  sequenceVisual,
  cycleVisual,
  layersVisual,
]);
export const anyVisual = z.discriminatedUnion('type', [
  flowVisual,
  sequenceVisual,
  cycleVisual,
  layersVisual,
  listVisual,
  mindmapVisual,
]);

export const conceptEntry = z.strictObject({
  schemaVersion: z.literal(1),
  id: slug,
  title: z.string().min(1).max(80),
  summary: z.string().min(1).max(200),
  category: z.enum(['networking', 'software-engineering', 'science']),
  aliases: z.array(z.string().min(1).max(60)).min(1).max(20),
  keywords: z
    .array(z.string().regex(/^[a-z0-9]+$/))
    .min(1)
    .max(30),
  visual: curatedVisual,
  provenance: z.strictObject({
    origin: z.enum(['original', 'adapted', 'generated']),
    license: z.string().min(1),
    author: z.string().min(1),
    sourceUrl: z.url().optional(),
  }),
});
