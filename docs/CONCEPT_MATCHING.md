# Concept Matching Specification

Deterministic, explainable, and honest. The matcher never guesses silently: it either matches with evidence, asks which one you meant, or says it doesn't know and offers suggestions.

Executable reference: `tests/reference/matcher_reference.py`. Fixed evaluation set: `tests/fixtures/matcher-cases.json` (60 cases). The TypeScript implementation (FM-103) must pass 100% of the fixtures.

## 1. Constants

- `MAX_INPUT_LENGTH = 200` characters.
- `FILLER` (removed from input **and** from aliases before comparison):
  `explain show me what whats s is are how does do work works tell about describe diagram visual visualize of the a an please can you give i want to see and for in with on`

## 2. Normalisation

1. Unicode NFKD, drop combining marks, lowercase.
2. Replace every run of characters outside `a-z0-9` with a single space; split on spaces → **tokens**.
3. Remove `FILLER` tokens → **content tokens**.

Aliases are normalised the same way at load time. Alias collisions after normalisation across different concepts are a content error (checked by the validator).

## 3. Algorithm

```
match(raw):
  if raw is empty/whitespace            → invalid(empty)
  if length(raw) > MAX_INPUT_LENGTH     → invalid(too_long)
  tokens = normalise(raw)
  if tokens is empty:
      if raw contains letters (e.g. non-Latin script) → none(suggestions = [])
      else                                            → invalid(no_content)
  content = tokens without FILLER
  if content is empty                   → invalid(no_content)      # e.g. "show me"

  Tier 1: content equals a concept alias exactly.
  Tier 2: a concept alias occurs in content as a contiguous whole-word sequence.
  For each concept keep its best alias (lowest tier, then most tokens).
  Candidate set = concepts at the best (lowest) tier present.
  Within it keep the concepts whose best alias has the most tokens.
  - exactly one → match(conceptId, tier)
  - several     → ambiguous(candidates sorted by id)

  Tier 3 (suggestions only, never auto-shown):
  score(concept) = number of content tokens that are in concept.keywords
  suggestions = up to 3 concepts with score ≥ 1, by score desc then id asc
  → none(suggestions)   (may be empty)
```

## 4. Design rules this encodes

- **No fuzzy auto-display.** A wrong confident visual is worse than a clear "no match". Keyword overlap only produces suggestions.
- **Longest evidence wins**: "explain the OSI model and HTTP" → OSI model (2-token alias beats 1-token alias).
- **Equal evidence is ambiguous**: "http handshake" → ask, don't pick.
- **Input is data**: injection-style or markup text is just tokens; it matches nothing and is rendered as text.
- **English-only in the MVP**: other scripts return `none` with no suggestions and the standard unsupported copy. Multilingual support is an open question (OPEN_QUESTIONS Q2).

## 5. Extending the catalog

Add a file in `content/concepts/` (see `CONTENT_AND_VISUALS.md` §5), then add at least 3 fixtures (one tier 1, one tier 2, one near-miss that must not match). The validator fails on alias collisions and on any fixture regression.

## 6. Known limitations (intentional for the MVP)

No typo tolerance, no synonyms beyond listed aliases, no stemming ("handshakes" will not match "handshake"; add plural aliases where useful), no semantic understanding. Typo tolerance (e.g. edit distance 1 on tokens ≥ 5 letters, suggestion-only) is a candidate for Increment 1.5 after measuring unsupported-input logs from usability tests.
