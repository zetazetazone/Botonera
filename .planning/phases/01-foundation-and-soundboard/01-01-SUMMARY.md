---
phase: 01-foundation-and-soundboard
plan: 01
subsystem: foundation
tags: [typescript, zustand, expo-audio, jest, testing, state-management, file-cache]
dependency_graph:
  requires: []
  provides:
    - src/store/types.ts (AudioItem, SoundList TypeScript interfaces)
    - src/store/soundboardStore.ts (Zustand store with persist middleware)
    - src/services/AudioPlayerService.ts (expo-audio singleton scaffold)
    - src/services/FileCacheService.ts (expo-file-system File/Directory cache)
    - src/utils/fileUtils.ts (extension validation, generateId)
    - jest.config.js (jest-expo test infrastructure)
  affects:
    - app/_layout.tsx (QueryClientProvider wrapping, initAudioSession on mount)
tech_stack:
  added:
    - expo-audio ~1.1.1 (replaces deprecated expo-av)
    - zustand ^5.0.11 (state management with persist middleware)
    - "@tanstack/react-query ^5.90.21 (async data layer scaffold)"
    - expo-image-picker ~17.0.10
    - expo-linear-gradient ~15.0.8
    - react-native-draggable-flatlist ^4.0.3
    - jest-expo ~54.0.17 (test framework)
    - jest ~29.7.0
    - "@types/jest 29.5.14"
  removed:
    - expo-av ~16.0.8 (deprecated SDK 53, removed SDK 55)
  patterns:
    - Module-level AudioPlayer singleton (createAudioPlayer at module scope)
    - Zustand persist middleware with AsyncStorage backend
    - expo-file-system File/Directory API (SDK 54 stable class-based API)
    - jest.mock() internal factory pattern (avoids hoisting closure issues)
key_files:
  created:
    - jest.config.js
    - src/store/types.ts
    - src/store/soundboardStore.ts
    - src/services/AudioPlayerService.ts
    - src/services/FileCacheService.ts
    - src/utils/fileUtils.ts
    - src/store/soundboardStore.test.ts
    - src/services/AudioPlayerService.test.ts
    - src/services/FileCacheService.test.ts
    - src/utils/fileUtils.test.ts
  modified:
    - package.json (add test script, new deps, remove expo-av)
    - app/_layout.tsx (QueryClientProvider + initAudioSession)
decisions:
  - "Used jest.fn() inside jest.mock() factory (not outer scope) to avoid temporal dead zone issues with hoisted jest.mock and const declarations"
  - "Mocked @react-native-async-storage/async-storage via its official jest mock package for store tests"
  - "Confirmed expo-audio AudioPlayer has no stop() method — stopSound() uses pause() + seekTo(0) per RESEARCH.md"
  - "AsyncStorage mock required in soundboardStore.test.ts because native module unavailable in Jest/Node environment"
metrics:
  duration_minutes: 6
  completed_date: "2026-03-04"
  tasks_completed: 2
  tasks_total: 2
  files_created: 10
  files_modified: 2
  tests_written: 52
  tests_passing: 52
requirements_satisfied:
  - SND-04
  - SND-05
---

# Phase 1 Plan 01: Foundation — TypeScript Types, Zustand Store, Service Scaffolds, Jest Infrastructure Summary

**One-liner:** Zustand persist store + expo-audio singleton scaffold with 52 passing Jest tests, replacing deprecated expo-av

## What Was Built

Complete TypeScript/testing foundation for Phase 1:

1. **TypeScript types** (`src/store/types.ts`) — `AudioItem` (with soft-delete fields `is_deleted` + `deleted_at`), `SoundList`, `SoundboardState` interfaces
2. **Zustand store** (`src/store/soundboardStore.ts`) — Full CRUD: `addSound`, `updateSound`, `deleteSound` (soft), `addList`, `updateList`, `deleteList`, `reorderSounds`, `setActiveSoundId`, `setActiveListId`, `setEditMode`; persisted to AsyncStorage via `zustand/middleware`
3. **AudioPlayerService** (`src/services/AudioPlayerService.ts`) — Module-level `createAudioPlayer` singleton; `initAudioSession`, `getPlayer`, `playSound`, `stopSound`, `releasePlayer`
4. **FileCacheService** (`src/services/FileCacheService.ts`) — `ensureDirectories`, `cacheAudioFile`, `cacheThumbnail`, `cacheSticker`, `deleteFile` using `expo-file-system` File/Directory stable API
5. **fileUtils** (`src/utils/fileUtils.ts`) — `isAllowedAudioFile` with `.opus/.m4a/.mp3/.aac/.ogg` allowlist, `generateId`
6. **Jest infrastructure** (`jest.config.js`) — `jest-expo` preset with `transformIgnorePatterns` for React Native ecosystem
7. **Updated `app/_layout.tsx`** — `QueryClientProvider` (TanStack Query scaffold) as outermost wrapper; `useEffect` calling `initAudioSession()` on mount

## Dependency Installations

| Package | Action | Version |
|---------|--------|---------|
| expo-av | Removed | ~16.0.8 |
| expo-audio | Added | ~1.1.1 |
| zustand | Added | ^5.0.11 |
| @tanstack/react-query | Added | ^5.90.21 |
| expo-image-picker | Added | ~17.0.10 |
| expo-linear-gradient | Added | ~15.0.8 |
| react-native-draggable-flatlist | Added | ^4.0.3 |
| jest-expo | Added (dev) | ~54.0.17 |
| jest | Added (dev) | ~29.7.0 |
| @types/jest | Added (dev) | 29.5.14 |

## Test Results

```
Test Suites: 4 passed, 4 total
Tests:       52 passed, 52 total
Time:        0.762 s
```

| Test File | Tests | Coverage |
|-----------|-------|----------|
| src/utils/fileUtils.test.ts | 15 | isAllowedAudioFile (all cases incl. uppercase), generateId |
| src/store/soundboardStore.test.ts | 17 | addSound, updateSound, deleteSound, addList, deleteList, reorderSounds, setActiveSoundId, setEditMode |
| src/services/AudioPlayerService.test.ts | 7 | initAudioSession, playSound (replace+play order), stopSound (pause+seekTo order) |
| src/services/FileCacheService.test.ts | 13 | ensureDirectories, cacheAudioFile, cacheThumbnail, cacheSticker, deleteFile |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed jest.mock() hoisting temporal dead zone in FileCacheService.test.ts**
- **Found during:** Task 2
- **Issue:** `jest.mock()` is hoisted above all `const` declarations; `mockDirectoryCreate`, `mockFileCopy`, etc. were `undefined` when the factory ran, causing "create is not a function"
- **Fix:** Moved all `jest.fn()` declarations INSIDE the `jest.mock()` factory and exposed them via `__mocks` property on the returned module object. Tests retrieve mock references via `require('expo-file-system').__mocks`
- **Files modified:** `src/services/FileCacheService.test.ts`
- **Commit:** a2eea35

**2. [Rule 2 - Missing critical functionality] Added AsyncStorage mock for soundboardStore tests**
- **Found during:** Task 2
- **Issue:** `@react-native-async-storage/async-storage` imports the native module which throws `NativeModule: AsyncStorage is null` in Jest (Node.js environment)
- **Fix:** Added `jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'))` at top of soundboardStore.test.ts
- **Files modified:** `src/store/soundboardStore.test.ts`
- **Commit:** a2eea35

**3. [Rule 1 - Bug] Fixed TypeScript spread argument type errors in AudioPlayerService.test.ts**
- **Found during:** Task 2 (TypeScript verification pass)
- **Issue:** `(...args: unknown[])` spread into typed mock functions caused TS2556 errors
- **Fix:** Restructured AudioPlayerService.test.ts to define all mocks inside `jest.mock()` factory and expose via `__mockPlayer` property; uses `ExpoAudio.setAudioModeAsync` directly as a jest.Mock
- **Files modified:** `src/services/AudioPlayerService.test.ts`
- **Commit:** a2eea35

**4. [Rule 1 - Bug] Fixed TypeScript cast error for expo-file-system File import**
- **Found during:** Task 2 (TypeScript verification pass)
- **Issue:** `(MockedFile as jest.Mock)` failed because TypeScript sees `File` from `expo-file-system` as conflicting with the global `File` web API type
- **Fix:** Changed to double cast `(MockedFile as unknown as jest.Mock)` to bypass the type overlap check
- **Files modified:** `src/services/FileCacheService.test.ts`
- **Commit:** a2eea35

## Commits

| Hash | Message |
|------|---------|
| f0b3a90 | feat(01-01): install dependencies, configure Jest, create TypeScript types and Zustand store |
| a2eea35 | feat(01-01): create service scaffolds and Wave 0 test suites (TDD green) |

## Self-Check: PASSED

All files present: jest.config.js, src/store/types.ts, src/store/soundboardStore.ts, src/services/AudioPlayerService.ts, src/services/FileCacheService.ts, src/utils/fileUtils.ts, src/store/soundboardStore.test.ts, src/services/AudioPlayerService.test.ts, src/services/FileCacheService.test.ts, src/utils/fileUtils.test.ts

Commits verified: f0b3a90, a2eea35

SUMMARY.md exists at .planning/phases/01-foundation-and-soundboard/01-01-SUMMARY.md
