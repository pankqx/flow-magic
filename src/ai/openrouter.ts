import type { Visual } from '../domain/types';
import { buildVisual, extractJson } from './build';
import { addSpend, cacheGet, cachePut, type AiSettings, type Spend } from './settings';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM = `You turn a topic into ONE clear teaching diagram for a live presentation.
Reply with a single JSON object and nothing else. Pick the best "type":
- "flow": a process or decision flow. {"type":"flow","title":str,"description":str,"nodes":[{"id":str,"label":str,"kind":"process"|"store"|"external"|"output"}],"edges":[{"from":nodeId,"to":nodeId,"label"?:str}]}  (3-10 nodes)
- "sequence": messages between parties over time. {"type":"sequence","title","description","actors":[str],"messages":[{"from":actor,"to":actor,"label":str}]}  (2-5 actors, 3-10 messages)
- "cycle": a repeating loop. {"type":"cycle","title","description","nodes":[{"label":str,"detail"?:str}]}  (3-7 nodes)
- "layers": a stack/hierarchy, top first. {"type":"layers","title","description","layers":[{"label":str,"detail"?:str}]}
- "list": key points or ordered steps. {"type":"list","title","description","ordered":bool,"items":[{"label":str,"detail"?:str}]}  (3-7 items)
- "mindmap": an overview of a broad topic. {"type":"mindmap","title","description","center":str,"branches":[{"label":str,"children"?:[str]}]}  (3-6 branches, 0-3 short children each)
Rules: labels max 4 words; details max 10 words; edge labels max 3 words; description = 1-3 plain sentences explaining the diagram;
be factually correct; never include markup, code or URLs.`;

export class AiError extends Error {}

const recent: number[] = [];

export interface GenerateResult {
  visual: Visual;
  cached: boolean;
  spend?: Spend;
  costUsd?: number;
}

async function call(
  settings: AiSettings,
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': location.origin,
      'X-Title': 'Flow & Magic',
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      usage: { include: true },
    }),
  });
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const body = await res.json();
      msg = body?.error?.message ?? msg;
    } catch {
      /* ignore */
    }
    if (res.status === 401) throw new AiError('OpenRouter rejected the API key. Check it in Settings.');
    if (res.status === 402) throw new AiError('OpenRouter says the credit balance is too low.');
    if (res.status === 429) throw new AiError('OpenRouter rate limit hit — wait a few seconds.');
    throw new AiError(`OpenRouter error: ${msg}`);
  }
  const body = await res.json();
  const content: string = body?.choices?.[0]?.message?.content ?? '';
  const cost = Number(body?.usage?.cost ?? 0);
  return { content, spend: addSpend(cost), cost };
}

export function cacheKey(model: string, subject: string, type?: string) {
  return `${model}|${type ?? 'auto'}|${subject.toLowerCase().replace(/\s+/g, ' ').trim()}`;
}

/** Topic → validated Visual. One repair retry; never returns unvalidated data. */
export async function generateVisual(
  settings: AiSettings,
  subject: string,
  opts: { visualType?: Visual['type']; context?: string; signal?: AbortSignal } = {},
): Promise<GenerateResult> {
  if (!settings.apiKey) throw new AiError('Add your OpenRouter key in Settings to generate diagrams.');
  const key = cacheKey(settings.model, subject, opts.visualType);
  const hit = cacheGet(key);
  if (hit) {
    try {
      return { visual: buildVisual(hit), cached: true };
    } catch {
      /* stale cache entry: regenerate */
    }
  }
  const now = Date.now();
  while (recent.length && now - recent[0]! > 60_000) recent.shift();
  if (recent.length >= settings.maxPerMinute)
    throw new AiError(`Paused to save credits: max ${settings.maxPerMinute} AI calls per minute.`);
  recent.push(now);

  const user =
    `Topic: ${subject}` +
    (opts.visualType ? `\nUse type "${opts.visualType}".` : '') +
    (opts.context ? `\nThe presenter just said: "${opts.context.slice(0, 400)}"` : '');
  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: user },
  ];
  let total = 0;
  const first = await call(settings, messages, opts.signal);
  total += first.cost;
  try {
    const raw = extractJson(first.content);
    const visual = buildVisual(raw);
    cachePut(key, raw);
    return { visual, cached: false, spend: first.spend, costUsd: total };
  } catch (e) {
    // One repair attempt with the validation error.
    const second = await call(
      settings,
      [
        ...messages,
        { role: 'assistant', content: first.content.slice(0, 4000) },
        {
          role: 'user',
          content: `That JSON was invalid: ${(e as Error).message.slice(0, 300)}. Reply with corrected JSON only.`,
        },
      ],
      opts.signal,
    );
    total += second.cost;
    try {
      const raw = extractJson(second.content);
      const visual = buildVisual(raw);
      cachePut(key, raw);
      return { visual, cached: false, spend: second.spend, costUsd: total };
    } catch {
      throw new AiError("The AI's diagram didn't pass validation, so nothing was shown.");
    }
  }
}
