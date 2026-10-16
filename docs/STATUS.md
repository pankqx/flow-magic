# Project Status

Last updated: 2026-10-09

## Overall
**Planning stage with a prepared repository baseline (docs v0.2).** No application code exists. Nothing below claims otherwise.

## Decisions recorded
- ADR-001 Standalone web app first; no built-in video calling (accepted).
- ADR-002 Stack: Vite + React + TypeScript + Zod + Vitest + Playwright; static, no backend (accepted; owner may override before FM-101).
- ADR-003 Descriptor-first visuals (accepted).
- ADR-004 Ephemeral sessions in the MVP (accepted).

## Artifacts that exist
- 12 curated concept files in `content/concepts/` and schema `schemas/concept.schema.json`.
- 60 matcher fixtures in `tests/fixtures/matcher-cases.json`.
- Python reference matcher/validator in `tests/reference/`.
- CI workflow (reference checks run now; app/E2E jobs activate when `package.json` and `test:e2e` exist).

## Evidence
| Date | Claim | Evidence | Where |
|---|---|---|---|
| 2026-10-09 | All 12 concept files pass schema and semantic validation; all 60 fixtures pass the reference matcher | `python tests/reference/validate_content.py` → `OK: 12 concept files valid; 60 matcher fixtures pass against the reference matcher.` Run once in the authoring environment; also a deliberately broken copy was rejected with 6 reported problems. CI will re-run on first push. | local run |

## Implemented and verified features
None (no application code yet).

## Current priorities
1. FM-001: publish repo; confirm CI green.
2. FM-002: answer or confirm defaults for Q1–Q4 in OPEN_QUESTIONS.
3. FM-101 scaffold, then FM-102.

## Known open questions
See `OPEN_QUESTIONS.md`.

## Evidence policy
Update only with verified repository state, command output, decisions and dated evidence. Never set "Implemented" or "Verified" because a task is planned.
