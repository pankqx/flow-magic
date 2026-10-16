# ADR-003: Descriptor-first visuals

- **Status:** Accepted
- **Date:** 2026-10-09
- **Decision owner:** Project owner

## Context
The product must show curated visuals now and AI-produced visuals later, and must never execute untrusted output.

## Options considered
1. Static image/SVG files per concept.
2. HTML/JS snippets per concept (and, later, model-generated HTML).
3. **Validated structured data (descriptors) drawn by our own renderers.**

## Decision
Option 3. A visual is JSON validated against `schemas/concept.schema.json` (mirrored in Zod). MVP types: `flow`, `sequence`, `cycle`, `layers`. Curated entries are hand-authored; Increment 3 AI output must conform to the same schema.

## Rationale
- Step-by-step reveal, accessibility text, theming and responsiveness come for free from structure; images give none of these.
- The AI later only has to produce data; the whole safety story is "validate, then render as SVG elements".
- Content is diffable, reviewable and testable (validator + fixtures).
- Avoids licensing questions: all MVP content is original.

## Consequences
- Limited expressiveness (four types) by design; new types need an ADR.
- Layout is explicit (grid/lanes) for curated content; generated layouts need an auto-layout decision.

## Revisit when
Users repeatedly need visuals the four types cannot express, or generated diagrams cannot be laid out acceptably.
