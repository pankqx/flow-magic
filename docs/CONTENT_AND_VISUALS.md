# Visual Content and Rendering Contract

## 1. Principle: descriptor-first (ADR-003)

A visual is **data**, not code. Every visual, curated now or AI-generated later, is a descriptor validated against `schemas/concept.schema.json` and drawn by our own pure SVG renderers. Nothing from a model or a user is ever executed or injected as HTML.

## 2. Visual types in the MVP

| Type | Use | Layout | Notes |
|---|---|---|---|
| `flow` | processes, architectures | nodes on a `col`/`row` grid (cols 1–6, rows 1–4), straight arrows | max 12 nodes, 20 edges; one edge per node pair |
| `sequence` | protocols, conversations | actor lanes left→right, messages top→bottom | 2–6 actors, ≤ 20 messages; no self-messages |
| `cycle` | repeating loops | nodes evenly on a circle | 3–8 nodes; arrows follow `direction` |
| `layers` | stacks, models | bars top→bottom | 2–10 layers |

Each element has an integer `step` (≥ 1, contiguous from 1). Elements with the same step appear together. The step controls reveal by step number.

## 3. Catalog (v1, 12 concepts)

| Id | Type | Category |
|---|---|---|
| http-request-response | sequence | networking |
| tcp-handshake | sequence | networking |
| dns-resolution | sequence | networking |
| osi-model | layers | networking |
| client-server | flow | software-engineering |
| ci-cd-pipeline | flow | software-engineering |
| git-workflow | flow | software-engineering |
| mvc-pattern | flow | software-engineering |
| jwt-auth | sequence | software-engineering |
| agile-scrum | cycle | software-engineering |
| water-cycle | cycle | science |
| photosynthesis | flow | science |

Mix is intentional: mostly software/networking (the recommended first audience, OPEN_QUESTIONS Q1) plus two science entries to prove the model is not CS-specific.

## 4. Renderer rules

1. Pure functions of `(descriptor, currentStep)`; no app state, no network.
2. Output SVG built through React elements. **Never** `dangerouslySetInnerHTML`/`innerHTML` (ESLint rule enforces it).
3. Scale to the container with `viewBox`; text ≥ 16 px at 1280×720.
4. Labels must not overlap arrows or each other for catalog content; truncate with ellipsis plus full text in `<title>` only if a label exceeds its box.
5. Set `<title>` (descriptor title) and `<desc>` (descriptor description); wrapper `role="img"` with `aria-labelledby`.
6. Distinguish node kinds by shape, not colour only.
7. Hidden (future-step) elements are not in the accessibility tree (`display: none` or not rendered).
8. Unknown/invalid descriptor → throw a typed `RenderError`; the UI catches it and shows the render-error state.
9. Reveal animation ≤ 200 ms; none under `prefers-reduced-motion`.

## 5. Authoring a concept

1. Copy an existing file in `content/concepts/` of the same visual type.
2. `id` = kebab-case = file name. `aliases`: natural phrasings; no plural/singular duplicates needed beyond what people say; avoid aliases that are a single generic word (collisions). `keywords`: single lowercase tokens for suggestions only.
3. `visual.description`: 20–600 chars; a full-sentence explanation usable by a screen-reader user.
4. Steps: order the reveal as you would explain it aloud.
5. Add ≥ 3 matcher fixtures (CONCEPT_MATCHING §5).
6. Run `python tests/reference/validate_content.py` (later `npm run validate:content`).
7. Provenance: `origin: original` and license MIT unless adapted from a source whose license permits it; record `sourceUrl`.

## 6. Licensing and attribution

MVP content is original and MIT-licensed. Any adapted or external asset needs recorded origin, license and attribution before merge. Remote origins are disallowed in the MVP.

## 7. Future types

`image`, `animation`, `model3d` are reserved type names. Adding one requires an ADR, schema version bump, renderer, fallback, text description and accessibility review.
