import type { ConceptEntry, MatchResult } from '../domain/types';
import { MAX_INPUT_LENGTH, FILLER, contentTokens, tokensOf } from './normalise';

/** Seam for Increment 3: anything that can list concepts. */
export interface ConceptSource {
  list(): ConceptEntry[];
  get(id: string): ConceptEntry | undefined;
}

interface Prepared {
  id: string;
  aliases: string[][];
  keywords: Set<string>;
}

const cache = new WeakMap<ConceptSource, Prepared[]>();

function prepare(source: ConceptSource): Prepared[] {
  let p = cache.get(source);
  if (!p) {
    p = source
      .list()
      .map((c) => {
        const seen = new Map<string, string[]>();
        for (const a of c.aliases) {
          const t = contentTokens(a);
          if (t.length) seen.set(t.join(' '), t);
        }
        return {
          id: c.id,
          aliases: [...seen.values()],
          keywords: new Set(contentTokens(c.keywords.join(' '))),
        };
      })
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    cache.set(source, p);
  }
  return p;
}

function containsSeq(seq: string[], sub: string[]): boolean {
  outer: for (let i = 0; i + sub.length <= seq.length; i++) {
    for (let j = 0; j < sub.length; j++) if (seq[i + j] !== sub[j]) continue outer;
    return true;
  }
  return false;
}

/** Deterministic matcher — docs/CONCEPT_MATCHING.md. Never throws. */
export function match(raw: string, source: ConceptSource): MatchResult {
  if (raw == null || raw.trim() === '') return { status: 'invalid', reason: 'empty' };
  if (raw.length > MAX_INPUT_LENGTH) return { status: 'invalid', reason: 'too_long' };
  const all = tokensOf(raw);
  if (all.length === 0) {
    if (/\p{L}/u.test(raw)) return { status: 'none', suggestions: [] };
    return { status: 'invalid', reason: 'no_content' };
  }
  const toks = all.filter((t) => !FILLER.has(t));
  if (toks.length === 0) return { status: 'invalid', reason: 'no_content' };

  const best = new Map<string, [tier: number, len: number]>();
  for (const c of prepare(source)) {
    for (const alias of c.aliases) {
      let cand: [number, number] | undefined;
      if (alias.length === toks.length && alias.every((t, i) => t === toks[i])) cand = [1, alias.length];
      else if (containsSeq(toks, alias)) cand = [2, alias.length];
      if (!cand) continue;
      const cur = best.get(c.id);
      if (!cur || cand[0] < cur[0] || (cand[0] === cur[0] && cand[1] > cur[1])) best.set(c.id, cand);
    }
  }
  if (best.size) {
    const topTier = Math.min(...[...best.values()].map((v) => v[0]));
    const pool = [...best.entries()].filter(([, v]) => v[0] === topTier);
    const topLen = Math.max(...pool.map(([, v]) => v[1]));
    const winners = pool
      .filter(([, v]) => v[1] === topLen)
      .map(([k]) => k)
      .sort();
    if (winners.length === 1) return { status: 'match', conceptId: winners[0]!, tier: topTier as 1 | 2 };
    return { status: 'ambiguous', candidates: winners };
  }

  const scored: [number, string][] = [];
  const set = new Set(toks);
  for (const c of prepare(source)) {
    let shared = 0;
    for (const k of c.keywords) if (set.has(k)) shared++;
    if (shared) scored.push([-shared, c.id]);
  }
  scored.sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : 1));
  return { status: 'none', suggestions: scored.slice(0, 3).map(([, id]) => id) };
}

/** Which alias produced a match, for the "Detected: … (matched '…')" status line. */
export function matchedAlias(raw: string, concept: ConceptEntry): string | undefined {
  const toks = contentTokens(raw);
  let bestAlias: string | undefined;
  let bestLen = 0;
  for (const a of concept.aliases) {
    const t = contentTokens(a);
    if (t.length > bestLen && containsSeq(toks, t)) {
      bestAlias = a;
      bestLen = t.length;
    }
  }
  return bestAlias;
}
