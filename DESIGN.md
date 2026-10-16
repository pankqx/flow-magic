# Product and UI Design — Flow & Magic

## 1. Design intent

Flow & Magic is a **live visual-explanation workspace**: not a slide editor, not a video-call product. Its promise is to help a presenter make an idea visible while staying in control.

Principles:
1. **Clarity before spectacle**: a visual must explain, not just look impressive.
2. **Presenter in control**: automation is always reversible, dismissible and off by default until proven.
3. **Low interruption**: nothing demands attention while the presenter is talking.
4. **Honest uncertainty**: when unsure, ask or offer choices; never show confident nonsense.
5. **Fast recovery**: bad input, missing assets or render failures never destroy the session.
6. **Progressive complexity**: typed + curated first; speech, AI and 3D only after the base workflow is useful.
7. **Accessible by default**: keyboard, focus, contrast, text alternatives, reduced motion.

## 2. Layout (desktop)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Flow & Magic   [ Untitled session ✎ ]            [Library] [Present] [New]│  header
├──────────────┬─────────────────────────────────────────────────────────┤
│ Concept      │                                                         │
│ [___________]│                 CANVAS                                  │
│ [ Show ]     │        (visual, step-revealed, large)                   │
│              │                                                         │
│ Try:         │                                                         │
│  TCP handshake│                                                        │
│  CI/CD pipeline│                                                       │
│  Water cycle │                                                         │
│              ├─────────────────────────────────────────────────────────┤
│ Recent       │ ◀ Back  ▶ Forward │ ◀ Step 2/5 ▶  Show all │ Clear      │  controls
│  • DNS       │ Detected: DNS resolution (matched "dns lookup")  [details]│  status
└──────────────┴─────────────────────────────────────────────────────────┘
```

- Left panel (≈ 280 px): input, examples, recent history (the history list, clickable).
- Canvas gets all remaining space and is visually dominant.
- Controls bar sits directly under the canvas; status line shows what was detected and why (transparency, FR-024).

## 3. Components

| Component | Behavior |
|---|---|
| Header | Product name, editable session title, Library, Present, New session |
| Concept input | Single-line text field with visible label "Concept", Show button, max 200 chars, examples below as buttons |
| Canvas | Renders the current descriptor; empty/notice states inside the same region; `role="img"` wrapper with the descriptor description, SVG `<title>`/`<desc>` |
| Step controls | Previous step, Next step, Show all, "Step n/N" indicator |
| History controls | Back, Forward; recent list in the left panel |
| Clear | Returns canvas to empty state (reversible via Back/Forward) |
| Status line | `aria-live="polite"`; shows detected concept and matched phrase, or the notice |
| Library | Drawer/modal: filter box, concepts grouped by category with title + one-line summary |
| Help dialog | Lists the keyboard map; opened with `?` |

## 4. States and microcopy

| State | Where | Copy |
|---|---|---|
| Empty | canvas | "Enter a concept to see it explained." + 3 example buttons |
| Loading | status | "Finding a visual…" (appears only if it takes > 150 ms) |
| Showing | status | "Showing: {title}" and "Matched “{alias}”" |
| Unsupported | input panel notice | "I don't have a visual for “{query}” yet." + "Did you mean:" up to 3 buttons + "Browse the library" |
| Ambiguous | input panel notice | "“{query}” could mean:" + one button per candidate |
| Invalid: empty | under input | "Type a concept to begin." |
| Invalid: too long | under input | "Please keep it under 200 characters." |
| Invalid: no content | under input | "Try a concept name, for example “DNS lookup”." |
| Render error | canvas banner | "That visual couldn't be drawn. Your session is safe. Try again or pick another." + Retry + Library (previous visual stays) |
| Present hint | canvas corner | "Esc to exit · ← → steps" fades after 3 s |

All user text is shown as text; never interpreted as HTML.

## 5. Keyboard map

Single-key shortcuts are **disabled while the concept input is focused** (except Enter and Esc).

| Key | Action |
|---|---|
| `/` | Focus concept input |
| `Enter` (in input) | Submit |
| `Esc` | In input: blur · In notice: dismiss · In library/help: close · In Present mode: exit |
| `→` or `Space` | Next step |
| `←` | Previous step |
| `A` | Show all steps |
| `]` / `[` | Forward / Back through concepts |
| `C` | Clear canvas |
| `L` | Open library |
| `F` | Toggle Present mode |
| `?` | Help |

Every action is also available as a visible button; no function is keyboard-only or mouse-only.

## 6. Present mode and remote presenting

Because the product does not include video calling (ADR-001), remote presenters **share the browser tab or window** in their meeting tool. Present mode makes that work well:

- Hides all chrome; the canvas fills the viewport; fonts scale to stay legible at 1280×720.
- Uses the Fullscreen API when available, falls back to an in-page layout.
- Keys keep working; an unobtrusive hint shows and fades.
- Exiting restores focus to the trigger.
- A "Presenting with Zoom/Meet/Teams" how-to belongs in the README after FM-117, written from a real test, not assumed.

Presenter view vs separate audience window is a later increment (FEATURE_BACKLOG).

## 7. Responsive behavior

- Desktop ≥ 1024 px: layout above.
- Tablet 640–1023 px: left panel collapses above the canvas; controls stay under the canvas.
- Mobile < 640 px: stacked; input first; controls wrap; Present mode is the same full viewport. Mobile is supported but not the priority.

## 8. Visual style (provisional tokens)

Defined as CSS variables so themes are cheap; light and dark via `prefers-color-scheme`.

- Neutral chrome, high-contrast canvas, one accent colour for the primary action.
- 8 px spacing scale; system font stack; diagram text ≥ 16 px at 1280×720.
- Node kinds differ by **shape and an icon/label cue**, not colour alone: process = rounded rectangle, store = cylinder-like, external = dashed outline, output = double border.
- Focus ring: 3 px, ≥ 3:1 against adjacent colours.
- Motion: ≤ 200 ms fade/draw on reveal; none under reduced motion; never loops.

## 9. Interaction modes (design contract for later increments)

| Mode | Increment | Behavior |
|---|---|---|
| **Manual** | 1 | Presenter types or picks; nothing changes on its own |
| **Suggest** | 2 | Speech produces a *suggestion chip* ("Show: DNS resolution?") the presenter accepts with one key or ignores; it expires after a few seconds; no auto-switch |
| **Auto** | 5, opt-in | Visual switches by itself with a minimum dwell time and a visible undo; enabled only after measured false-trigger rate is acceptable |

## 10. Future explorations (candidates, not commitments)

Timeline of concepts shown · "Why this visual?" with confidence · presenter notes · summary/report export · "improve this visual" feedback · audience vs presenter window · saved sessions (only with a privacy decision) · user-authored concepts.
