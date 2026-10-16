# Open Questions and Defaults

Agents cannot ask in the middle of a task. Each question has a **default** that agents must assume until the owner answers. Change the default here and note the date.

| # | Question | Default (assume this) | Blocks | Owner answer |
|---|---|---|---|---|
| Q1 | Which audience do we validate with first? | Computer-science / software-engineering students and educators (catalog is built for them) | usability test plan, catalog growth || Owner first (demo); CS students later — 2026-10-16 |
| Q2 | Which languages must typing/speech support? | English only for MVP; non-Latin input shows the unsupported state | matcher, copy | |
| Q3 | Repository visibility and license? | Public repo, MIT license | FM-001 || Public, MIT — 2026-10-16 |
| Q4 | Hosting target for the static build? | Any free static host with Git integration (Netlify, Vercel, Cloudflare Pages or GitHub Pages); choose at FM-116 | FM-116 || GitHub Pages — 2026-10-16 |
| Q5 | Which coding agents will be used? | Any; `AGENTS.md` is the shared source, `CLAUDE.md` imports it | playbook tuning | |
| Q6 | Is speech needed before external users see it? | No; ship the typed MVP first, then speech in Suggest mode | roadmap order || Yes: speech is in the first demo (ADR-005) — 2026-10-16 |
| Q7 | Product name, domain and branding final? | "Flow & Magic" as a working name; no logo yet; check name/domain availability before public launch | README, UI header | |
| Q8 | Persist sessions? | No (ADR-004) | FM-505 | |
| Q9 | Remote presenting? | Via screen/tab share of Present mode (no built-in video) | DESIGN §6 | |
| Q10 | AI provider and monthly budget for Increment 3? | Undecided; provider behind an adapter; hard monthly cap required before any public AI feature | FM-302 || OpenRouter, owner key in browser, ~US$3 total — 2026-10-16 |
| Q11 | Business model? | None for now; keep the project open and evidence-driven | positioning || Academic (MCA) project now; maybe a digital product later — 2026-10-16 |
| Q12 | Who reviews and merges agent PRs? | The owner; CI must be green | CONTRIBUTING | |
| Q13 | Does "Magic" mean AI-generated visuals as the headline value? | Yes eventually; MVP proves the workflow with curated visuals | vision wording || Yes — AI diagrams + pictures in the demo (ADR-005) — 2026-10-16 |

## Questions for later (do not decide now)

Audience window vs presenter window · teacher-specific features (quiz, handouts) · embedding in LMS or meeting tools · gesture control demand · pricing.
