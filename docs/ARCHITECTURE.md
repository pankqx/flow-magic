# Architecture

Status: decided for the MVP (ADR-002, 003, 004); later increments are proposals.

## 1. System boundary

Flow & Magic owns the presentation workspace, session state, input handling, concept matching, visual descriptors and rendering. External systems (speech providers, language models, meeting platforms) arrive in later increments behind adapters. No video calling (ADR-001).

## 2. MVP shape

A **static single-page app**. No backend, database, auth or network calls at runtime. Content is bundled JSON.

```
                 ┌──────────── src/ui ─────────────┐
 typed text ───▶ │ InputPanel  Canvas  Controls    │
 library pick ─▶ │ Library  Help  PresentMode      │
                 └───────┬───────────────▲─────────┘
                    events│               │ state
                 ┌────────▼───────────────┴────────┐
                 │ src/session  reducer + history  │
                 └───────┬───────────────▲─────────┘
                  match()│               │ ConceptEntry
                 ┌────────▼────────┐  ┌───┴──────────────┐
                 │ src/matcher     │  │ src/content      │ ← content/concepts/*.json
                 │ normalise/match │  │ loader + Zod     │
                 └────────┬────────┘  └───┬──────────────┘
                          └───────┬───────┘
                          src/domain (types, schemas)
 ui ──▶ src/renderers (flow | sequence | cycle | layers) ──▶ SVG
```

Dependency direction: `ui → session → matcher → domain`; `ui → renderers → domain`. `domain` has no app imports. Renderers are pure functions of `(descriptor, step)`.

## 3. Repository layout (target)

```
/
├─ AGENTS.md CLAUDE.md README.md DESIGN.md TASKS.md SECURITY.md LICENSE
├─ docs/                    documentation (this folder)
├─ content/concepts/*.json  curated data
├─ schemas/                 JSON Schema
├─ tests/fixtures/          evaluation sets
├─ tests/reference/         Python reference tooling
├─ src/{domain,matcher,session,renderers,ui,content}/
├─ e2e/                     Playwright tests
├─ .github/                 CI, PR/issue templates
└─ package.json vite.config.ts tsconfig.json eslint.config.js ...
```

## 4. Key interfaces

```ts
// Input (typed now; speech later) — the seam for Increment 2
export interface InputAdapter {
  start(): void; stop(): void;
  onText(cb: (t: { text: string; final: boolean }) => void): () => void; // returns unsubscribe
}

// Concept source — the seam for Increment 3 (AI-generated entries)
export interface ConceptSource {
  list(): ConceptEntry[];
  get(id: string): ConceptEntry | undefined;
}

// Matching — the seam for smarter matchers
export type Matcher = (raw: string, source: ConceptSource) => MatchResult;
```

Only these seams are abstracted now. Do not add other interfaces without a need (AGENTS rule 6.2).

## 5. Data flow

`raw text → validate length → normalise → match → MatchResult → reducer → (showing | notice) → renderer(descriptor, step) → SVG`.

Errors at any stage become a typed state in the reducer (never an uncaught exception). Renderers throw `RenderError`; an error boundary dispatches `RENDER_FAILED`.

## 6. Decisions at a glance

| Topic | Decision | Record |
|---|---|---|
| Product boundary | Standalone web app first | ADR-001 |
| Stack | Vite, React, TS strict, Zod, Vitest, RTL, Playwright, CSS Modules, useReducer, hand-written SVG | ADR-002 |
| Visuals | Descriptor-first, validated data, own renderers | ADR-003 |
| Persistence | None in MVP; in-memory sessions | ADR-004 |
| Hosting | Static host, undecided (OPEN_QUESTIONS Q4) | — |
| Backend | None until Increment 3 (secret-bearing AI calls) | ADR-002 |

## 7. Later increments (proposals)

- **Speech (Inc 2)**: `InputAdapter` implementation using the browser SpeechRecognition API first; evaluate alternatives in FM-201. Output feeds the matcher; result becomes a *suggestion chip* (Suggest mode).
- **AI generation (Inc 3)**: a minimal serverless function proxies the model provider (keys server-side, rate-limited, cost-capped). Model returns a descriptor via structured output → Zod validation → one repair retry → fallback to last valid visual. Add auto-layout (decide library by ADR). Next.js or a small separate function are both acceptable; decide then.
- **3D (Inc 4)**: new `model3d` visual type, lazy-loaded renderer (three.js/react-three-fiber candidate), with text description and 2D fallback.
- **Session summary (Inc 5)**: derived from an explicit event log; stored only after a privacy decision.

## 8. Testing seams

Pure modules (`domain`, `matcher`, `session`) are unit-tested without DOM. Renderers are component-tested by asserting element counts and text. E2E covers wiring. Fixtures in `tests/fixtures/` are shared between the Python reference and TS tests.
