# Documentation Review (v0.1 → v0.2)

Reviewer: Claude, 2026-10-09. Input: the original 24-file documentation set.

## What was strong (kept)
Clear product boundary (ADR-001) · honest status vocabulary and evidence policy · safety-first rules (no executing model output, consent for audio) · incremental roadmap with exit gates · templates · accessibility and privacy treated as requirements.

## Gaps found and how v0.2 closes them

| # | Gap in v0.1 | Why it mattered | Change in v0.2 |
|---|---|---|---|
| 1 | Stack "undecided"; Increment 0 planned stack comparisons | Blocks every agent task; invites inconsistent choices | ADR-002 decides the stack; comparison tasks removed |
| 2 | "Curated visuals" never defined — no concept list, no asset format | Nothing buildable or testable | 12-concept catalog, JSON Schema, authoring guide, validator |
| 3 | No matching algorithm; "deterministic mapping" unspecified | Agents would invent one; false matches | CONCEPT_MATCHING spec + 60 fixtures + executable reference |
| 4 | Visual descriptor deferred to Increment 3 | MVP and AI would use different pipelines | ADR-003: descriptor-first from day one |
| 5 | No data model, state machine, or exact screen behavior | Ambiguity → divergent implementations | SPEC_MVP (types, reducer table, behaviors) |
| 6 | Remote presenting unresolved by ADR-001 | Core use case without a path | Present mode (FR-022) and tab-share guidance |
| 7 | "Previous/next concept if applicable" undefined | Control behavior unclear | History Back/Forward (FR-020), reversible Clear |
| 8 | Nothing made the live explanation paced | Weak MVP value | Step-through reveal (FR-021) via `step` fields |
| 9 | Ambiguous input and manual fallback not specified | Dead-ends after a miss | FR-019 ambiguity, FR-023 library, FR-024 transparency |
| 10 | Tasks lacked dependencies, requirement links, concrete ACs | Not agent-sized or verifiable | TASKS rewritten with Depends/Read/ACs/Reqs |
| 11 | AGENTS.md told agents to read 7 docs before every task | Wastes context | Task-scoped reading list |
| 12 | No guard against agents editing tests to pass | Common failure mode | AGENTS rule 6.4 + CI oracle-guard |
| 13 | No CI, PR/issue templates, license, root SECURITY, editorconfig | Not "ready to upload" | Added |
| 14 | No parallel-agent plan or prompts | You plan to build with agents | AGENT_PLAYBOOK |
| 15 | "No numeric targets until baseline" left agents with none | No engineering direction | Provisional budgets in SPEC_MVP §6, re-baselined at FM-117 |
| 16 | Speech planned as auto-switching implicitly | False triggers are the main UX risk | Interaction modes: Manual → Suggest → Auto (opt-in) |
| 17 | Browser speech APIs may send audio to vendors | Privacy disclosure | SECURITY_PRIVACY audio section |
| 18 | No CSP / lint rule for unsafe rendering | Safety was principle only | Concrete CSP and banned APIs |
| 19 | Open questions unresolved and unowned | Agents cannot ask | OPEN_QUESTIONS with defaults |
| 20 | Competitive positioning absent | Unvalidated differentiation | Explicit open task in PRODUCT_VISION (no claims made) |

## Remaining risks
1. **Value risk**: a typed 12-concept demo may not feel "magic". Mitigation: usability sessions after FM-117; Increment 1.5 gate before investing in speech/AI.
2. **Coverage risk**: curated catalog scales by hand. Mitigation: user-authored concepts and concept packs are backlog items 7–8.
3. **Layout risk**: explicit grid layout is fine for curated content but not for AI output (FM-304).
4. **Renderer polish**: label overlap on dense diagrams needs real visual review beyond tests.
5. **Speech accuracy** on technical vocabulary and accents is unproven (FM-201/205).
6. **Provisional budgets** are guesses until measured.

## Not verified
No application exists. The reference tooling was run once in the authoring environment (STATUS evidence). Browser/speech vendor behavior, hosting specifics and the competitive landscape were not researched in this pass.
