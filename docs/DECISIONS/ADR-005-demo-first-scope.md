# ADR-005: Demo-first scope — speech, AI, pictures and camera move into the first build

- **Status:** Accepted
- **Date:** 2026-10-16
- **Decision owner:** Project owner (Pank)
- **Supersedes:** parts of ADR-001/002 sequencing, ROADMAP increments 2–3 and 7 ordering, AGENTS §1 hard boundaries

## Context
The owner described the "magic moment": *talking while diagrams appear by themselves*; with auto mode off,
*calling out a name and making a zoom gesture* summons it (e.g. "dinosaur" + spread fingers → a dinosaur picture).
The first user is the owner, for demos. The project is an academic (MCA) project now and may become a product later.
Budget is roughly US$3 of OpenRouter credit.

## Decision
1. Build a **demo-first** app that includes, behind explicit toggles:
   - live speech via the browser Web Speech API (free, Chrome/Edge),
   - an **intent parser** for spoken phrases ("picture of X", "flowchart of X", "list of X", "next step", …),
   - **AI diagrams** via OpenRouter using the *owner's own key*, entered in the browser and kept in localStorage,
   - **pictures** from the Wikipedia API (free, no key),
   - **camera features**: MediaPipe hand gestures, face filters, camera colour filters, background removal,
   - **stage themes** ("screen filters").
2. Everything still flows through the descriptor contract (ADR-003): AI output is Zod-validated, repaired once, or rejected.
3. No backend. The OpenRouter key never enters the repo or the bundle.

## Consequences
- Running AI from the browser exposes the key to whoever uses that browser. Acceptable for a single-owner demo;
  **not acceptable for a public product** — a server-side proxy with rate limits is required before that (ROADMAP Inc 3).
- Web Speech API sends audio to the browser vendor's service (Google for Chrome). Disclosed in the UI.
- MediaPipe model files are downloaded from Google's model storage when the camera is first turned on.
- Credit protection: response cache, a per-minute call cap, cheap default model, live spend counter.

## Revisit when
The project becomes a product (then: proxy, accounts, privacy review), or OpenRouter cost becomes a problem.
