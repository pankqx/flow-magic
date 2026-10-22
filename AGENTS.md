# Agent Instructions — Flow & Magic

For every AI coding agent (Claude Code, Codex, Cursor, Copilot, others) and human contributor. `CLAUDE.md` imports this file.

Humans who want to understand the whole project from zero (stack, files, flows, decisions, interview prep): read [`GUIDE.md`](GUIDE.md).

## 1. What this project is

A standalone web app that shows animated diagrams and pictures while a presenter talks, types or gestures. Pipeline: **speech/typed/gesture input → intent parser + deterministic matcher (+ optional AI) → validated visual descriptor → SVG renderer → presenter controls**. Scope: ADR-005.

Hard boundaries (stop and ask a human before crossing any):
- No video calling, meeting rooms, accounts, billing.
- No backend, database or analytics service (the demo calls OpenRouter and Wikipedia directly from the browser; see ADR-005).
- Speech, AI, camera and gestures are allowed **only behind explicit user toggles** (ADR-005). Never start the mic or camera without a click.
- Never commit API keys. The OpenRouter key lives only in the user's browser storage.
- Never execute, `eval`, or inject (`dangerouslySetInnerHTML`, `innerHTML`) model-generated or user-provided content.

## 2. Read only what your task needs

1. This file.
2. Your task row in `TASKS.md` (it lists the docs under **Read**).
3. `docs/SPEC_MVP.md` if the task touches types, state or screens.
4. `docs/STATUS.md` to learn what really exists.

Do not load the whole `docs/` folder. If docs and code disagree, code plus `docs/STATUS.md` wins for "what exists"; `docs/SPEC_MVP.md` wins for "what should exist". Flag the mismatch in your report.

## 3. Stack (decided, see ADR-002)

Vite, React, TypeScript (`strict`), Zod, Vitest, React Testing Library, Playwright, ESLint, Prettier, CSS Modules with CSS variables, `useReducer` for state, hand-written SVG renderers, npm. No other runtime dependency without a written justification in the PR (what it replaces, size, license, maintenance).

## 4. Commands (created by FM-101; keep these names stable)

```
npm run dev              # local dev server
npm run build            # production build
npm run typecheck        # tsc --noEmit
npm run lint             # eslint
npm run format:check     # prettier
npm test                 # vitest run (unit + component)
npm run test:e2e         # playwright (planned; script not added yet)
npm run validate:content # Zod validation of content/concepts + matcher fixtures
npm run check            # typecheck + lint + format:check + test + validate:content
```

`npm run check` runs typecheck + lint + format:check + tests. The Python reference check also works without Node: `python tests/reference/validate_content.py`.

## 5. Source layout and ownership

```
src/domain/      types, Zod schemas, visual helpers (maxStep, semanticProblems)   (pure, no React)
src/matcher/     normalise + deterministic match                                 (pure, no React)
src/session/     reducer, history, notices                                       (pure, no React)
src/speech/      intent parser (pure) + useSpeech hook (Web Speech API)
src/ai/          OpenRouter client, loose->strict descriptor builder, settings/spend/cache (localStorage)
src/layout/      autoLayout for AI flow graphs (pure)
src/pictures/    Wikipedia picture lookup
src/vision/      camera + MediaPipe tasks, gesture interpreter (pure), face filters
src/renderers/   one SVG renderer per visual type: Flow, Sequence, Cycle, Layers, Mindmap (+ list) (pure of app state)
src/ui/          App, Stage, Drawers, useController, useCamera, prefs, CSS modules
src/content/     catalog loader that imports content/concepts/*.json
src/styles/      base + diagram CSS
content/         curated data (humans own this; see rule 6.4)
tests/fixtures/  fixed evaluation sets                                           (see rule 6.4)
```

Dependency direction: `ui → session → matcher → domain` and `ui → renderers → domain`. `domain` imports nothing from the app. Renderers never import `session` or `ui`.

When several agents work in parallel, each owns one directory per task (see `docs/AGENT_PLAYBOOK.md`). Do not edit files outside your task's directories except to add imports/exports.

## 6. Rules

1. **One task, one branch, one PR.** Name: `feat/FM-103-matcher`. Commits: `feat(matcher): ... (FM-103)`.
2. **Smallest implementation that meets the acceptance criteria.** No unrelated refactors, no speculative abstractions, no extra features.
3. **Tests first or alongside.** Every behavior change has a test. Pure modules get unit tests; UI gets RTL tests; flows get Playwright tests.
4. **Never weaken the oracle.** Do not edit `tests/fixtures/*`, `content/concepts/*`, or `schemas/*` to make a failing test pass. If you believe a fixture or content file is wrong, stop and report it with evidence; a human decides.
5. **No fabricated evidence.** Report only commands you actually ran, with real results. Do not invent screenshots, benchmarks, or statuses.
6. **Accessibility is part of done**: labels, visible focus, keyboard operation, `aria-live` for status, SVG `<title>`/`<desc>`, `prefers-reduced-motion`. See `docs/ACCESSIBILITY.md`.
7. **Security**: no secrets in the repo or bundle; render untrusted strings as text only; keep CSP-friendly (no inline event handlers, no remote scripts).
8. **Ambiguity**: if the answer is in `docs/OPEN_QUESTIONS.md`, use the stated default. Otherwise choose the smallest reversible option, record the assumption in the PR, and continue; ask only when the choice changes user-visible behavior.
9. **Commit identity**: commit as `pankqx <pankqx@gmail.com>`. Do not add `Co-Authored-By` or any AI/tool trailer.
10. **Do not edit status to Verified yourself unless you attach command output** in `docs/STATUS.md` under a dated evidence entry.

## 7. Definition of done

- Acceptance criteria in `TASKS.md` met, each one individually checked.
- `npm run check` passes (or the exact reason it cannot be run is stated).
- Error, empty, loading and unsupported states handled.
- Docs touched: `docs/STATUS.md`, plus requirement/spec docs if behavior changed.
- No unrelated files, no secrets, no build artifacts.

## 8. Final report format

```
Task: FM-xxx <title>
Implemented: <behavior in 2-4 lines>
Files changed: <list>
Validation: <exact commands + pass/fail>
Acceptance criteria: <each criterion → met / not met + how verified>
Assumptions: <any>
Limitations / follow-ups: <any>
Next task: <one ID from TASKS.md>
```
