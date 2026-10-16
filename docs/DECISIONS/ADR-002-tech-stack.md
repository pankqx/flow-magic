# ADR-002: Tech stack for the MVP

- **Status:** Accepted (proposed by documentation review; owner may override before FM-101)
- **Date:** 2026-10-09
- **Decision owner:** Project owner

## Context
The previous documentation left the stack "undecided" and planned a comparison task. For a solo developer building with coding agents, an undecided stack blocks every task and invites inconsistent choices.

## Options considered
1. **Vite + React + TypeScript** (static SPA)
2. Next.js (React with server features)
3. SvelteKit
4. Vanilla TypeScript + Web Components
5. Diagram libraries as the core: Mermaid, React Flow, D3

## Decision
Option 1 with: TypeScript `strict`, Zod (runtime validation of content and, later, model output), Vitest + React Testing Library, Playwright (+ axe-core), ESLint + Prettier, CSS Modules with CSS variables, `useReducer` (no state library), hand-written SVG renderers, npm. Use the latest stable versions at scaffold time and let `package.json` and the lockfile record exact versions.

## Rationale
- The MVP needs no server, so a static SPA is the simplest thing that works (ARCHITECTURE).
- React/TypeScript have the largest agent and library support, including three.js/react-three-fiber for Increment 4.
- Zod gives one validation path for curated content now and model output later (ADR-003).
- Own SVG renderers give full control over accessibility, step reveal and safety, and avoid fitting a general diagram library (Mermaid injects markup; React Flow targets editors; D3 is low-level) to a tiny, strict domain. Four small renderers are cheaper than integrating and constraining a library.
- No state library: state is small and a pure reducer is easiest to test (SPEC_MVP §4).

## Consequences
- Increment 3 needs a small server-side function for secrets; that is additive, not a rewrite.
- Next.js remains an option then if server rendering/routes become useful.
- Auto-layout for generated diagrams is not provided by our renderers; decide a layout library then (FM-304).

## Revisit when
The MVP needs server features earlier than planned, or the four-renderer approach proves harder to maintain than a library after Increment 3.
