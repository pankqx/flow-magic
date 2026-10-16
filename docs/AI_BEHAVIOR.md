# AI Behavior and Quality Rules

Applies when AI-assisted capabilities arrive. The MVP uses **no model**; its matcher is deterministic (CONCEPT_MATCHING).

## Interaction modes
| Mode | Behavior | Default |
|---|---|---|
| Manual | Presenter types or picks | MVP |
| Suggest | Speech/AI proposes a visual as a chip; presenter accepts or ignores; no auto-switch | Increment 2 default |
| Auto | Visual switches by itself with minimum dwell time and visible undo | opt-in, Increment 5, only after measured false-trigger data |

## Desired behavior
- Prefer curated visuals over generated ones when a curated match exists.
- Choose the simplest visual that helps.
- Show uncertainty: ask, offer choices, or say no suitable visual exists.
- Never change visuals faster than a minimum dwell time (proposed 8 s, to be tuned by testing).
- Explain why a visual appeared using metadata only (matched alias, source), never a generated rationale.
- Keep facts separate from generated interpretation; mark generated content as generated.

## Generation contract (Increment 3)
Input: concept text and optional context. Output: **only** a descriptor conforming to the schema (structured output). Pipeline: generate → Zod validate → on failure one repair attempt with the validation errors → on failure fall back to the last valid visual and tell the presenter. Generated entries carry `provenance.origin = "generated"` plus model and version.

Content quality checks for generated diagrams: labels short, ≤ 12 nodes, no duplicate/unreachable nodes, step order matches explanation order, accessible description present.

## Failure behavior
| Failure | Behavior |
|---|---|
| Transcription unavailable | Offer retry or typed input |
| Concept unclear | Ask for a clearer phrase or show supported examples |
| No relevant visual | Say so; offer library |
| Generation fails | Keep last valid visual; offer retry |
| Invalid output | Reject before rendering |
| Provider unavailable | Clear message; curated/manual fallback |

## Evaluation dimensions
Concept identification quality · visual relevance · false-trigger rate · missed-useful-visual rate · time to useful visual · dismissal rate · user-rated clarity · cost per session.

## Summary/report rules
Do not invent events; separate topics, decisions, action items, open questions; mark inferred items as suggestions; presenter reviews before export; private content is not shared by default.
