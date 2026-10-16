# MVP Specification (buildable)

Single source of truth for what Increment 1 builds. Requirements (`REQUIREMENTS.md`) say *why/what*; this file says *exactly how it behaves*. Status: proposed baseline v0.2.

## 1. Scope in one paragraph

A static, English-only web app. The presenter types a concept; a deterministic matcher resolves it to one of the curated concepts in `content/concepts/`; a renderer draws its visual descriptor as SVG; the presenter can step through, go back/forward, clear, pick from a library, and enter Present mode. Sessions are in-memory only (ADR-004).

## 2. Core types (TypeScript, in `src/domain/`)

```ts
export type Category = 'networking' | 'software-engineering' | 'science';

export interface ConceptEntry {
  schemaVersion: 1;
  id: string;                 // kebab-case, equals file name
  title: string;
  summary: string;
  category: Category;
  aliases: string[];          // phrases that match this concept
  keywords: string[];         // single lowercase tokens, used only for suggestions
  visual: VisualDescriptor;
  provenance: { origin: 'original' | 'adapted' | 'generated'; license: string; author: string; sourceUrl?: string };
}

export type VisualDescriptor = FlowVisual | SequenceVisual | CycleVisual | LayersVisual;

interface VisualBase { title: string; description: string /* accessible long description */ }

export interface FlowVisual extends VisualBase {
  type: 'flow';
  nodes: { id: string; label: string; col: number; row: number; kind?: 'process'|'store'|'external'|'output'; step: number }[];
  edges: { id: string; from: string; to: string; label?: string; step: number }[];
}
export interface SequenceVisual extends VisualBase {
  type: 'sequence';
  actors: { id: string; label: string }[];
  messages: { id: string; from: string; to: string; label: string; step: number }[];
}
export interface CycleVisual extends VisualBase {
  type: 'cycle'; direction?: 'clockwise' | 'counterclockwise';
  nodes: { id: string; label: string; detail?: string; step: number }[];
}
export interface LayersVisual extends VisualBase {
  type: 'layers';
  layers: { id: string; label: string; detail?: string; step: number }[];
}

export type MatchResult =
  | { status: 'match'; conceptId: string; tier: 1 | 2 }
  | { status: 'ambiguous'; candidates: string[] }
  | { status: 'none'; suggestions: string[] }
  | { status: 'invalid'; reason: 'empty' | 'too_long' | 'no_content' };
```

The authoritative constraints (ranges, lengths, enums) are in `schemas/concept.schema.json`; Zod schemas must match it.

## 3. Session model

```ts
export interface HistoryEntry { conceptId: string; step: number /* last viewed step */; source: 'typed' | 'library' | 'suggestion'; query?: string }

export interface SessionState {
  status: 'idle' | 'loading' | 'showing' | 'unsupported' | 'ambiguous' | 'invalid' | 'error';
  title: string;                       // editable session title, default "Untitled session"
  history: HistoryEntry[];             // max 50
  cursor: number;                      // index into history, -1 if empty
  cleared: boolean;                    // true after CLEAR; reset by any event that shows an entry
  presentMode: boolean;
  notice?: { kind: MatchResult['status'] | 'render-error'; query: string; suggestions?: string[]; candidates?: string[]; reason?: string };
}
```

`currentEntry = cleared || cursor < 0 ? none : history[cursor]`. The visual shown is always derived from `currentEntry`; there is no separate "current visual" field to drift out of sync.

## 4. State machine

| From | Event | To | Effects |
|---|---|---|---|
| any | `SUBMIT(text)` while `loading` | unchanged | ignored (no duplicate) |
| idle/showing/notice states | `SUBMIT(text)` | `loading` | run matcher (synchronous in MVP; `loading` still set for one tick so UI and tests share one code path with future async) |
| loading | match | `showing` | push history entry (truncate forward entries), `step = 1` |
| loading | none | `unsupported` | notice with suggestions; **keep previous visual and cursor** |
| loading | ambiguous | `ambiguous` | notice with candidates; keep previous visual |
| loading | invalid | `invalid` | notice with reason; keep previous visual |
| showing | `RENDER_FAILED` | `error` | notice; keep previous valid entry visible (FR-007); offer Retry and Library |
| any | `PICK(conceptId)` | `showing` | push history (source `library`) |
| any with cursor > 0 | `BACK` | `showing` | cursor − 1 |
| any with cursor < len−1 | `FORWARD` | `showing` | cursor + 1 |
| showing | `STEP_NEXT` / `STEP_PREV` / `STEP_ALL` | `showing` | update `step` on current entry (clamped 1..maxStep) |
| any | `CLEAR` | `idle` | sets `cleared = true`; canvas shows the empty state; history and cursor are kept so the action is reversible |
| any | `RESET` | `idle` | new session: history empty, title default, presentMode false |
| any | `TOGGLE_PRESENT` | unchanged | flips `presentMode` |
| notice states | `DISMISS_NOTICE` or Esc | previous status (`showing` if a current entry exists else `idle`) | clears notice |

Events that show an entry (`SUBMIT` match, `PICK`, `BACK`, `FORWARD`) set `cleared = false`. `RESET` sets it to false and empties history.

`maxStep` of a visual = highest `step` value among its elements.

## 5. Screens and behavior

Layout, copy and keyboard map are in `DESIGN.md`. Behavioral rules:

1. **Submit** trims, applies the matcher, and never throws. Input is always displayed as text, never as HTML.
2. **Show**: new concept starts at step 1 (only the first element(s) visible). Next step reveals the next step number. `Show all` sets step to `maxStep`.
3. **Back/Forward** restore the concept and the last viewed step for that entry.
4. **Replace**: submitting or picking while a visual is shown replaces it and adds history; the old one stays reachable via Back.
5. **Unsupported**: show message, up to 3 suggestion buttons, and a "Browse library" button. The previous visual stays visible beneath/behind the notice only if doing so does not obscure the message; otherwise the notice appears in the input panel and the canvas is unchanged.
6. **Ambiguous**: show "That could mean:" with one button per candidate (max 3).
7. **Present mode**: canvas fills the viewport; chrome hidden; a small hint ("Esc to exit · ← → steps") fades after 3 s and reappears on mouse move or key press. Typing is disabled in Present mode (keys are shortcuts).
8. **Library**: modal/drawer listing concepts grouped by category with a filter box.
9. **Session title**: editable inline in the header; ephemeral.
10. **Reduced motion**: if `prefers-reduced-motion: reduce`, reveals are instant; otherwise a 200 ms fade/draw is allowed. No looping animation anywhere.

## 6. Provisional engineering budgets

Labelled provisional; re-baseline at FM-117 and record real numbers. They exist so agents have a target instead of none.

- Match + first render of any concept: under 100 ms on a mid-range laptop (local, no network).
- Initial JS ≤ 250 KB gzipped; total transferred ≤ 500 KB.
- Lighthouse accessibility score ≥ 95 on the deployed build (supplementary to axe + manual checks).
- No layout shift when stepping.

## 7. Browser and device baseline

Latest two major versions of Chrome, Edge, Firefox and Safari on desktop. Responsive down to 360 px width is a goal (DESIGN §7) but Present mode and the 1280×720 shared-screen case are the priority.

## 8. Out of scope for the MVP (do not build)

Speech, AI calls, 3D, accounts, persistence of session content, sharing links, export, analytics, i18n, drag-and-drop editing, user-created concepts.
