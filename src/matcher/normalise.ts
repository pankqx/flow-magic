export const MAX_INPUT_LENGTH = 200;

export const FILLER = new Set(
  (
    'explain show me what whats s is are how does do work works tell about describe diagram visual visualize ' +
    'of the a an please can you give i want to see and for in with on'
  ).split(' '),
);

/** NFKD, strip combining marks, lowercase, split on runs of non [a-z0-9]. */
export function tokensOf(text: string): string[] {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean);
}

export function contentTokens(text: string): string[] {
  return tokensOf(text).filter((t) => !FILLER.has(t));
}
