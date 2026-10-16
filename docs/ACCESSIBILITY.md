# Accessibility Requirements

Part of "done", not a final polish step. Target: WCAG 2.2 AA where applicable.

## MVP checklist
- Whole workflow keyboard operable; keyboard map in DESIGN §5; every shortcut also a button.
- Visible focus (3 px, ≥ 3:1 contrast); logical focus order; focus moved deliberately after submit, opening/closing dialogs and exiting Present mode.
- Inputs have visible labels; buttons have accessible names; toggles expose state (`aria-pressed`).
- Status, notices and step changes are announced via an `aria-live="polite"` region (not assertive).
- Canvas wrapper `role="img"` with accessible name and long description from the descriptor; SVG `<title>`/`<desc>`; future-step elements are absent from the accessibility tree.
- Text contrast ≥ 4.5:1 (large text ≥ 3:1); diagram text ≥ 16 px at 1280×720.
- Meaning never by colour alone: node kinds differ by shape and label cue.
- Targets ≥ 24×24 CSS px (prefer 44).
- `prefers-reduced-motion`: no animated reveal; nothing loops or flashes.
- Dialogs (library, help): focus trap, `Esc` closes, focus returns to trigger.
- Zoom to 200% and text-spacing overrides do not break the layout.
- Present mode: shortcuts keep working; exiting restores focus.

## Future features
Speech must never be the only way to operate the app; provide transcripts/text alternatives; 3D needs a textual description and non-3D fallback; gestures optional; captions/language needs considered for audiences.

## Verification
axe-core in Playwright on every state (TC-021) **plus** keyboard-only walkthrough (TC-008) **plus** a screen-reader spot check (NVDA or VoiceOver) recorded in a test report. Automated tools supplement, not replace, manual review.
