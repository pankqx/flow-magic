# ADR-004: Ephemeral sessions in the MVP

- **Status:** Accepted
- **Date:** 2026-10-09
- **Decision owner:** Project owner

## Decision
MVP sessions live in memory only. No session content is written to localStorage, IndexedDB, cookies, or a server. Reloading starts a new session. Only non-content UI preferences (e.g. theme override) may use localStorage.

## Rationale
Removes retention, deletion and access-control obligations; simplifies tests; matches the privacy principle of collecting the minimum. Persistence has no validated demand yet.

## Consequences
No saved history or resume. Revisit with an explicit privacy design before FM-505 or any export of session content.

## Revisit when
Usability tests show presenters want to prepare, save, or resume sessions.
