# Requirements Baseline

Status: proposed baseline v0.2 for review. Requirements are not implementation claims. Exact behavior lives in `SPEC_MVP.md`.

## Functional requirements

| ID | Requirement | Priority | Incr. |
|---|---|---|---|
| FR-001 | The system shall let a user start (and reset to) a new presentation session. | Must | 1 |
| FR-002 | The system shall accept a typed concept or question (max 200 chars). | Must | 1 |
| FR-003 | The system shall map supported input to a known visual descriptor deterministically. | Must | 1 |
| FR-004 | The system shall render the selected visual in a dedicated canvas. | Must | 1 |
| FR-005 | The system shall show a useful fallback (message + suggestions + library) for unsupported input. | Must | 1 |
| FR-006 | The presenter shall be able to clear or replace the current visual. | Must | 1 |
| FR-007 | The system shall keep the previous valid visual if a replacement fails or does not match. | Should | 1 |
| FR-008 | The system shall start microphone input only after an explicit user action and permission. | Must (when audio exists) | 2 |
| FR-009 | The system shall transcribe supported speech input. | Should | 2 |
| FR-010 | The system shall extract concepts from recognized input. | Should | 2 |
| FR-011 | The system shall select or generate a contextual diagram. | Should | 3 |
| FR-012 | The system shall validate generated descriptors before rendering. | Must (for generated) | 3 |
| FR-013 | The system shall support selected interactive 3D assets. | Could | 4 |
| FR-014 | The presenter shall be able to override any automatic or suggested selection. | Must | 1+ |
| FR-015 | The system may provide a post-session summary once session events are defined. | Could | 5 |
| FR-016 | The system may export a user-reviewed session report. | Could | 5 |
| FR-017 | The system may integrate with one external platform via supported APIs. | Could | 6 |
| FR-018 | The system may evaluate gesture input as an experiment. | Could | 7 |
| **FR-019** | Ambiguous input shall prompt the presenter to choose among candidates rather than guess. | Must | 1 |
| **FR-020** | The presenter shall be able to move Back/Forward through concepts already shown in the session. | Must | 1 |
| **FR-021** | The presenter shall be able to reveal a visual step by step (next, previous, show all). | Must | 1 |
| **FR-022** | The system shall provide a Present mode (clean full-viewport canvas) suitable for sharing a browser tab. | Must | 1 |
| **FR-023** | The presenter shall be able to browse and pick any concept from a library without typing. | Should | 1 |
| **FR-024** | The system shall show which concept was detected and which phrase matched. | Should | 1 |

Bold rows are new in v0.2. Rationale is in `DOC_REVIEW.md`.

## Non-functional requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-001 | Core workflows fail gracefully for invalid input/assets. | Negative tests (TC-004, 006, 017) |
| NFR-002 | The main workflow is fully keyboard operable. | TC-008 + manual |
| NFR-003 | Visible focus; WCAG AA contrast; non-colour cues; reduced motion honoured. | axe (TC-021), TC-016, manual |
| NFR-004 | No secrets in source control or client bundles. | Repo scan + build inspection |
| NFR-005 | Content and any generated descriptor are schema-validated; rendering never executes input. | TC-017, TC-018, ESLint rule |
| NFR-006 | Audio capture, retention and external processing are disclosed and controlled. | Privacy review before audio ships |
| NFR-007 | Provider/transcription integrations sit behind replaceable interfaces. | Architecture review |
| NFR-008 | Performance budgets (provisional in SPEC_MVP §6) are baselined and then enforced. | Recorded benchmark report |
| NFR-009 | Install, run, test, build and deploy steps are reproducible from a fresh clone. | Fresh-environment test |
| NFR-010 | Data collection is minimal and documented; the MVP stores no session content. | Data inventory review |
| NFR-011 | Supported browsers: latest two majors of Chrome, Edge, Firefox, Safari (desktop). | E2E on Chromium in CI + manual on others |

## MVP acceptance criteria

1. A new user can start a session and see the empty state with examples.
2. All 12 catalog concepts are reachable by typing a listed alias and by the library; each renders at every step.
3. All 60 matcher fixtures pass.
4. Unsupported, ambiguous and invalid input each show their documented state without crashing.
5. Back/Forward/Clear/Replace behave per the state machine; Clear is reversible.
6. Step-through works with keyboard and respects reduced motion.
7. Present mode enters/exits cleanly and remains legible at 1280×720.
8. The main workflow works keyboard-only with visible focus; axe shows no serious/critical issues.
9. Automated tests cover matcher, reducer, renderers, and E2E flows; CI is green.
10. A fresh clone can install, run, test and build using the README.
11. Test evidence, baseline performance numbers and known limitations are recorded in STATUS.

## Traceability

| Requirement | Tasks | Tests |
|---|---|---|
| FR-001 | FM-104, 110 | TC-001, TC-010 |
| FR-002 | FM-110 | TC-002, TC-004 |
| FR-003 | FM-102, 103 | TC-002, TC-018, TC-019 |
| FR-004 | FM-105–108 | TC-002, TC-020 |
| FR-005 | FM-103, 110 | TC-003 |
| FR-006 | FM-104, 111 | TC-005, TC-007 |
| FR-007 | FM-104 | TC-006 |
| FR-014 | FM-104, 111 | TC-005, TC-015 |
| FR-019 | FM-103, 110 | TC-011, TC-019 |
| FR-020 | FM-104, 111 | TC-014 |
| FR-021 | FM-109 | TC-012, TC-016 |
| FR-022 | FM-112 | TC-013 |
| FR-023 | FM-113 | TC-015 |
| FR-024 | FM-110 | TC-002 |
| NFR-002/003 | FM-111, 114 | TC-008, TC-016, TC-021 |
| NFR-005 | FM-102, 105–108 | TC-017, TC-018 |
| NFR-008/009 | FM-101, 116, 117 | benchmark, fresh-clone test |

Keep this table updated whenever tasks or tests change. Requirements FR-008…018 and NFR-004/006/007/010/011 map to later increments or process checks.
