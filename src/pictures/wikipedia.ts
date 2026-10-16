import type { Picture } from '../domain/types';

/**
 * Free picture lookup via the Wikipedia API (no key, CORS via origin=*).
 * Returns the lead image of the best-matching article, or undefined.
 */
export async function findPicture(subject: string, signal?: AbortSignal): Promise<Picture | undefined> {
  const q = subject.trim().slice(0, 100);
  if (!q) return undefined;
  const url =
    'https://en.wikipedia.org/w/api.php?' +
    new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      generator: 'search',
      gsrsearch: q,
      gsrlimit: '5',
      prop: 'pageimages|extracts|info',
      piprop: 'thumbnail',
      pithumbsize: '1600',
      exintro: '1',
      explaintext: '1',
      exsentences: '2',
      inprop: 'url',
      redirects: '1',
    });
  const res = await fetch(url, { signal });
  if (!res.ok) return undefined;
  const body = await res.json();
  const pages: any[] = Object.values(body?.query?.pages ?? {});
  pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const page = pages.find((p) => p.thumbnail?.source);
  if (!page) return undefined;
  const src: string = page.thumbnail.source;
  if (!/^https:\/\/upload\.wikimedia\.org\//.test(src)) return undefined; // only trusted image host
  return {
    title: String(page.title).slice(0, 80),
    imageUrl: src,
    caption: String(page.extract ?? '').slice(0, 280),
    credit: 'Image and text: Wikipedia / Wikimedia Commons',
    pageUrl: typeof page.fullurl === 'string' && page.fullurl.startsWith('https://') ? page.fullurl : undefined,
  };
}
