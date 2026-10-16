# Candidate Feature Backlog

Discovery and prioritization only; not a commitment. MVP items already in scope (presenter override, history, library, step reveal, Present mode, transparency) are in TASKS.md and removed from here.

## Candidates

1. **"Why this visual?" panel** — show matched alias/source/confidence from metadata. Risk: generated rationales may be wrong; keep grounded.
2. **Session summary and report** — reusable notes from explicit events (see SESSION_SUMMARY_REPORT). Needs event model + retention rules.
3. **Post-session improvement suggestions** — framed as suggestions, not judgments.
4. **Presenter notes** — private notes per concept; needs presenter/audience separation.
5. **Audience window vs presenter window** — second window via `BroadcastChannel` before any server sync; no built-in video needed.
6. **Prepared sequence ("playlist")** — presenter queues concepts before a talk and advances with one key; low-risk, high-utility for lectures.
7. **User-authored concepts** — import/edit descriptors (JSON or simple form) with the same validation; unlocks coverage without developer work.
8. **Concept pack format** — shareable bundles of concepts by subject (e.g. "Networking 101").
9. **Export** — Markdown/PDF/PNG/SVG of a visual or session outline.
10. **Feedback capture** — useful / irrelevant / wrong concept / too slow, with minimal data.
11. **Multilingual input and labels** — depends on Q2 and speech provider support.
12. **Embed/share a single visual by link** — needs hosting and privacy decisions.
13. **Typo tolerance for matcher** — suggestion-only edit-distance matching.

## Prioritization framework
Score 1–5: user value · evidence of demand · strategic fit · confidence · implementation cost (reverse) · risk/privacy burden (reverse). Prefer features that improve the core explanation workflow or retire a major uncertainty. Do not prioritize because it demos well.
