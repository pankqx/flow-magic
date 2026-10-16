# Task Backlog

Rules: tasks are small enough for one agent session and one PR. Every acceptance criterion (AC) must be individually checkable. Do not mark `done` without evidence in `docs/STATUS.md`.

Priority: **P0** first usable slice · **P1** needed to make the MVP reliable/useful · **P2** later · **P3** speculative.
Status: `ready`, `blocked` (waiting on dependency), `in-progress`, `done`, `deferred`.
Requirement IDs refer to `docs/REQUIREMENTS.md`; test IDs to `docs/TESTING.md`.

## Increment 0 — Baseline

| ID | Pri | Task | Acceptance criteria | Status |
|---|---|---|---|---|
| FM-001 | P0 | Publish this repository | Repo on GitHub; CI workflow runs; `python tests/reference/validate_content.py` passes in CI | ready |
| FM-002 | P0 | Resolve blocking open questions | Q1–Q4 in `docs/OPEN_QUESTIONS.md` answered or defaults confirmed by owner | ready |

## Increment 1 — Core MVP (typed concept → visual → presenter controls)

| ID | Pri | Task | Depends | Read | Acceptance criteria | Reqs | Status |
|---|---|---|---|---|---|---|---|
| FM-101 | P0 | Scaffold app and tooling | FM-001 | ADR-002, AGENTS §4 | (1) Vite+React+TS strict app runs with `npm run dev`. (2) All scripts in AGENTS §4 exist and pass on the empty app. (3) CI Node job runs `npm run check` and `npm run build`. (4) README gets setup/run section. | NFR-009 | ready |
| FM-102 | P0 | Domain types, Zod schemas, content loader | FM-101 | SPEC_MVP §2, CONTENT_AND_VISUALS | (1) Types and Zod schemas mirror `schemas/concept.schema.json`. (2) All 12 files in `content/concepts/` load and validate. (3) Semantic rules from `tests/reference/validate_content.py` are implemented in TS. (4) Tests prove invalid files are rejected (unknown node ref, duplicate id, alias collision, bad category). (5) `npm run validate:content` exists. | FR-003, NFR-005 | blocked |
| FM-103 | P0 | Normaliser and matcher | FM-102 | CONCEPT_MATCHING | (1) Implements the spec exactly. (2) 100% of cases in `tests/fixtures/matcher-cases.json` pass. (3) Pure functions, no React. (4) Property: matching never throws for any string input (fuzz test, ≥1000 random strings). | FR-003, FR-005, FR-019 | blocked |
| FM-104 | P0 | Session state machine and history | FM-102 | SPEC_MVP §4 | (1) Reducer implements states and transitions in SPEC_MVP §4. (2) Back/forward history (max 50) with correct truncation on new entry. (3) Failed render keeps previous visual (FR-007). (4) Duplicate submit while pending is ignored. (5) Reset clears everything. (6) Unit tests for every transition. | FR-001, FR-006, FR-007, FR-014, FR-020 | blocked |
| FM-105 | P0 | Renderer: flow | FM-102 | CONTENT_AND_VISUALS §4 | (1) Renders nodes by `col`/`row` on a scaled grid with arrowed edges and labels. (2) Node `kind` has distinct shape **and** is not colour-only. (3) Elements with `step` > current step are hidden. (4) `<title>` and `<desc>` set from descriptor. (5) Renders every flow concept in `content/` without error. (6) Snapshot-free tests: assert element counts and text. | FR-004 | blocked |
| FM-106 | P0 | Renderer: sequence | FM-102 | same | Same criteria for sequence diagrams (actor lanes, lifelines, directional arrows, labels not overlapping arrows). Handles 6 actors and 20 messages. | FR-004 | blocked |
| FM-107 | P0 | Renderer: cycle | FM-102 | same | Same criteria; nodes placed evenly on a circle, arrows follow `direction`, 3–8 nodes. | FR-004 | blocked |
| FM-108 | P0 | Renderer: layers | FM-102 | same | Same criteria; stacked bars top to bottom, optional detail text. | FR-004 | blocked |
| FM-109 | P1 | Step-through reveal | FM-105..108, FM-104 | SPEC_MVP §5, ACCESSIBILITY | (1) Controls: Next step, Previous step, Show all. (2) Keys: `→`/`Space` next, `←` previous, `A` show all. (3) Current step announced via `aria-live="polite"`. (4) With `prefers-reduced-motion`, no animation (instant). (5) Default on selection: step 1 shown, not all. | FR-021 | blocked |
| FM-110 | P0 | Workspace shell, input and states | FM-103, FM-104, FM-105 | DESIGN §2–4 | (1) Layout per DESIGN. (2) Input validates and submits on Enter. (3) Empty, loading, shown, unsupported (with suggestions), ambiguous (with choices), invalid and render-error states exist with copy from DESIGN §4. (4) Focus moves sensibly after submit. (5) Input rendered as text only (XSS test). | FR-001, FR-002, FR-005 | blocked |
| FM-111 | P0 | Presenter controls and keyboard map | FM-110 | DESIGN §5 | (1) Clear, Back, Forward, Replace-by-typing work. (2) Keyboard map from DESIGN §5 implemented, shown in a help dialog (`?`). (3) Shortcuts do not fire while typing in the input. (4) Every control has an accessible name. | FR-006, FR-014, NFR-002 | blocked |
| FM-112 | P0 | Present mode | FM-110 | DESIGN §6 | (1) `F` or button toggles a clean canvas (no chrome except an unobtrusive hint). (2) Uses the Fullscreen API when available; works without it. (3) `Esc` exits; focus returns to the trigger. (4) Step and history keys still work. (5) Text stays legible at 1280×720 (typical shared-screen size). | FR-022 | blocked |
| FM-113 | P1 | Concept library | FM-110 | DESIGN §3 | (1) Lists all concepts grouped by category with title and summary. (2) Search box filters by title/alias. (3) Selecting a concept shows its visual and adds to history. (4) Fully keyboard operable. | FR-023 | blocked |
| FM-114 | P1 | Accessibility pass | FM-111, FM-112, FM-113 | ACCESSIBILITY | (1) axe-core check (via Playwright) has zero serious/critical violations on every state. (2) Keyboard-only walkthrough of TC-008 passes. (3) Contrast ≥ WCAG AA for text and focus rings. (4) Findings and manual results recorded in a test report. | NFR-002, NFR-003 | blocked |
| FM-115 | P0 | End-to-end tests | FM-111, FM-112 | TESTING §3 | Playwright tests implement every case marked E2E in `docs/TESTING.md` §2, running in CI on Chromium. | all MVP | blocked |
| FM-116 | P1 | Deploy preview | FM-101 | DEPLOYMENT | Static build deployed to the chosen host from `main`; URL in README; no secrets required. | NFR-009 | blocked |
| FM-117 | P0 | MVP review | FM-109..116 | ROADMAP, STATUS | All MVP acceptance criteria in REQUIREMENTS pass; baseline measurements for NFR-008 recorded; known limitations listed; STATUS updated with evidence; first usability session script ready. | all MVP | blocked |

Parallelization after FM-102: FM-103, FM-104, FM-105, FM-106, FM-107, FM-108 are independent (different directories). See `docs/AGENT_PLAYBOOK.md`.

## Increment 2 — Speech (Suggest mode)

Design constraint: speech never switches the visual by itself. It produces a **suggestion chip** the presenter accepts with one key. See `docs/AI_BEHAVIOR.md` §Interaction modes.

| ID | Pri | Task | Acceptance criteria | Status |
|---|---|---|---|---|
| FM-201 | P1 | Spike: Web Speech API vs alternatives | Experiment record (template) comparing browser SpeechRecognition, a hosted API, and local Whisper-class models on a fixed phrase set: accuracy, latency, language support, cost, privacy. Decision as ADR. | proposed |
| FM-202 | P1 | Audio consent and lifecycle | Written behavior for permission, start/stop, indicator, retention (none by default), and provider disclosure; approved by owner before FM-203 | proposed |
| FM-203 | P1 | Speech input adapter | Behind an `InputAdapter` interface; explicit start button; visible recording state; stop control; typed input still works | proposed |
| FM-204 | P1 | Transcript → matcher → suggestion chip | Partial/final results handled; chip shows matched concept; accept/dismiss keys; no auto-switch | proposed |
| FM-205 | P1 | Evaluate on a labelled phrase set | Dataset, scoring method and results recorded; false-trigger rate reported | proposed |

## Increment 3 — AI-generated diagrams

| ID | Pri | Task | Acceptance criteria | Status |
|---|---|---|---|---|
| FM-301 | P1 | Extend descriptor schema versioning | `schemaVersion` migration policy; generated entries marked `origin: generated` | proposed |
| FM-302 | P1 | Provider adapter + minimal serverless proxy | Keys server-side only; rate limit and cost cap; provider swappable; prompt-injection tests | proposed |
| FM-303 | P1 | Structured generation → Zod validation → one repair retry → fallback | Invalid output never rendered; failures preserve last visual | proposed |
| FM-304 | P1 | Auto-layout for generated flows | Decide on a layout library via ADR (e.g. dagre/elk) vs constrained grid prompting | proposed |
| FM-305 | P1 | Relevance and false-trigger evaluation | Versioned dataset, labels, scoring documented | proposed |
| FM-306 | P2 | "Why this visual?" panel | Shows matched alias/source/confidence from metadata only | proposed |

## Increment 4 — Interactive 3D (P2)

FM-401 compare approaches (three.js / react-three-fiber / model-viewer) · FM-402 one curated model with fallback and text description · FM-403 measure performance on declared hardware.

## Increment 5 — Session quality (P1/P2)

FM-501 session event model with privacy limits · FM-502 reviewable Markdown session summary · FM-503 export · FM-504 visual feedback controls · FM-505 session history (only after storage/retention approved) · FM-506 Auto mode (opt-in) after Suggest mode has measured false-trigger data.

## Increment 6 — Integrations (P2/P3)

FM-601 pick one target based on evidence · FM-602 supported-API prototype with standalone fallback · FM-603 evaluate extension/SDK.

## Increment 7 — Gestures (P3)

FM-701 define use cases · FM-702 prototype with consent and false-activation measurement.
