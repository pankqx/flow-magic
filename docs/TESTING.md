# Testing and Evaluation Strategy

## 1. Layers

| Layer | Tooling | Covers |
|---|---|---|
| Unit | Vitest | normaliser, matcher, content schema + semantic rules, reducer/history |
| Component | Vitest + React Testing Library | renderers (element counts, text, steps), input states, controls |
| E2E | Playwright (Chromium in CI) | full flows, keyboard-only, Present mode |
| Accessibility | axe-core via Playwright + manual | every UI state; keyboard walkthrough; screen-reader spot check |
| Security | unit + lint | injection-style input, no HTML injection, secret scan |
| Content | `npm run validate:content` (and the Python reference in CI) | schema, alias collisions, fixtures |
| AI evaluation | later increments | fixed labelled datasets (below) |
| Performance | manual benchmark script | baseline numbers recorded at FM-117 |

Rule: **never edit fixtures or content to make tests pass** (AGENTS rule 6.4).

## 2. MVP test matrix

| ID | Type | Scenario | Expected result |
|---|---|---|---|
| TC-001 | E2E | Open app / start session | Empty state with examples; input focusable |
| TC-002 | E2E | Submit a supported concept (e.g. "dns lookup") | DNS visual at step 1; status shows detected concept and matched phrase |
| TC-003 | E2E | Submit unsupported ("quantum entanglement") | Unsupported notice with library link; previous visual unchanged |
| TC-004 | E2E | Submit empty / whitespace / over 200 chars | Documented inline message; no state change |
| TC-005 | E2E | Replace a visual with another | New visual shown; Back returns to the old one |
| TC-006 | Component | Renderer throws for a concept | Render-error state; previous valid visual still available; app usable |
| TC-007 | E2E | Clear, then Back/Forward | Empty state after Clear; Forward/Back re-shows entry |
| TC-008 | E2E | Whole workflow keyboard-only | Type → Enter → steps → back/forward → clear → library → present → Esc all work; focus always visible |
| TC-009 | Unit + E2E | Submit repeatedly / double Enter | One history entry; no corrupted state |
| TC-010 | E2E | New session after viewing visuals | Empty state; no previous visual or history leaks |
| TC-011 | E2E | Submit "http handshake" | Ambiguous choices (HTTP, TCP); choosing one shows it |
| TC-012 | E2E | Step through a sequence, a flow, a cycle, layers | Next/Prev/Show all reveal correctly; step indicator and live region update |
| TC-013 | E2E | Enter and exit Present mode | Chrome hidden; shortcuts work; Esc exits; focus restored |
| TC-014 | Unit + E2E | Back/Forward across 3 concepts, then submit new | Cursor correct; forward entries truncated on new entry; last step restored |
| TC-015 | E2E | Pick from library with filter | Visual shown; history updated |
| TC-016 | E2E | `prefers-reduced-motion: reduce` | No animated transitions on reveal |
| TC-017 | Unit + E2E | Submit `<img src=x onerror=alert(1)>`, `<script>`, SQL-like and prompt-injection strings | Rendered as text only; no script execution; unsupported state |
| TC-018 | Unit | Validate all `content/concepts/*.json` + invalid-fixture cases | Valid files pass; broken copies are rejected for the right reason |
| TC-019 | Unit | Run `tests/fixtures/matcher-cases.json` | 100% pass |
| TC-020 | Component | Every concept at every step | Renders without error; hidden steps absent from DOM |
| TC-021 | E2E | axe on empty, showing, unsupported, ambiguous, error, library, help, present | Zero serious/critical violations |

## 3. Matcher evaluation set

`tests/fixtures/matcher-cases.json` (v1, 60 cases): tier-1 aliases, tier-2 phrases inside sentences, ambiguous pairs, suggestion-only near-misses, injection/markup strings, non-Latin input, invalid inputs. The same file drives the Python reference and the TypeScript tests. Each new concept adds ≥ 3 cases.

## 4. AI evaluation (when AI exists)

Use a **versioned dataset** and record: input, expected concept(s), acceptable visual category, actual output, relevance judgment, false trigger / missed match, latency, provider + model version, cost. Never publish a single accuracy number without the dataset, labelling rules and scoring method.

Speech-specific: evaluate on representative accents and noise, and on technical vocabulary ("kubernetes", "OAuth"), which general models often mis-transcribe.

## 5. Usability testing (first round, after FM-117)

5 participants from the chosen first audience; task-based, think-aloud, ~20 min. Tasks: show a concept; recover from a miss; step through; present a 3-concept explanation. Record completion, time to visual, manual overrides, confusion points. Script template to be added at FM-117.

## 6. Test report

Use `docs/templates/TEST_REPORT.md`. Every increment ends with a report and a proceed / revise / defer decision.
