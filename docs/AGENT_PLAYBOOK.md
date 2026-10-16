# Agent Playbook

How to build this repository with AI coding agents safely and quickly. All agents follow `AGENTS.md`.

## 1. Principles

1. **Small tasks, strict acceptance criteria.** Give an agent exactly one `FM-xxx` row.
2. **Fixtures are the oracle.** Agents may not change `tests/fixtures/`, `content/concepts/`, or `schemas/` to make tests pass.
3. **Parallelize by directory**, never by file overlap.
4. **You verify.** After each PR run `npm run check` yourself and skim the diff for scope creep and added dependencies.
5. **Fresh context per task.** Start a new agent session for each task; point it at the task row and listed docs only.

## 2. Standard kickoff prompt

Paste, replacing `FM-xxx`:

```
You are working in the Flow & Magic repository.
Read AGENTS.md, then the FM-xxx row in TASKS.md and the docs it lists under "Read".
Implement only FM-xxx. Do not change fixtures, content, or schemas.
Work test-first. Run `npm run check` (or say exactly what you could not run).
Finish with the report format in AGENTS.md §8.
If anything in the docs conflicts with the code or with itself, stop and report the conflict instead of guessing.
```

## 3. Recommended order and parallel waves

| Wave | Tasks | Notes |
|---|---|---|
| 0 | FM-001, FM-002 | You: publish repo, answer or confirm open questions |
| 1 | FM-101 | One agent; verify CI is green before continuing |
| 2 | FM-102 | One agent; blocks everything else |
| 3 (parallel) | FM-103 `src/matcher/` · FM-104 `src/session/` · FM-105 `src/renderers/flow/` · FM-106 `…/sequence/` · FM-107 `…/cycle/` · FM-108 `…/layers/` | Up to 6 agents in separate git worktrees/branches |
| 4 | FM-109 step reveal · FM-110 shell/input/states | FM-109 touches renderers' step handling and session; run before or after, not concurrently with 105–108 |
| 5 (parallel) | FM-111 controls/keys · FM-112 present mode · FM-113 library | Shared `src/ui/` files: assign each a separate component folder |
| 6 | FM-114 accessibility · FM-115 E2E · FM-116 deploy | |
| 7 | FM-117 review | You + one agent; record evidence in STATUS |

## 4. Ownership map for parallel agents

| Agent task | May edit | Must not edit |
|---|---|---|
| FM-103 | `src/matcher/**`, its tests | everything else except exports |
| FM-104 | `src/session/**`, its tests | |
| FM-105–108 | one `src/renderers/<type>/**`, its tests | other renderer folders |
| FM-110–113 | own folder under `src/ui/**` | other UI folders |

Shared files (`src/domain/**`, `package.json`, router/app entry) are changed only by the task that owns them (FM-102/FM-101) or in a separate tiny PR you approve.

## 5. Review checklist for each agent PR

- [ ] Only the task's directories changed.
- [ ] No new dependency (or justified in the PR).
- [ ] Tests exist for each acceptance criterion; none skipped or weakened.
- [ ] Fixtures/content/schemas untouched.
- [ ] `npm run check` passes on your machine.
- [ ] No `dangerouslySetInnerHTML`/`innerHTML`, no `eval`, no remote scripts, no secrets.
- [ ] Accessibility: labels, focus, keyboard, reduced motion where relevant.
- [ ] STATUS and docs updated only with real evidence.

## 6. Common agent failure modes and counters

| Failure | Counter |
|---|---|
| Builds extra features ("while I'm here") | Rule 6.2 in AGENTS; reject PR scope creep |
| Edits tests/fixtures to go green | Rule 6.4; CI check below; review diff of `tests/` and `content/` |
| Adds a heavy dependency (Mermaid, React Flow, Redux) | ADR-002; require justification |
| Invents status/benchmarks | Rule 5; demand command output |
| Merges everything into one component | Dependency direction in AGENTS §5 |
| Silently changes behavior vs spec | Task report must list each AC with how verified |

## 7. Prompts for specific moments

**Content authoring** (adding a concept): "Add concept `<id>` following docs/CONTENT_AND_VISUALS.md §5. Create the JSON file and ≥3 matcher fixtures. Run the validator. Do not modify existing concepts or fixtures." (Humans approve fixtures.)

**Bug fix**: "Reproduce with a failing test first, then fix with the smallest change. Cite the requirement or TC it violates."

**Review-only agent**: "Review this PR against AGENTS.md and the task's acceptance criteria. List violations; do not edit code."
