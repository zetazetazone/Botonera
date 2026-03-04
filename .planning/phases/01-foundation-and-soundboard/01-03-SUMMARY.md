---
phase: 01-foundation-and-soundboard
plan: 03
subsystem: soundboard-crud
tags: [expo-document-picker, expo-image-picker, react-native-draggable-flatlist, zustand, typescript, import-flow, edit-modal, drag-and-drop]
dependency_graph:
  requires:
    - phase: 01-foundation-and-soundboard
      plan: 01
      provides: "Zustand store (useSoundboardStore), FileCacheService, TypeScript types (AudioItem, SoundList), fileUtils"
    - phase: 01-foundation-and-soundboard
      plan: 02
      provides: "SoundButton, SoundGrid, ListTabBar, HomeScreen, AddSoundFab"
  provides:
    - src/components/AddSoundModal.tsx (two-step audio import flow)
    - src/components/EditSoundModal.tsx (edit/delete modal for sounds)
    - src/components/CreateListModal.tsx (new list creation modal)
    - src/components/SoundGrid.tsx (updated with DraggableFlatList row-grouping in edit mode)
    - src/components/ListTabBar.tsx (updated with onCreateList prop)
    - src/components/AddSoundFab.tsx (TypeScript conversion)
    - src/screens/HomeScreen.tsx (fully wired with all modals)
  affects:
    - Phase 3 (sticker field in AudioItem now populated; WhatsApp sharing can use stickerUri)
tech_stack:
  added: []
  removed:
    - src/components/AddSoundFab.js (replaced by .tsx)
    - src/components/EditSoundModal.js (replaced by .tsx)
    - src/hooks/useSoundboard.js (orphaned legacy hook)
    - src/utils/audioBridge.js (orphaned legacy bridge)
  patterns:
    - "Two-step modal flow: DocumentPicker runs on modal open, creation form shown after successful pick"
    - "Inner component pattern for EditSoundModal: outer component guards null, inner receives non-null AudioItem"
    - "DraggableFlatList with row-grouping fallback: items grouped into rows of 3; drag operates on rows"
    - "Reorder disabled on All Sounds tab with user hint message"
key_files:
  created:
    - src/components/AddSoundModal.tsx
    - src/components/CreateListModal.tsx
    - src/components/EditSoundModal.tsx
    - src/components/AddSoundFab.tsx
  modified:
    - src/components/SoundGrid.tsx (added DraggableFlatList edit mode)
    - src/components/ListTabBar.tsx (added onCreateList prop)
    - src/screens/HomeScreen.tsx (wired all modals and callbacks)
  deleted:
    - src/components/AddSoundFab.js
    - src/components/EditSoundModal.js
    - src/hooks/useSoundboard.js
    - src/utils/audioBridge.js
decisions:
  - "DraggableFlatList numColumns not supported — used row-grouping approach (items grouped into rows of 3 before passing to DraggableFlatList); drag operates on entire rows of 3, which is sufficient for row-level reordering"
  - "Reordering disabled when activeListId is null (All Sounds tab) with tooltip — reordering across all lists simultaneously has no clean semantic"
  - "EditSoundModal uses inner component pattern (outer guards null, inner receives non-null sound) to avoid TypeScript null narrowing issues in closures and async handlers"
  - "AddSoundModal triggers DocumentPicker immediately on modal open (useEffect on visible+step=idle) so UX is: tap FAB -> picker opens -> form appears"
metrics:
  duration_minutes: 6
  completed_date: "2026-03-04"
  tasks_completed: 2
  tasks_total: 3
  tasks_pending_checkpoint: 1
  files_created: 4
  files_modified: 3
  files_deleted: 4
  tests_written: 0
  tests_passing: 52
requirements_satisfied:
  - SND-07
  - AUD-01
  - AUD-02
  - AUD-03
  - AUD-05
  - AUD-06
---

# Phase 1 Plan 03: Import Flow, CRUD, and Drag-and-Drop Summary

**One-liner:** Complete audio import flow with DocumentPicker + creation form, EditSoundModal with thumbnail/sticker/list-move, CreateListModal, and row-grouped DraggableFlatList reordering — codebase now fully TypeScript

**Status: PARTIAL — Tasks 1-2 complete, Task 3 awaiting human verification checkpoint**

## What Was Built

### Task 1: AddSoundModal and CreateListModal

1. **AddSoundModal.tsx** — Two-step flow:
   - Step 1: `DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true })` triggers on modal open
   - Extension validated via `isAllowedAudioFile`; invalid files show Alert and close modal
   - Audio file immediately cached to `documentDirectory/sounds/` via `cacheAudioFile`
   - Step 2: Scroll-form with Name (pre-filled), Thumbnail (gallery/camera), Color picker (18 colors), Sticker (optional)
   - Save creates `AudioItem` assigned to active list (or first list if on All Sounds), calls `addSound`
   - Cancel deletes cached audio file (cleanup)

2. **CreateListModal.tsx** — Name + color picker, creates `SoundList` in store, switches active tab to new list

3. **HomeScreen.tsx** — `showAddModal`, `showCreateListModal`, `editingSound` states; FAB opens AddSoundModal; renders all three modals

4. **ListTabBar.tsx** — `onCreateList` prop; "+" button calls `onCreateList()` instead of console.log placeholder

### Task 2: EditSoundModal, Drag-and-Drop, Legacy Cleanup

1. **EditSoundModal.tsx** — Inner component pattern:
   - Outer component: `if (!sound || !visible) return null; return <EditSoundModalInner sound={sound} />`
   - Inner component receives `sound: AudioItem` (non-null) — all async handlers work without null checks
   - Fields: Name, Thumbnail (Change/Remove), Color, Sticker (Change/Remove), List assignment picker
   - Save: caches new images, deletes old files, handles list change (updates order to end of new list)
   - Delete: Alert confirm, soft-delete via store, file cleanup (fire-and-forget)

2. **SoundGrid.tsx** — Drag-and-drop in edit mode:
   - Normal mode: `FlatList` with `numColumns={3}` (unchanged)
   - Edit mode, All Sounds tab: `FlatList` + informational banner ("Switch to a specific list to reorder")
   - Edit mode, specific list: `DraggableFlatList` with row-grouping (items grouped into rows of 3; each row is a draggable item; `onDragEnd` flattens row order back to sound IDs)
   - `onLongPressSound` prop callback passed from HomeScreen for edit modal trigger

3. **AddSoundFab.tsx** — TypeScript conversion with typed `onPress: () => void` and optional `visible: boolean` prop

4. **Deleted legacy files:** `AddSoundFab.js`, `EditSoundModal.js`, `useSoundboard.js`, `audioBridge.js`

## Drag-and-Drop Implementation Note

`react-native-draggable-flatlist` does not support `numColumns` prop for multi-column grid drag. Used Fallback Option A from the plan: items are grouped into rows of 3 before being passed to `DraggableFlatList`. Each "item" in the list is a row of up to 3 sounds. Dragging reorders entire rows. After drag completes, `onDragEnd` flattens the row order back to a flat sound ID list and calls `reorderSounds`.

This approach means sounds within the same row cannot be swapped via drag (only row-level reordering). This is acceptable for Phase 1 — within-row swapping can be added in a later iteration if needed.

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 5f402e6 | feat(01-03): build AddSoundModal, CreateListModal, wire ListTabBar and HomeScreen |
| Task 2 | b715c9c | feat(01-03): build EditSoundModal, drag-and-drop reordering, convert AddSoundFab to TypeScript, delete legacy JS files |
| Task 3 | — | Pending human verification |

## Test Results

52 tests pass (all from Plans 01/02). No new unit tests added in this plan — the new components are UI flows that require device/emulator verification (modal open/close, file picker integration, image caching).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript null narrowing in EditSoundModal**
- **Found during:** Task 2 verification (tsc --noEmit)
- **Issue:** `if (!sound || !visible) return null` guard does not narrow the `sound` prop type for async handlers and closures within the function body. TypeScript still sees `sound` as `AudioItem | null` in all handlers.
- **Fix:** Refactored to inner component pattern. Outer `EditSoundModal` guards null and renders `<EditSoundModalInner sound={sound} />` where `sound: AudioItem` is non-null by type.
- **Files modified:** `src/components/EditSoundModal.tsx`
- **Commit:** b715c9c

### Architecture Notes

- **DraggableFlatList numColumns limitation confirmed:** As predicted in RESEARCH.md Pitfall 4, DraggableFlatList does not support `numColumns`. Used row-grouping fallback (Fallback Option A from plan).

## Self-Check: PARTIAL (awaiting checkpoint)

Files created/modified:
- FOUND: src/components/AddSoundModal.tsx
- FOUND: src/components/CreateListModal.tsx
- FOUND: src/components/EditSoundModal.tsx
- FOUND: src/components/AddSoundFab.tsx
- FOUND: src/components/SoundGrid.tsx (updated)
- FOUND: src/components/ListTabBar.tsx (updated)
- FOUND: src/screens/HomeScreen.tsx (updated)
- DELETED: src/components/AddSoundFab.js, EditSoundModal.js, src/hooks/useSoundboard.js, src/utils/audioBridge.js

Commits verified: 5f402e6, b715c9c

Task 3 human verification checkpoint pending.
