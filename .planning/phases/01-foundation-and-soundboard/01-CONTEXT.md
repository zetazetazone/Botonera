# Phase 1: Foundation and Soundboard - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Local-first soundboard with audio management, playback, and file caching. Users can import audio files, organize them into named lists, tap to play with haptic feedback, and have everything persist offline. No network, no auth, no WhatsApp sharing — those are later phases.

Requirements covered: SND-01, SND-02, SND-03, SND-04, SND-05, SND-07, AUD-01, AUD-02, AUD-03, AUD-04, AUD-05, AUD-06

</domain>

<decisions>
## Implementation Decisions

### Button interactions
- Tap = play audio with haptic feedback (not share — WhatsApp sharing is Phase 3)
- Long-press = open edit modal (title, thumbnail, color, sticker, delete)
- Tap the currently-playing button again to stop playback (toggle behavior)
- Tapping a different button stops the current sound and plays the new one (stop-and-restart)
- Visually highlight the active (currently playing) button with a glow, border, or pulse animation

### Sound button appearance
- When a sound HAS a thumbnail: image fills the entire square button, title overlaid at the bottom with a dark gradient overlay
- When a sound has NO thumbnail: solid theme color with centered title text (current behavior preserved)
- 3-column grid layout (current)
- All buttons are consistent square shape (current)

### Lists/boards navigation
- Horizontal scrollable tab bar below the header for switching between lists
- Each tab shows the list name, colored by its theme color
- A '+' icon as the last tab to create a new list
- Default "All Sounds" tab as the first tab — always present, shows all sounds regardless of list
- User-created lists appear after "All Sounds"

### Reordering
- "Edit" button in the header toggles an edit mode
- In edit mode, buttons get drag handles and can be rearranged via drag-and-drop
- Normal tap/long-press behavior is disabled during edit mode

### Audio creation flow
- Two-step flow: Step 1 = file picker (pick .opus/.m4a from device). Step 2 = creation form modal (name, thumbnail, color, optional sticker)
- Thumbnail: pick from device gallery OR take a new photo with camera
- Sticker is optional and SEPARATE from thumbnail — thumbnail is the button image, sticker is an extra image stored for WhatsApp sharing in Phase 3
- New sounds auto-assign to the currently active list tab
- Sounds can be moved between lists later via the edit modal

### Claude's Discretion
- Exact highlight animation for active button (glow vs border vs pulse)
- Dark gradient overlay implementation for thumbnail buttons
- Edit mode visual treatment (how buttons look in edit/reorder mode)
- Creation form layout and field ordering
- Color picker design in creation/edit forms
- Loading states and transitions between lists

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- SoundButton.js: 3-column grid button with color + title — extend for thumbnail support
- EditSoundModal.js: Modal with title input + color picker — extend for thumbnail/sticker fields
- AddSoundFab.js: FAB component — keep for triggering import flow
- useSoundboard.js: Context provider with AsyncStorage persistence — refactor for lists data model
- audioBridge.js: File caching (documentDirectory), playback (expo-av), haptics — migrate from expo-av to expo-audio

### Established Patterns
- Dark theme (#121212 background, #1F1F1F header, #1E1E1E modals) — maintain
- FlatList with numColumns=3 for grid layout — keep
- AsyncStorage for local persistence — will be replaced/extended with Zustand per roadmap plan
- expo-haptics for button feedback — keep

### Integration Points
- app/_layout.tsx: SoundboardProvider wraps app — will need to accommodate new state management (Zustand)
- app/index.tsx: Routes to HomeScreen — may need tab navigation for lists
- expo-share-intent already configured in app.json — used in Phase 3, but provider already in layout
- All source files are plain JS — roadmap Plan 01 includes TypeScript migration via Zustand + TanStack Query scaffolding

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-and-soundboard*
*Context gathered: 2026-03-04*
