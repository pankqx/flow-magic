# Product Vision

## Problem
Explaining a complex idea live means splitting attention between speaking, finding the right visual, driving slides, and drawing. Slides are prepared in advance and rarely match where an explanation actually goes.

## Vision
Flow & Magic coordinates a presenter's explanation with the right visual, on a dedicated canvas the presenter controls.

**Value proposition:** "Explain the idea. Flow & Magic helps show it."

## First audience (recommended, pending OPEN_QUESTIONS Q1)
Computer-science / software-engineering students and educators. Reasons: concepts have well-known diagrams that can be curated accurately; correctness is easy for the owner to judge; early users are reachable. Other segments (general teachers, trainers, consultants, creators) are later expansions, not equal first targets.

## What is different
Existing tools tend to fall into: diagram editors (you draw), text-to-diagram tools (you write markup or a prompt and wait), AI slide generators (pre-made decks), and whiteboards (you build live). Flow & Magic's bet is **live, presenter-paced, step-revealed visuals triggered by what you say or type**, with the presenter in control. A competitive review is an open task: before public launch, list current tools in each category, what they do on live explanation, and where this product is genuinely different. Do not assert differentiation without that evidence.

## Principles
Visuals must improve understanding · the presenter stays in control · uncertainty and failure are handled honestly · generated output is validated before rendering · privacy and consent are design inputs · increments are evidence-based.

## Goals
1. Validate the concept → visual → step-through workflow with real presenters.
2. Keep the architecture ready for speech and AI (ADR-003, InputAdapter, ConceptSource).
3. Reduce manual visual switching over time without removing control.
4. Support multiple visual types behind one validated contract.
5. Provide clear control, recovery and feedback.
6. Measure quality with repeatable tests.

## Non-goals (MVP)
Video calling · slide-authoring suite · custom model training · arbitrary generation of any visual or 3D scene · native apps · SDK/extension ecosystem · billing/enterprise admin.

## Hypotheses to test
1. A presenter can get a useful, correct visual on screen faster by typing or picking a concept than by finding/drawing it. *(Measure time-to-visual vs. their usual method in usability sessions.)*
2. Step-by-step reveal helps presenters pace an explanation. *(Observe use of step controls; ask.)*
3. Honest fallbacks (suggestions, library) preserve trust after a miss. *(Observe recovery.)*
4. Presenters will share the browser tab in meetings (Present mode) rather than needing built-in video. *(Ask in usability sessions.)*
5. A curated library of ~12 concepts is enough to test the workflow; real coverage needs are discovered by logging unsupported queries in test sessions (locally, with consent).

None of these is validated yet.

## Open questions
See `OPEN_QUESTIONS.md`.
