import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentEntry } from '../session/session';
import { useController } from './useController';

const deps = (auto: boolean, ai = false) => ({
  ai: () => ({ apiKey: 'k', model: 'test/model', maxPerMinute: 6 }),
  aiOn: () => ai,
  autoMode: () => auto,
  onSpend: () => undefined,
});

const wiki = {
  query: {
    pages: {
      1: {
        index: 1,
        title: 'Dinosaur',
        extract: 'Reptiles.',
        thumbnail: { source: 'https://upload.wikimedia.org/d.jpg' },
      },
    },
  },
};

afterEach(() => vi.unstubAllGlobals());

describe('useController', () => {
  it('auto mode: naming a curated topic while talking shows it', () => {
    const { result } = renderHook(() => useController(deps(true)));
    act(() => result.current.onUtterance('so let me explain the TCP handshake'));
    expect(currentEntry(result.current.state)?.item.id).toBe('c:tcp-handshake');
    expect(currentEntry(result.current.state)?.source).toBe('speech');
  });

  it('auto mode: spoken commands step through the visual', () => {
    const { result } = renderHook(() => useController(deps(true)));
    act(() => result.current.onUtterance('explain the OSI model'));
    act(() => result.current.onUtterance('next'));
    act(() => result.current.onUtterance('next step'));
    expect(currentEntry(result.current.state)?.step).toBe(3);
    act(() => result.current.onUtterance('show all'));
    expect(currentEntry(result.current.state)?.step).toBe(7);
  });

  it('manual mode: a call-out waits for the summon gesture, then finds a picture', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(wiki))),
    );
    const { result } = renderHook(() => useController(deps(false)));
    act(() => result.current.onUtterance('and here comes the dinosaur'));
    expect(result.current.state.pending).toBe('comes the dinosaur'.split(' ').slice(-4).join(' '));
    expect(currentEntry(result.current.state)).toBeUndefined();
    act(() => result.current.onGesture('summon'));
    await waitFor(() => expect(currentEntry(result.current.state)?.item.kind).toBe('picture'));
    expect(result.current.state.pending).toBeUndefined();
  });

  it('summon with nothing called out explains what to do', () => {
    const { result } = renderHook(() => useController(deps(false)));
    act(() => result.current.summon());
    expect(result.current.state.notice?.kind).toBe('info');
  });

  it('typed text with no match and AI off shows suggestions, never a guess', async () => {
    const { result } = renderHook(() => useController(deps(true)));
    await act(() => result.current.resolve('quantum banana', 'typed'));
    expect(result.current.state.notice?.kind).toBe('none');
    expect(currentEntry(result.current.state)).toBeUndefined();
  });

  it('asking for a flowchart with AI off says how to turn AI on', async () => {
    const { result } = renderHook(() => useController(deps(true)));
    await act(() => result.current.resolve('flowchart of making tea', 'typed'));
    expect(result.current.state.notice).toMatchObject({ kind: 'error' });
  });
});
