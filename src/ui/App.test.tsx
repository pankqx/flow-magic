import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(cleanup);

describe('App', () => {
  it('typing a concept shows it and arrow keys step through it', () => {
    render(<App />);
    const input = screen.getByLabelText(/concept, picture or diagram/i);
    fireEvent.change(input, { target: { value: 'TCP handshake' } });
    fireEvent.submit(input.closest('form')!);
    expect(screen.getByText(/Step 1 \/ 4/)).toBeTruthy();
    expect(document.activeElement).not.toBe(input);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText(/Step 2 \/ 4/)).toBeTruthy();
    fireEvent.keyDown(window, { key: 'a' });
    expect(screen.getByText(/Step 4 \/ 4/)).toBeTruthy();
    fireEvent.keyDown(window, { key: 'c' });
    expect(screen.getByText(/The board is clear/)).toBeTruthy();
    fireEvent.keyDown(window, { key: '[' });
    expect(screen.getByText(/Step 4 \/ 4/)).toBeTruthy();
  });

  it('opens the library and shows a picked concept', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'l' });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /water cycle/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText(/Showing: Water cycle/)).toBeTruthy();
  });

  it('never starts the microphone or camera on its own', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /listen/i }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('button', { name: /camera/i }).getAttribute('aria-pressed')).toBe('false');
  });
});
