import { describe, expect, it } from 'vitest';
import fixtures from '../../tests/fixtures/matcher-cases.json';
import { catalog, contentProblems, loadConcepts } from './catalog';
import { match } from '../matcher/matcher';
import tcp from '../../content/concepts/tcp-handshake.json';

describe('curated content', () => {
  it('loads all 12 concepts with no problems', () => {
    expect(contentProblems).toEqual([]);
    expect(catalog.list()).toHaveLength(12);
  });

  const clone = () => JSON.parse(JSON.stringify(tcp));
  it.each([
    ['unknown actor ref', (d: any) => (d.visual.messages[0].from = 'ghost'), /unknown actor/],
    ['duplicate id', (d: any) => (d.visual.actors[1].id = 'client'), /duplicate actor/],
    ['bad category', (d: any) => (d.category = 'cooking'), /category/],
    ['bad step order', (d: any) => (d.visual.messages[0].step = 3), /strictly increasing|contiguous/],
  ])('rejects %s', (_n, mutate, re) => {
    const d = clone();
    mutate(d);
    const r = loadConcepts({ 'x/tcp-handshake.json': d });
    expect(r.problems.join('\n')).toMatch(re);
  });

  it('rejects alias collisions across concepts', () => {
    const a = clone();
    const b = { ...clone(), id: 'other' };
    const r = loadConcepts({ 'x/tcp-handshake.json': a, 'x/other.json': b });
    expect(r.problems.join('\n')).toMatch(/collides/);
  });
});

describe('matcher fixtures (docs/CONCEPT_MATCHING.md)', () => {
  for (const c of fixtures.cases as any[]) {
    const raw: string = c.input ?? c.inputRepeat.char.repeat(c.inputRepeat.count);
    it(`${c.id}: ${JSON.stringify(raw.slice(0, 40))}`, () => {
      const got: any = match(raw, catalog);
      for (const [k, v] of Object.entries(c.expect)) {
        if (k === 'suggestionsInclude') expect(got.suggestions).toEqual(expect.arrayContaining(v as string[]));
        else if (k === 'suggestionsFirst') expect(got.suggestions?.[0]).toBe(v);
        else if (k === 'suggestionsEmpty') expect(got.suggestions).toEqual([]);
        else expect(got[k]).toEqual(v);
      }
    });
  }

  it('never throws on random input', () => {
    const chars = 'abc xyz TCP dns 0123 !?<>/"\'é漢字🙂\n\t';
    for (let i = 0; i < 1500; i++) {
      let s = '';
      const n = Math.floor(Math.random() * 220);
      for (let j = 0; j < n; j++) s += chars[Math.floor(Math.random() * chars.length)];
      expect(() => match(s, catalog)).not.toThrow();
    }
  });
});
