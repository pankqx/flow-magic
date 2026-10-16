import { describe, expect, it } from 'vitest';
import { calloutOf, parseIntent } from './intent';

describe('parseIntent', () => {
  it.each([
    ['next step', { kind: 'command', cmd: 'next' }],
    ['Okay, next.', { kind: 'command', cmd: 'next' }],
    ['show everything', { kind: 'command', cmd: 'all' }],
    ['clear the screen', { kind: 'command', cmd: 'clear' }],
    ['go back', { kind: 'command', cmd: 'back' }],
    ['show me a picture of a dinosaur', { kind: 'picture', subject: 'dinosaur' }],
    ['here is a photo of the Eiffel Tower', { kind: 'picture', subject: 'eiffel tower' }],
    ['show me a dinosaur', { kind: 'picture', subject: 'dinosaur' }],
    ['draw a flowchart of user login', { kind: 'generate', subject: 'user login', visualType: 'flow' }],
    [
      'make a mind map about machine learning',
      { kind: 'generate', subject: 'machine learning', visualType: 'mindmap' },
    ],
    [
      'give me a list of sorting algorithms',
      { kind: 'generate', subject: 'sorting algorithms', visualType: 'list' },
    ],
    [
      'a diagram of how a compiler works',
      { kind: 'generate', subject: 'how a compiler works', visualType: undefined },
    ],
    ['let me explain the TCP handshake', { kind: 'topic', subject: 'tcp handshake' }],
    ['how does DNS work', { kind: 'topic', subject: 'dns' }],
    ['what is a blockchain', { kind: 'topic', subject: 'blockchain' }],
    [
      'today we are going to learn about networks',
      { kind: 'plain', text: 'today we are going to learn about networks' },
    ],
  ])('%s', (input, expected) => {
    expect(parseIntent(input)).toEqual(expected);
  });

  it('does not treat long sentences containing "next" as commands', () => {
    expect(parseIntent('the next thing I want to say is about routers').kind).toBe('plain');
  });

  it('callout keeps the last few words', () => {
    expect(calloutOf('and now... dinosaur!')).toBe('dinosaur');
    expect(calloutOf('this one is a really big blue whale')).toBe('really big blue whale');
  });
});
