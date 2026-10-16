import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { catalog } from '../content/catalog';
import { VisualView } from './VisualView';
import { maxStep } from '../domain/visual';

describe('renderers render every curated concept at every step', () => {
  for (const c of catalog.list()) {
    it(c.id, () => {
      const max = maxStep(c.visual);
      for (let s = 1; s <= max; s++) {
        const { container, unmount } = render(<VisualView v={c.visual} step={s} uid="t" />);
        expect(container.querySelector('svg title')?.textContent).toBe(c.visual.title);
        expect(container.querySelector('svg desc')?.textContent).toBe(c.visual.description);
        unmount();
      }
    });
  }

  it('hides elements beyond the current step', () => {
    const tcp = catalog.get('tcp-handshake')!;
    const one = render(<VisualView v={tcp.visual} step={1} uid="a" />);
    expect(one.container.querySelectorAll('.fm-msg')).toHaveLength(1);
    one.unmount();
    const all = render(<VisualView v={tcp.visual} step={maxStep(tcp.visual)} uid="b" />);
    expect(all.container.querySelectorAll('.fm-msg')).toHaveLength(4);
  });
});
