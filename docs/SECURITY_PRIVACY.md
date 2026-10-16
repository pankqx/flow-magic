# Security and Privacy

Not a claim of legal compliance. Rules to apply before handling user content, audio or AI providers.

## MVP posture
Static app, no backend, no accounts, no cookies, no analytics, no network calls at runtime, no storage of session content (ADR-004). The main risks are **supply chain** and **unsafe rendering**.

## Rules
1. **Untrusted input is text.** Typed input and any future model output are rendered through React text nodes/SVG attributes only. `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` are banned (ESLint `no-restricted-syntax` + review).
2. **Validate, then render.** All descriptors pass Zod/JSON-Schema validation; unknown fields are rejected.
3. **Content Security Policy** on the deployed site: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`. Adjust per host and per increment (Increment 3 adds the API origin). Record changes in an ADR.
4. **No remote assets** in the MVP; no third-party scripts or fonts.
5. **Secrets**: none in the MVP. Later, secrets live only on the server/function; `.env*` are git-ignored; a secret scan runs in CI before Increment 3.
6. **Dependencies**: justify every new one; commit the lockfile; enable Dependabot/`npm audit` in CI; prefer few, mainstream, maintained packages.
7. **Logs/telemetry**: none by default. Never log raw audio, full transcripts or presentation content.
8. **Agents**: agents must not add network calls, analytics or storage without a task that calls for it.

## Audio and speech (Increment 2)
- Mic starts only from an explicit user action; visible recording state; one-click stop; works without mic.
- **Browser speech recognition may send audio to the browser vendor's service**; the UI must disclose this before first use. Verify the current behavior of each target browser during FM-201 and document it.
- No audio stored. Transcripts are held in memory only unless a later ADR says otherwise.

## AI providers (Increment 3)
- Disclose which text is sent to which provider.
- Server-side proxy, rate limits, per-user and global cost caps.
- **Prompt injection**: treat transcripts and any user text as data; the model may only emit descriptors; descriptors are validated; model output never reaches the DOM except through renderers.
- Provider failure never breaks the session (keep last valid visual).

## Threat areas
Exposed keys · malformed input · prompt injection · unsafe rendering of generated payloads · accidental audio capture/retention · unauthorized access to stored sessions (if ever added) · sensitive data in logs/exports · dependency compromise · abuse of paid AI endpoints.

## Privacy questions (decide before the relevant increment)
Is audio ever stored? Are transcripts stored? Which provider gets which data? How can a user delete everything? Are summaries generated locally or externally? What telemetry, if any, and why?
