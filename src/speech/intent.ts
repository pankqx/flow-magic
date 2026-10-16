import type { Visual } from '../domain/types';

export type Command = 'next' | 'prev' | 'all' | 'clear' | 'back' | 'forward';
export type Intent =
  | { kind: 'command'; cmd: Command }
  | { kind: 'picture'; subject: string }
  | { kind: 'generate'; subject: string; visualType?: Visual['type'] }
  | { kind: 'topic'; subject: string }
  | { kind: 'plain'; text: string };

const COMMANDS: [RegExp, Command][] = [
  [/^(next|next step|go next|continue|next one)$/, 'next'],
  [/^(previous|previous step|step back|go back a step|last step)$/, 'prev'],
  [/^(show (it )?all|show everything|reveal (it )?all|reveal everything|show the whole thing)$/, 'all'],
  [/^(clear|clear (the )?(screen|board|stage|canvas)|wipe (the )?(screen|board))$/, 'clear'],
  [/^(go back|previous (diagram|visual|picture|slide)|back)$/, 'back'],
  [/^(go forward|forward|next (diagram|visual|picture|slide))$/, 'forward'],
];

const TYPE_WORDS: [RegExp, Visual['type'] | undefined][] = [
  [/^(flow ?charts?|flow diagrams?|process(es)?|pipelines?|workflows?)$/, 'flow'],
  [/^(mind ?maps?|concept maps?|overview)$/, 'mindmap'],
  [/^(lists?|steps|checklist|bullet points|points|timeline)$/, 'list'],
  [/^(sequence diagrams?|sequences?)$/, 'sequence'],
  [/^(cycles?|life ?cycles?|loops?)$/, 'cycle'],
  [/^(layers|stacks?|layer diagrams?|hierarchy|pyramid)$/, 'layers'],
  [/^(diagrams?|visuals?|charts?|graphics?|drawings?)$/, undefined],
];

const ARTICLE = /^(a|an|the|some|my|our)\s+/;

function clean(s: string): string {
  return s
    .toLowerCase()
    .replace(/[“”"'’.,!?;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function subjectOf(s: string): string {
  return s.replace(ARTICLE, '').replace(/\s+(please|now|here|for you|for me)$/, '').trim();
}

/**
 * Turns one spoken or typed phrase into an intent. Pure and deterministic.
 * Commands only fire on short phrases so normal speech doesn't trigger them.
 */
export function parseIntent(raw: string): Intent {
  const t = clean(raw).replace(/^(okay|ok|so|alright|now|and|hey magic|magic)\s+/, '');
  if (!t) return { kind: 'plain', text: '' };
  if (t.split(' ').length <= 4) for (const [re, cmd] of COMMANDS) if (re.test(t)) return { kind: 'command', cmd };

  // "picture / photo / image of X"
  let m = t.match(/\b(?:picture|photo|image|pic|photograph)s? of (.+)$/);
  if (m) return { kind: 'picture', subject: subjectOf(m[1]!) };

  // "(draw|make|show me) a flowchart of X", "mind map about X", "list of X", "steps to X"
  m = t.match(
    /\b((?:flow ?charts?|flow diagrams?|mind ?maps?|concept maps?|lists?|steps|checklist|timeline|sequence diagrams?|life ?cycles?|cycles?|layers|stacks?|hierarchy|pyramid|diagrams?|visuals?|charts?|process(?:es)?|pipelines?|workflows?|overview)) (?:of|for|on|about|showing|explaining|to|how) (.+)$/,
  );
  if (m) {
    const word = m[1]!;
    const vt = TYPE_WORDS.find(([re]) => re.test(word));
    const subject = subjectOf(m[2]!);
    if (subject) return { kind: 'generate', subject: word === 'steps' ? `steps to ${subject}` : subject, visualType: vt?.[1] };
  }

  // "let me explain X", "let's talk about X", "how does X work", "what is X"
  m = t.match(/\b(?:let me explain|let me show you|let's talk about|lets talk about|explain|talk about|introducing) (.+)$/);
  if (m) return { kind: 'topic', subject: subjectOf(m[1]!) };
  m = t.match(/\bhow (?:does|do) (.+?) works?$/);
  if (m) return { kind: 'topic', subject: subjectOf(m[1]!) };
  m = t.match(/\bwhat (?:is|are) (.+)$/);
  if (m) return { kind: 'topic', subject: subjectOf(m[1]!) };

  // "show me a dinosaur" → picture
  m = t.match(/\b(?:show me|look at|here is|here's|this is) (?:a|an) (.+)$/);
  if (m) return { kind: 'picture', subject: subjectOf(m[1]!) };

  return { kind: 'plain', text: t };
}

const LEAD = new Set('okay ok so alright now and um uh like the a an this that is it its here there well right'.split(' '));

/** Last few meaningful words of an utterance — what a summon gesture will act on. */
export function calloutOf(raw: string): string {
  const words = clean(raw).split(' ').filter(Boolean).slice(-4);
  while (words.length > 1 && LEAD.has(words[0]!)) words.shift();
  return words.join(' ');
}
