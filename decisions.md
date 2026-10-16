# decisions.md

Maintained per the assessment requirement. This file records decisions made by the AI agent (Claude) during implementation — the trade-offs weighed, alternatives rejected, and things inferred where the brief left room. It is written as decisions are made, not reconstructed afterward.

Human decisions (the developer's own choices) are noted separately where they differ.

---

## Pre-build decisions (before any code is written)

### 1. No waveform

**Decision:** Skip the waveform entirely.

**Alternatives considered:**

- `wavesurfer.js` — full-featured but heavy; drag-to-trim edges requires significant custom code on top
- `peaks.js` — purpose-built for this use case but adds a large dependency
- Raw `AudioContext + decodeAudioData` + canvas — total control but 2–3 days of work for correct edge trimming

**Why skipped:** The brief says "a waveform is a nice affordance, not a requirement." The core evaluation criterion is _speed of timing a sheet_ — keyboard stamping covers that entirely without a visual timeline. Implementing a waveform well (drag to place, drag edges to trim, zooming, smooth playback scrubbing) is the "hard" tier and would consume most of the available time with uncertain payoff. The inspector panel with nudge buttons gives precise control without the canvas complexity.

**What we lose:** Visual placement of segments; drag-to-trim. These are compensated by keyboard stamping + nudge buttons.

---

### 2. Keyboard-first stamping as the primary interaction

**Decision:** `Enter` stamps the current time onto the focused line and auto-advances to the next untimed line. Arrow keys navigate the list. Space plays/pauses audio.

**Alternatives considered:**

- Click-to-stamp (click line while playing) — requires mouse, slower, harder to do in rhythm
- Click a "stamp" button per line — same problem
- Space to stamp — conflicts with the universal play/pause binding on audio elements

**Why this:** The brief is explicit: "Stamping a time while the track plays beats typing one into a box." Keyboard keeps both hands free and matches the rhythm of listening. `Enter` = "mark this line now" is semantically clear. `Space` = play/pause is universal muscle memory.

**Guessed:** The brief does not specify which key. `Enter` is the most natural "confirm/place" mapping and avoids conflicts with audio controls.

---

### 3. State management: useReducer + Context (no external library)

**Decision:** A single `useReducer` at the app root, distributed via Context. No Zustand, Redux, Jotai, or similar.

**Alternatives considered:**

- Zustand — minimal, good ergonomics, but adds a dependency and the reviewers would need to know its API
- Redux Toolkit — far more setup than this problem needs
- Plain `useState` per component — state is shared across audio player, lyrics list, and inspector; too much prop drilling

**Why this:** The state shape for this editor is well-defined and finite. A reducer makes every state transition explicit and traceable — good for a submission being read by others. No installation needed. The `currentTimeMs` (updated on `timeupdate`) is the only high-frequency update; everything else is event-driven.

**Guessed:** The brief leaves this entirely open. `useReducer` is the most readable choice for a codebase being reviewed cold.

---

### 4. Styling: Tailwind CSS v4 + existing CSS variables

**Decision:** Use Tailwind CSS v4 (via `@tailwindcss/vite`) for all layout and utility classes. Keep the existing CSS custom properties (`--accent`, `--surface`, `--border` etc.) for the colour system and dark mode. Map those variables into Tailwind's theme via `@theme inline` so components can use `bg-surface`, `text-accent`, `border-border` without arbitrary value syntax.

**Alternatives considered:**

- Plain CSS extension — correct for simple pages, wrong for a multi-panel editor
- CSS Modules — good scoping but adds file-per-component overhead with no layout speed benefit
- Styled-components — runtime CSS-in-JS, no benefit over Tailwind for this use case

**What stays from the original CSS:** The `:root` custom properties and dark mode media query are kept exactly as-is. `@theme inline` references those variables at runtime, so dark mode still works automatically without any Tailwind dark mode config.

**Setup:** `@tailwindcss/vite` plugin added to `vite.config.ts`. `@import "tailwindcss"` at the top of `styles.css`. Zero JS config file needed (Tailwind v4 is CSS-first).

---

### 5. Bring-your-own-track: file picker + paste textarea, fully client-side

**Decision:** A "Load track" screen with two paths — (a) use the seeded API track, (b) pick a local audio file and paste lyrics. No server involvement for custom tracks.

**Alternatives considered:**

- URL field for audio — requires CORS to be permissive on the audio host; fragile
- Extending the API with a POST /track route — the brief explicitly says there is no such route; we are told not to create one on the server side as the requirement "lives on your side of the wire"
- Drag-and-drop audio file — nice but adds complexity; file picker achieves the same result

**Why this:** The brief is explicit: "this requirement lives on your side of the wire — a file picker or a URL field for the audio, a paste box for the lyrics." File picker is more reliable than URL (no CORS). Paste textarea for lyrics is the simplest possible input. Both work offline and require no backend changes.

**Custom track persistence:** Saved to `localStorage` (serialised state). API is only used for the seeded track. This is a clean separation — the API was not designed for multiple tracks, and we respect that constraint.

---

### 6. API persistence for seeded track, with 409 conflict handling

**Decision:** Wire up `PUT /api/v1/track/alignment` for the seeded track. On `409`, surface the conflict to the user and merge server state into local state (server wins for version, user keeps unsaved edits in view).

**Alternatives considered:**

- localStorage only (no API calls for saves) — simpler but the brief says "Wiring up a real save — with the failure cases that come with one — is worth showing us"
- Optimistic save (update UI immediately, then sync) — increases complexity of rollback on 409

**Why this:** The brief explicitly says "An interface that copes with [409] is worth more than one that assumes saves always land." Handling the version conflict shows understanding of concurrent state. We choose pessimistic save (show saving state, update UI on success) to keep the 409 path clean.

**Units note kept explicit in code:** Segment times are `integer milliseconds` (`start_ms`, `end_ms`). The track's `duration_seconds` is a `float`. These two units never mix in the same variable. The state stores everything internally as integer milliseconds. Conversion happens only at the API boundary.

---

### 7. API schema: kept as-is

**Decision:** Do not modify the backend schema or routes.

**Why:** The existing schema maps cleanly to our UI needs. `{ version, lines[], segments[] }` is sufficient. The brief says "We are not going to grade you on our schema" — but changing it with no compelling reason adds noise. If we had a concrete UX need the schema couldn't serve, we would change it and document why here.

---

### 8. Two-screen app: Load → Editor

**Decision:** A "Load" screen where you choose the seeded track or load your own, then an "Editor" screen.

**Alternatives considered:**

- Single screen with the track always loaded from the API — fails the bring-your-own requirement cleanly
- Modal/drawer for loading a custom track within the editor — clutters the editor; the loading context is genuinely different from the editing context

**Why this:** The bring-your-own-track requirement creates a natural seam. The load screen is lightweight (two options, a file picker, a textarea). Once in the editor, the source of the track (API vs file) is invisible — the state shape is identical.

---

### 9. Line identification: always by `id` and `index`, never by `text`

**Decision:** All internal lookups, segment mappings, and UI keys use `line.id`. Text is display-only.

**Why:** The brief explicitly warns: "a line cannot be identified by its text" — chorus and verse lines repeat verbatim. Anything keyed on text uniqueness breaks. The seed file notes this as deliberate.

---

### 10. Skipped: undo/redo

**Decision:** Not implemented.

**Why:** The brief lists it as "hard" tier. Implementing undo/redo correctly with server-persisted state (where a "redo" might conflict with the server version) requires a command stack that interacts with the save flow. The time investment is not justified given the other priorities. Correcting a misplaced stamp is fast with the inspector nudge buttons.

---

### 11. Skipped: LRC export

**Decision:** Not implemented in initial build. Can be added at the end if time allows.

**Why:** Nice-to-have. The core product value is producing timings, not exporting them. If all other features are solid, this is a five-minute addition.

---

### 12. Multi-select + bulk nudge

**Decision:** Implement shift-click to select a range of lines. A "nudge selected" control in the inspector moves all selected segments by the same ±ms amount.

**Why:** The brief calls this out explicitly: "Nudging a run of lines together beats nudging eight lines one at a time." This is a direct efficiency requirement, not a nice-to-have.

**Guessed:** The brief says "shift a run of lines together when they are all late by the same amount" but does not specify the interaction. Shift-click range select is the most conventional pattern for list multi-selection.

---

### 13. Auto-advance after stamp

**Decision:** After stamping a line with Enter, focus automatically moves to the next untimed line (or the next line if all are timed).

**Guessed:** The brief does not specify. Auto-advance matches the mental model of "doing a first pass in real time" — you stamp each line as it plays, and the cursor keeps up.

---

### 14. One Playwright test: keyboard stamp

**Decision:** Write one test that stamps a line via keyboard while the audio is playing and asserts the line becomes timed.

**Why:** The brief says "One test that pins down a real interaction... tells us more than a broad suite of shallow assertions." The stamp interaction is the core feature. If it breaks, the tool is broken.

---

_This file is updated as each significant decision is made during implementation._
