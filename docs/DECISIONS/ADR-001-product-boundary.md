# ADR-001: Standalone Web App First

- **Status:** Accepted
- **Date:** 2026-10-09
- **Decision owners:** Project owner
- **Context:** Flow & Magic needs a clear product boundary before architecture and technology selection.

## Decision

Build Flow & Magic initially as a standalone browser-based visual explanation and presentation application. It will accept typed concepts and display curated associated visuals. Future increments may add speech input, AI-assisted context extraction, generated diagrams, interactive 3D, and integrations with selected external platforms.

Built-in video calling, meeting rooms, participant management, and conferencing infrastructure are explicitly outside the initial scope.

## Rationale

- Validates the distinctive concept-to-visual workflow first.
- Avoids duplicating mature conferencing capabilities.
- Reduces initial technical and operational scope for a solo developer.
- Keeps external integrations optional and isolated.
- Enables incremental evaluation of speech and AI features.

## Consequences

Positive:
- Smaller MVP and clearer acceptance tests.
- Easier to prototype and demonstrate independently.
- Architecture can focus on visual orchestration and rendering.

Trade-offs:
- Initial version does not replace video-conferencing tools.
- Sharing/presenting to a remote audience may require an external platform or a later delivery feature.
- Future integrations must respect supported APIs and permission constraints.

## Revisit when

User research demonstrates that the lack of native multi-user presentation materially blocks adoption, or a supported integration strategy cannot meet the product's primary use cases.
