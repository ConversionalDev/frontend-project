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

### 8b. Folder structure: feature-based, barrel exports

**Decision:** One feature folder (`features/editor/`) owns everything — load screen, editor screen, and all supporting code. Subfolders: `components/`, `hooks/`, `utils/`, `types/`, `context/`. Each subfolder has an `index.ts` barrel. Shared code lives in `shared/`.

**Why barrel `index.ts` files:**
Consumers import from the folder, not the file: `import { LyricLine } from '../components'`. If a file is renamed or split, only the barrel changes — not every consumer. Standard pattern for feature-based React projects.

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

---

## Phase 0 implementation decisions

### 15. Arrow functions as the standard over regular function declarations

**Decision:** All functions — utilities, hooks, reducers, and React components — are written as `const name = () => {}` arrow functions. No `function` keyword anywhere in the codebase.

**Why:** Consistency. A single style across the codebase means no mental switching. Arrow functions also make the implicit return form available for short pure functions (`const toMs = (s: number) => Math.round(s * 1000)`), which reads cleanly.

**One exception noted:** `switch` inside an arrow function works identically to inside a regular function — no behaviour difference for the reducer.

---

### 16. `LINE_STAMPED` automatically closes the previous line's end time

**Decision:** When line N is stamped at time T, the reducer also sets line N-1's `end_ms` to T (if line N-1 has a segment).

**Why:** Without this, every line's end would be a fixed offset from its start — meaning gaps and overlaps would be the norm. Closing the previous line at the exact moment the next line begins is the correct model for back-to-back lyrics. It makes a first-pass stamp session produce tight, non-overlapping segments automatically.

**Guessed:** The brief does not specify this behaviour. It is inferred from how lyric timing tools conventionally work.

---

### 17. `STAMP_DEFAULT_DURATION_MS = 5_000` as the fallback end time

**Decision:** When stamping a line that has no subsequent timed line to borrow an end boundary from, `end_ms` is set to `min(start_ms + 5000, durationMs)`.

**Why:** A segment must have `end_ms > start_ms` (server requirement). Five seconds is a reasonable default for a lyric line — long enough to not clip, short enough not to overlap the next line badly. The user can always nudge it afterward.

**Guessed:** The brief does not specify a default duration. Five seconds is an editorial guess. If the real track has shorter lines on average, this could be changed to 3000ms.

---

### 18. `TimeContext` uses `useState` not `useReducer`

**Decision:** `TimeContext` holds a single value (`currentTimeMs`) updated via `setCurrentTimeMs`. No action types, no reducer.

**Why:** There is exactly one operation: "set the current time to this ms value." That is `useState`. Using `useReducer` here would add a `TIME_UPDATED` action type and a one-case reducer with no benefit. The split between `EditorContext` (reducer) and `TimeContext` (state) is deliberate — the reducer handles complex transitions, the time context handles a single high-frequency scalar.

---

### 19. Context initialised with `null`, hook throws on missing provider

**Decision:** Both `EditorContext` and `TimeContext` are created with `createContext<T | null>(null)`. Their respective hooks (`useEditor`, `useTime`) throw an error if the context value is `null`.

**Why:** The alternative — providing a default value — silently hides the bug of using a hook outside its provider. A thrown error with a clear message ("useEditor must be used inside EditorProvider") surfaces the mistake immediately at the point of misuse. The `| null` type forces the null check in the hook, which TypeScript verifies.

---

---

## Phase 1 implementation decisions

### 20. Single card with tab switcher for the load screen

**Decision:** One card, two tabs ("Seeded track" / "Your own"). Not two side-by-side cards or a split layout.

**Alternatives considered:**

- Two cards side-by-side — creates unequal heights because the custom form (file picker + textarea) is taller than the seeded panel; looks broken at most viewport widths
- Accordion / expandable sections — extra interaction cost for a two-option choice

**Why this:** A tab switcher is the canonical pattern for mutually exclusive options within a single context. Both paths load a track — they are the same action with a different source. A single card reinforces that. The active tab gets `bg-accent text-accent-contrast` for clear visual state.

---

### 21. Global element styles wrapped in `@layer base`

**Decision:** All element-level rules in `styles.css` (`button`, `input`, `body`, etc.) are placed inside `@layer base`.

**Why:** Tailwind v4 generates its utility classes at the `utilities` layer. CSS cascade order is: `base` < `components` < `utilities`. Without `@layer base`, global rules like `button { background: var(--surface) }` sit outside any layer and cascade _after_ Tailwind utilities — meaning `bg-accent` on a button gets silently overridden by the global rule. Wrapping in `@layer base` puts those rules below utilities, so Tailwind classes always win.

**What this affects:** Any component that uses `bg-accent`, `text-accent-contrast`, or similar on a `button` element. Without this fix, active tab styling and accent-coloured CTA buttons render with the wrong background.

---

### 22. Audio MIME type validated in JavaScript, not HTML alone

**Decision:** `CustomTrackForm` checks `file.type.startsWith('audio/')` in the `onChange` handler and rejects the file immediately with an error message. The `accept="audio/*"` attribute is kept but treated as a UX hint only.

**Why:** The `accept` attribute filters the file picker UI but is not enforced by the browser — a user can switch the filter to "All files" and select any file. The OS also sometimes reports video container formats (e.g. `.mp4` with an audio-only track) with a `video/*` MIME type even when the content is audio. Validating in JS catches both cases and gives an immediate, specific error rather than letting `getAudioDuration` fail with a generic rejection.

---

---

## Phase 2 implementation decisions

### 23. `useAudio` owned by `EditorScreen`, not `AudioPlayer`

**Decision:** `useAudio` is called in `EditorScreen`, which passes `{ audioRef, isPlaying, toggle, seekTo }` down as props to `AudioPlayer`.

**Alternatives considered:**

- Call `useAudio` inside `AudioPlayer` — simpler in isolation, but `seekTo` then lives inside the component and cannot be passed to `LyricsList` (Phase 3) without introducing a context or lifting state anyway
- Put `seekTo` in a new context — adds a third context for what is effectively a one-function callback; prop drilling one level is simpler

**Why this:** `EditorScreen` is the natural owner of audio controls — it coordinates the audio player, the lyrics list, and eventually the inspector. Having `seekTo` at that level means Phase 3's line-click-to-seek is a straightforward prop pass, not a refactor.

---

### 24. Seek bar drag buffering with local `seekValue` state

**Decision:** `AudioPlayer` holds a `seekValue: number | null` state. While the user drags, `seekValue` overrides `currentTimeMs` as the displayed value. On `mouseup`/`touchend`, it resets to `null` and live time resumes.

**Why:** Without this, `currentTimeMs` is updated by `timeupdate` events ~4×/second. During a drag, those updates would fight the user's thumb — the range input would jump back toward the playhead position on every tick, making seeking feel broken. The local buffer absorbs those updates while the user is in control.

---

### 25. `useKeyboard` placed in `shared/hooks` with configurable `ignoreElements`

**Decision:** The keyboard binding hook lives in `shared/hooks/`, not in the editor feature. It accepts an `ignoreElements` string array (defaulting to `['INPUT', 'TEXTAREA', 'SELECT']`) instead of hardcoding the skip logic.

**Why shared:** The hook has no editor-specific imports — it's a generic document-level keydown binder. Any future feature can use it.

**Why `ignoreElements` array:** A boolean flag (`ignoreFormElements: true/false`) only covers two cases. An array lets callers pass exactly the tag names they care about — e.g. passing `[]` to capture keys everywhere, or adding `'BUTTON'` to skip focused buttons. The default covers the common case with no config needed.

---

---

## Phase 3 implementation decisions

### 26. Stamp reads `audioRef.current.currentTime` directly, not from `TimeContext`

**Decision:** The Enter key handler in `EditorScreen` reads `toMs(audioRef.current.currentTime)` at the moment of the keypress rather than using `currentTimeMs` from `TimeContext`.

**Why precision:** `currentTimeMs` is updated by `timeupdate` events which fire ~4×/second (every ~250ms). At the moment a key is pressed, that value could be up to 250ms stale. Reading directly from the audio element gives the exact position at keypress time — materially more accurate for a stamping tool where the goal is to place the lyric at the right beat.

**Why performance:** It also removes `EditorScreen` from `TimeContext`'s subscriber list entirely, so `EditorScreen` no longer re-renders 4×/second. Only `LyricsList` and `AudioPlayer` (which genuinely need live time) subscribe to `TimeContext`.

---

### 27. `React.memo` on `LyricLine` with ref-stabilised callbacks

**Decision:** `LyricLine` is wrapped with `React.memo`. To make memo effective, `LyricsList` uses `useCallback` for `handleSelect` and `handleDoubleClick`, with mutable refs (`focusedLineIdRef`, `segmentsRef`, `seekToRef`) for values that change frequently. This keeps the callback identity stable while always reading the latest value.

**Why the ref pattern:** The naive approach — `useCallback(fn, [state.focusedLineId, state.segments])` — would recreate the callbacks on every state change, invalidating memo on every render anyway. Refs break that cycle: the callback deps are `[dispatch]` (stable) and `[]` respectively, but the functions always read current data.

**What this prevents:** Without memo, all 28+ `LyricLine` rows re-render on every `timeupdate` tick (4×/second). With memo and stable callbacks, only the line whose `isActive`, `isFocused`, or `isSelected` prop actually changed re-renders.

---

### 28. Double-click on a timed line seeks to its start time

**Decision:** Double-clicking a `LyricLine` that has a segment calls `seekTo(segment.start_ms)`, jumping the playhead to that line's start.

**Guessed:** The brief specifies "clicking a timed line in the list seeks to its `start_ms`" — but a plain click is already used for selection. Double-click is the natural disambiguation: single click selects, double click seeks. This avoids conflicting intent on the same gesture.

---

---

## Phase 4 implementation decisions

### 29. Barrel `index.ts` exports only the public API, not internal sub-components

**Decision:** `components/index.ts` exports only what is consumed from outside the folder (`AudioPlayer`, `CustomTrackForm`, `Inspector`, `LyricsList`, `WaveformDecor`). Internal components (`NudgeRow`, `Section`, `SingleLinePanel`, `MultiLinePanel`) import each other directly and are not re-exported.

**Why:** A barrel that exports everything leaks implementation details and makes it harder to know what is safe to change. If a sub-component of `Inspector` needs to be renamed or merged, only `Inspector.tsx` changes — no barrel update needed and no external caller is affected. This treats the barrel as a published surface, not a file-listing tool.

---

### 30. Nudge clamping with a 100ms minimum segment duration

**Decision:** When nudging start, the new value is clamped to `max(0, min(start + delta, end - 100))`. When nudging end, it is clamped to `max(start + 100, min(end + delta, durationMs))`. This enforces a minimum segment duration of 100ms.

**Why:** The server requires `end_ms > start_ms`. A zero-duration or negative-duration segment would be invalid. 100ms is the smallest nudge increment, so clamping at 100ms ensures a nudge that would collapse the segment is silently absorbed rather than producing an invalid state.

---

---

## Phase 5 implementation decisions

### 31. `useSave` hook: custom tracks to localStorage, seeded track to API

**Decision:** `useSave` branches on `state.isCustomTrack`. For custom tracks, segments are serialised to `localStorage` under the key `lyric-align-custom-{trackId}`. For seeded tracks, a `PUT /api/v1/track/alignment` request is made with `{ version, lines, segments }`.

**Alternatives considered:**

- Save everything to `localStorage` only — avoids the API call and 409 handling, but the brief explicitly says handling save rejection is worth showing. localStorage for custom tracks is the right call because the API has no route for creating new tracks.
- Save custom tracks to a different state mechanism — `localStorage` is the natural place for "offline" user-created data with no server representation.

**Why this split:** The two track types have fundamentally different persistence strategies. The seeded track is authoritative on the server; custom tracks have nowhere to go on the server. The `isCustomTrack` flag captures this cleanly.

---

### 32. PUT body includes `lines` array

**Decision:** The PUT request body sends `{ version, lines: state.lines, segments: Object.values(state.segments) }`. The `lines` array is included because the server's `parsePutBody` requires it.

**Why:** The API's `validate.js` rejects requests without a `lines` array and also validates that each segment's `line_id` references a line in the same request. Omitting lines would produce a `400 invalid_lines` error. This is by design — the API supports updating the lyric sheet and timing in a single PUT.

---

### 33. 409 conflict: server state wins, client shows banner

**Decision:** On a 409 response, the reducer's `SAVE_CONFLICTED` action replaces `lines`, `segments`, and `version` with the server's current state and sets `saveStatus: 'conflict'`. The `SaveBar` shows a persistent banner: "Conflict — server version loaded. Review and save again."

**Alternatives considered:**

- Show a modal with a diff view — significantly more complex; for a lyric editor the "diff" is just the list of lines, which the user can already see
- Merge server state into local state — ambiguous resolution strategy when both have changed the same segment; server-wins is explicit

**Why server-wins:** The server's state is the ground truth after a version conflict. The user already has the editor open with the server's current alignment visible; they can re-apply any local changes and save again. This is the simplest recoverable state with no ambiguity.

---

### 34. Cmd+S (and Ctrl+S) wired via `useKeyboard` with modifier check

**Decision:** A `KeyS` handler is added to `useKeyboard` in `EditorScreen`. Inside the handler, `if (!e.metaKey && !e.ctrlKey) return` ensures it only fires on Cmd+S or Ctrl+S, not on bare `s` keystrokes. `e.preventDefault()` suppresses the browser's native save dialog.

**Why `useKeyboard` rather than a separate `addEventListener`:** Keeps all keyboard bindings declared in one place. The modifier check inside the handler is simpler than extending `useKeyboard`'s API to handle composite keys.

---

---

## Post-phase-5 structural decisions

### 35. Screens moved into `features/editor/screens/` subfolder

**Decision:** `EditorScreen` and `LoadScreen` were moved from the root of `features/editor/` into `features/editor/screens/`. A `screens/index.ts` barrel was added so `App.tsx` imports from `'./features/editor/screens'`.

**Why:** Every other concern in the feature already had its own subfolder (`components/`, `hooks/`, `utils/`, `types/`, `context/`). Keeping two screen files at the root was inconsistent and made the folder harder to read. Moving them into `screens/` makes the boundary explicit and gives the subfolder a clear single responsibility.

---

### 36. Barrel `index.ts` = public API for external consumers only

**Decision:** A firm rule across the feature: a subfolder's `index.ts` exports only what files *outside that subfolder* consume. Files inside the subfolder import each other directly.

**Examples:**
- `components/index.ts` exports `AudioPlayer`, `Inspector`, `LyricsList`, `SaveBar`, `CustomTrackForm`, `WaveformDecor` — what `screens/` needs. Internal sub-components (`NudgeRow`, `Section`, `SingleLinePanel`, `MultiLinePanel`) are not exported.
- `screens/index.ts` exports `EditorScreen`, `LoadScreen` — what `App.tsx` needs.
- `context/index.ts` and `types/index.ts` export what `App.tsx` needs (`EditorProvider`, `TimeProvider`, `EditorState`).

**Why:** Treating the barrel as a published surface makes it easy to see what is safe to change without breaking callers. If an internal component is renamed or merged, only the files that directly import it change — no barrel update, no external impact.

---

---

## Phase 6 implementation decisions

### 37. KaraokeBar never goes blank — last played line stays visible in gaps

**Decision:** When no segment contains the current playhead position, `KaraokeBar` shows the most recently finished line (dimmed, as "current") and the next upcoming timed line (dimmed, as "next cue"). It only goes blank before any line has played and after all lines have ended.

**Alternatives considered:**

- Show nothing during gaps — honest but jarring; the bar collapses visually every time there is a pause between lines
- Show the next line by index regardless of timing — misleading when lines are skipped (untimed lines between two timed ones would appear as cues they never become active)

**Why this:** Spotify and Gaana both keep the last played line visible during gaps and instrumentals rather than blanking out. It gives the user a continuous sense of position in the song. For skipped/untimed lines, the lookup is on segments (not line order), so untimed lines in the middle are naturally ignored — the next *timed* line appears as the cue.

**`isActive` flag:** The center line renders in `text-accent` when a segment is actively playing, and `text-muted` when in a gap. This distinguishes "this line is playing now" from "this is the last thing that played."

---

_This file is updated as each significant decision is made during implementation._
