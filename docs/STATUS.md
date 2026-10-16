# Project Status

Last updated: 2026-10-16

## Overall
**Working demo (ADR-005 demo-first scope).** Typed, spoken and gesture input; curated and AI diagrams; Wikipedia pictures; camera effects; Present mode. Academic project; not a public product (the AI key lives in the browser).

## Decisions recorded
- ADR-001 Standalone web app; no built-in video calling.
- ADR-002 Stack: Vite + React + TypeScript + Zod + Vitest; static, no backend.
- ADR-003 Descriptor-first visuals (AI output is Zod-validated, repaired once, or rejected).
- ADR-004 Ephemeral sessions (only UI prefs, AI settings, AI cache and spend counter in localStorage).
- ADR-005 Demo-first scope: speech, AI, pictures, camera behind explicit toggles (2026-10-16).

## Implemented (code exists, unit/component tested)
- Domain + Zod schemas, content loader, matcher (60/60 fixtures).
- Renderers: flow, sequence, cycle, layers, list, mindmap with step reveal and draw-on animation; reduced motion respected.
- Session reducer (history, back/forward, clear, render-failure fallback).
- Intent parser for speech ("picture of X", "flowchart of X", commands), Auto and Manual (call-out + summon) modes.
- OpenRouter generation with validation, one repair retry, cache, per-minute cap, spend counter; auto-layout for AI flows.
- Wikipedia picture lookup (trusted image host only).
- Camera: MediaPipe gestures, pinch-spread summon, face filters, colour filters, background removal, wand sparkles; 3 camera layouts.
- UI: workspace, 5 stage themes, 4 screen effects, library, settings, help, Present mode with `/` quick bar, keyboard map.
- GitHub Pages workflow.

## Evidence
| Date | Claim | Evidence | Where |
|---|---|---|---|
| 2026-10-09 | 12 concept files valid; 60 fixtures pass reference matcher | `python tests/reference/validate_content.py` → OK | local |
| 2026-10-16 | Full check passes | `npm run check` → typecheck, eslint (0 errors), prettier, `Test Files 9 passed, Tests 131 passed` | cloud dev env |
| 2026-10-16 | Production build | `npm run build` → JS 124 KB gzipped (main) + 46 KB (MediaPipe loader, lazy); MediaPipe WASM 39 MB served only when camera is used | cloud dev env |
| 2026-10-16 | Visual check of all 12 concepts, AI flow (mocked), picture (mocked), unsupported notice, 5 themes, settings, help, Present mode | Headless Chromium screenshots, 0 console errors | cloud dev env |

## Not verified yet (needs a real machine)
- Live microphone and camera: speech accuracy, gesture reliability, face-filter alignment, background-removal frame rate. These need a physical webcam/mic; the cloud test browser has none.
- Real OpenRouter call (tests mock it) and real Wikipedia lookup (network blocked in the build environment).
- Safari/Firefox: no Web Speech API in Firefox; Safari untested.
- Playwright E2E suite not written yet (`test:e2e` absent; CI skips it).

## Known limitations
- AI key in the browser: single-owner demo only.
- Speech is English-only; Chrome sends audio to Google.
- Notices appear on the stage (so they also work in Present mode), not in the input panel as DESIGN §4 says.

## Evidence policy
Update only with verified repository state, command output, decisions and dated evidence. Never set "Implemented" or "Verified" because a task is planned.
