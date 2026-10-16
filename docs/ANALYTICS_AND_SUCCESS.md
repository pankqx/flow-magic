# Success Measures and Analytics

**No analytics infrastructure in the MVP.** Measure through the test suite, local instrumentation in test builds, and moderated usability sessions with consent.

## MVP success questions
1. Can a first-time user get a correct visual on screen without help? (task completion)
2. How long from starting to a visible visual, versus their usual method? (time-to-visual, seconds)
3. When matching fails, do they recover? (recovery rate, route used: suggestion / library / retype)
4. Do they use step reveal and Present mode unprompted? (usage observed)
5. Would they use it in a real explanation, and for what? (interview)

## Engineering metrics (from tests/benchmarks)
Matcher fixture pass rate (target 100%) · render success across all concept×step combinations · median and p95 time from submit to visible visual (baseline at FM-117, then budget) · workflow-breaking defects by severity · axe violations by severity.

## Usability study plan (after FM-117)
5 participants from the first audience; 20 minutes each; think-aloud; scripted tasks (TASKS/TESTING §5); capture notes and, with consent, the list of unsupported queries typed. Output: findings, catalog gaps, go/no-go for Increment 2.

## Future AI metrics
Concept extraction precision/recall on labelled data · visual relevance ratings · false-trigger and missed-trigger rates · transcription word error rate on technical vocabulary and accents · end-to-end latency · cost per session.

## Privacy
Aggregate and minimal. No raw audio, transcripts or presentation content for analytics by default. Any collection needs purpose, disclosure, retention rule, and an ADR. Do not set numeric targets for subjective measures before a baseline exists; fixture-based pass rates may be 100% from the start.
