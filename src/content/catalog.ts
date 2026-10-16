import { conceptEntry } from '../domain/schema';
import type { ConceptEntry } from '../domain/types';
import { semanticProblems } from '../domain/visual';
import { contentTokens, FILLER } from '../matcher/normalise';
import type { ConceptSource } from '../matcher/matcher';

const files = import.meta.glob('../../content/concepts/*.json', { eager: true, import: 'default' });

export interface LoadReport {
  concepts: ConceptEntry[];
  problems: string[];
}

/** Validates raw concept documents with Zod + semantic rules + alias-collision check. */
export function loadConcepts(raw: Record<string, unknown>): LoadReport {
  const problems: string[] = [];
  const concepts: ConceptEntry[] = [];
  const aliasOwner = new Map<string, string>();
  const ids = new Set<string>();
  for (const [path, doc] of Object.entries(raw).sort()) {
    const name = path.split('/').pop()!;
    const parsed = conceptEntry.safeParse(doc);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) problems.push(`${name}: schema: ${issue.path.join('/')}: ${issue.message}`);
      continue;
    }
    const c = parsed.data;
    if (`${c.id}.json` !== name) problems.push(`${name}: id '${c.id}' must match file name`);
    if (ids.has(c.id)) problems.push(`${name}: duplicate id`);
    ids.add(c.id);
    for (const p of semanticProblems(c.visual)) problems.push(`${name}: ${p}`);
    for (const a of c.aliases) {
      const key = contentTokens(a).join(' ');
      if (!key) problems.push(`${name}: alias '${a}' normalises to nothing`);
      else if (aliasOwner.has(key) && aliasOwner.get(key) !== c.id)
        problems.push(`${name}: alias '${a}' collides with concept '${aliasOwner.get(key)}'`);
      else aliasOwner.set(key, c.id);
    }
    for (const k of c.keywords) if (FILLER.has(k)) problems.push(`${name}: keyword '${k}' is a filler word`);
    concepts.push(c);
  }
  return { concepts, problems };
}

const report = loadConcepts(files);
if (report.problems.length && import.meta.env.DEV) console.warn('[content] problems:', report.problems);

const byId = new Map(report.concepts.map((c) => [c.id, c]));

export const catalog: ConceptSource = {
  list: () => report.concepts,
  get: (id) => byId.get(id),
};

export const contentProblems = report.problems;
