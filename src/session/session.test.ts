import { describe, expect, it } from 'vitest';
import { catalog } from '../content/catalog';
import { MAX_HISTORY, currentEntry, initialState, reducer, type SessionEvent } from './session';
import type { StageItem } from '../domain/types';

const item = (id: string): StageItem => ({
  kind: 'visual',
  id,
  visual: catalog.get(id)!.visual,
  origin: 'curated',
  conceptId: id,
});
const run = (...evs: SessionEvent[]) => evs.reduce(reducer, initialState);
const show = (id: string): SessionEvent => ({ type: 'SHOW', item: item(id), source: 'typed' });

describe('session reducer', () => {
  it('shows at step 1 and steps within bounds', () => {
    let s = run(show('tcp-handshake'));
    expect(currentEntry(s)?.step).toBe(1);
    s = run(show('tcp-handshake'), { type: 'STEP_PREV' });
    expect(currentEntry(s)?.step).toBe(1);
    s = reducer(reducer(s, { type: 'STEP_NEXT' }), { type: 'STEP_NEXT' });
    expect(currentEntry(s)?.step).toBe(3);
    s = reducer(s, { type: 'STEP_ALL' });
    expect(currentEntry(s)?.step).toBe(4);
    s = reducer(s, { type: 'STEP_NEXT' });
    expect(currentEntry(s)?.step).toBe(4);
  });

  it('back/forward restore the last viewed step and new entries truncate forward history', () => {
    let s = run(show('tcp-handshake'), { type: 'STEP_NEXT' }, show('osi-model'), { type: 'BACK' });
    expect(currentEntry(s)?.item.id).toBe('tcp-handshake');
    expect(currentEntry(s)?.step).toBe(2);
    s = reducer(s, { type: 'FORWARD' });
    expect(currentEntry(s)?.item.id).toBe('osi-model');
    s = run(show('tcp-handshake'), show('osi-model'), { type: 'BACK' }, show('water-cycle'));
    expect(s.history.map((h) => h.item.id)).toEqual(['tcp-handshake', 'water-cycle']);
  });

  it('does not duplicate the item already on stage', () => {
    const s = run(show('tcp-handshake'), show('tcp-handshake'));
    expect(s.history).toHaveLength(1);
  });

  it('clear is reversible via back', () => {
    let s = run(show('tcp-handshake'), { type: 'CLEAR' });
    expect(currentEntry(s)).toBeUndefined();
    s = reducer(s, { type: 'BACK' });
    expect(currentEntry(s)?.item.id).toBe('tcp-handshake');
  });

  it('notices keep the current visual', () => {
    const s = run(show('tcp-handshake'), {
      type: 'NOTICE',
      notice: { kind: 'none', query: 'x', suggestions: [] },
    });
    expect(currentEntry(s)?.item.id).toBe('tcp-handshake');
    expect(s.notice?.kind).toBe('none');
  });

  it('render failure keeps the previous valid visual (FR-007)', () => {
    const s = run(show('tcp-handshake'), show('osi-model'), { type: 'RENDER_FAILED' });
    expect(currentEntry(s)?.item.id).toBe('tcp-handshake');
    expect(s.history).toHaveLength(1);
    expect(s.notice?.kind).toBe('error');
  });

  it('caps history and resets', () => {
    let s = initialState;
    const ids = catalog.list().map((c) => c.id);
    for (let i = 0; i < MAX_HISTORY + 10; i++) s = reducer(s, show(ids[i % ids.length]!));
    expect(s.history.length).toBe(MAX_HISTORY);
    expect(s.cursor).toBe(MAX_HISTORY - 1);
    s = reducer(s, { type: 'RESET' });
    expect(s).toEqual(initialState);
  });
});
