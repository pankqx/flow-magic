# Contributing and Git Workflow

## Branches
`main` is always releasable and protected (require CI + review). Work on short branches named with the task: `feat/FM-103-matcher`, `fix/FM-110-focus-after-submit`, `docs/FM-002-open-questions`, `test/FM-115-e2e`.

## Commits (Conventional Commits)
`feat(matcher): add tier-2 phrase matching (FM-103)` · `test(session): cover history truncation (FM-104)` · `fix(ui): restore focus after Present mode (FM-112)` · `docs: update STATUS with FM-103 evidence`.

## Pull requests
Use the PR template. One task per PR. CI must be green. Changes to `tests/fixtures/`, `content/concepts/` or `schemas/` need the `oracle-change-approved` label after human review (CI enforces).

## Branch protection (set once in GitHub)
Require status checks (`Content and fixtures`, `App checks`, `E2E`), require PR review, disallow force-push to `main`, require linear history if preferred.

## Solo workflow
Even alone, use branches and PRs; the checklist and the CI oracle guard catch assumptions that are easy to miss, especially with agent-written code.

## Releases
Tag `v0.x.0` when an increment's exit gate passes; summarise evidence in the release notes.
