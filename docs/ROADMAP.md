# Roadmap

Provisional; revised on evidence. Task detail lives in `TASKS.md`; this file holds goals and exit gates.

## Increment 0 — Baseline (this package)
Docs, ADRs, spec, 12-concept catalog, matcher fixtures, CI, agent playbook. **Exit gate:** repo published, CI green on the reference check, open questions Q1–Q4 answered or defaults confirmed.

## Increment 1 — Core MVP
Typed input → deterministic matcher → descriptor → SVG renderers → step-through, history, library, Present mode, states, accessibility, tests, deploy preview. **Exit gate:** all MVP acceptance criteria (REQUIREMENTS) pass with recorded evidence; baseline performance recorded; first usability session scripted.

## Increment 1.5 — Learn from real use (after the first 3–5 sessions)
Triage unsupported queries; add concepts and aliases; consider suggestion-only typo tolerance; decide whether speech is the next investment or the catalog is. **Exit gate:** documented findings and a go/no-go for Increment 2.

## Increment 2 — Speech (Suggest mode)
Explicit mic start/stop, visible state, transcript → matcher → suggestion chip; no auto-switch. Evaluate browser speech recognition vs hosted vs local. **Exit gate:** consent behavior approved; accuracy/latency/false-trigger criteria met on a labelled phrase set including technical vocabulary and representative accents.

## Increment 3 — AI-generated diagrams
Provider adapter and minimal serverless proxy, structured output, schema validation, repair retry, fallback, auto-layout decision, relevance evaluation. **Exit gate:** invalid output never renders; relevance and false-trigger targets met on a versioned dataset; cost cap in place.

## Increment 4 — Interactive 3D
Compare renderers, one curated model, fallback + text description, performance on declared hardware. **Exit gate:** acceptable performance and accessibility on declared browsers.

## Increment 5 — Session quality and Auto mode
Event model, reviewable summary, export, feedback controls, optional Auto mode after Suggest mode data. **Exit gate:** end-to-end scenarios pass; summary accuracy reviewed.

## Increment 6 — Companion integration
One target chosen from user evidence, supported APIs only, standalone mode intact. **Exit gate:** documented scenarios pass with fallback.

## Increment 7 — Gestures
Only if a concrete interaction problem justifies it. **Exit gate:** evidence-based go/no-go.

## Release gate for every increment
Acceptance criteria defined first · tests run and recorded · limitations documented · requirement/spec/architecture updated · nothing marked Verified without evidence.
