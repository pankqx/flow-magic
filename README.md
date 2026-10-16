# Flow & Magic

**Explain the idea. Flow & Magic helps show it.**

Flow & Magic is a web app that helps presenters explain complex ideas by putting the right diagram on screen at the right moment. A presenter types (later: speaks) a concept, and the app shows a clear, animated visual they can step through, replace, or clear.

> **Status:** working demo (academic MCA project). Typed, spoken and gesture input, curated + AI diagrams, pictures, camera filters. See [`docs/STATUS.md`](docs/STATUS.md) for verified facts and known limits.
> **Development model:** small vertical slices, built with AI coding agents, verified with tests.

## What the first version does

Type a concept such as *"TCP handshake"*, *"CI/CD pipeline"* or *"water cycle"*. The app matches it to a curated visual (flow, sequence, cycle or layer diagram), renders it on a large canvas, and lets you:

- step through the visual one part at a time,
- go back and forward through concepts you already showed,
- pick a concept manually from a library when matching fails,
- enter a clean full-screen **Present mode** so you can share the browser tab in Zoom, Meet or Teams.

It is deliberately **not** a video-calling tool, a slide editor, or a general AI drawing tool. See [ADR-001](docs/DECISIONS/ADR-001-product-boundary.md).

## Why this design

- **Descriptor-first visuals.** Every visual is validated data (JSON), drawn by our own small SVG renderers. The MVP uses hand-authored descriptors; later an AI model only has to *produce the same validated data*. Nothing generated is ever executed. See [ADR-003](docs/DECISIONS/ADR-003-descriptor-first-visuals.md).
- **Deterministic matching first.** The MVP matcher is rule-based, tested against a fixed fixture set, and honest about uncertainty. See [`docs/CONCEPT_MATCHING.md`](docs/CONCEPT_MATCHING.md).
- **Presenter always in control.** Suggestions can be wrong; override is one key away.

## Repository map

| Path | Purpose |
|---|---|
| `AGENTS.md` / `CLAUDE.md` | Rules for AI coding agents (read first if you are an agent) |
| `TASKS.md` | Agent-sized task backlog with dependencies and acceptance criteria |
| `DESIGN.md` | Product and UI design: layout, states, keyboard, copy |
| `docs/SPEC_MVP.md` | **Buildable MVP spec**: data types, state machine, screens |
| `docs/CONCEPT_MATCHING.md` | Exact matching algorithm |
| `docs/CONTENT_AND_VISUALS.md` | Visual descriptor contract and authoring guide |
| `docs/AGENT_PLAYBOOK.md` | Copy-paste kickoff prompts and parallel-agent rules |
| `docs/OPEN_QUESTIONS.md` | Unresolved decisions, each with the default agents should assume |
| `docs/DECISIONS/` | Architecture Decision Records |
| `content/concepts/` | The 12 curated concepts (JSON) |
| `schemas/` | JSON Schema for concept files |
| `tests/fixtures/` | Fixed matcher evaluation set |
| `tests/reference/` | Executable reference for fixtures and content rules |

Other docs: `PRODUCT_VISION`, `REQUIREMENTS`, `ARCHITECTURE`, `ROADMAP`, `TESTING`, `SECURITY_PRIVACY`, `AI_BEHAVIOR`, `ANALYTICS_AND_SUCCESS`, `ACCESSIBILITY`, `DEPLOYMENT`, `CONTRIBUTING`, `FEATURE_BACKLOG`, `SESSION_SUMMARY_REPORT`, `DOC_REVIEW`, `STATUS` (all in `docs/`).

## Check the content right now (no app needed)

```bash
pip install jsonschema
python tests/reference/validate_content.py
```

This validates every concept file against the schema and semantic rules and runs the matcher fixtures against the reference matcher. CI runs the same command.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173  (use Chrome or Edge for speech)
npm run check      # typecheck + lint + format + 131 tests
npm run build      # static site in dist/
```

Stack: Vite + React + TypeScript (strict) + Zod + Vitest + React Testing Library, MediaPipe Tasks (hands, face, segmentation), Web Speech API. No backend ([ADR-002](docs/DECISIONS/ADR-002-tech-stack.md), [ADR-005](docs/DECISIONS/ADR-005-demo-first-scope.md)).

**Deploy:** every push to `main` builds and publishes to GitHub Pages (`.github/workflows/pages.yml`). One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

## Demo guide

| You do | What happens |
|---|---|
| Press **Listen** (or `M`), say *"let me explain the TCP handshake"* | **Auto** mode: the diagram draws itself |
| Say *"next"*, *"show all"*, *"clear the board"* | Steps / clears |
| Say *"a flowchart of making tea"*, *"a mind map of machine learning"*, *"a list of planets"* | AI draws it (needs your OpenRouter key in Settings) |
| Say *"a picture of a dinosaur"* | Picture from Wikipedia (free) |
| Switch to **Manual**, shout *"dinosaur!"*, then pinch-and-spread your fingers (or press `S`) | Summons it |
| **Camera** on (`V`): 👍 next · 👎 previous · ☝️ show all · ✌️ AI draws what you just said · ✊ back · ✋ clear | Gesture control |
| Settings → face filters, colour filters, background removal, *Weather-presenter* layout, 5 stage themes, screen effects | Fun mode |
| **Present** (`F`) then share the tab in Zoom/Meet; `/` opens a small type box | Clean full-screen stage |

**Saving your $3 of OpenRouter credit:** the default model is `gemini-2.5-flash-lite` (a diagram usually costs a small fraction of a cent); every result is cached, so repeating a topic in rehearsal is free; calls are capped per minute; the header shows what you've spent. Curated concepts and pictures never use AI.

**Privacy:** the mic and camera start only on a click. Chrome's speech recognition sends audio to Google. Camera frames stay in the browser. The API key is stored only in your browser's localStorage. Fine for your own laptop, not for a public product (that needs a server proxy, see ADR-005).

## Status labels

**Proposed** → **Planned** → **In progress** → **Implemented** (code exists) → **Verified** (acceptance criteria passed with recorded evidence). Also **Deferred** and **Rejected**. Never call something Implemented or Verified without evidence.

## License

MIT. See [`LICENSE`](LICENSE).
