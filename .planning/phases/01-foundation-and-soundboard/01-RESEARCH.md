# Phase 1: Foundation and Soundboard - Research

**Researched:** 2026-03-04
**Domain:** React Native / Expo — audio playback, file caching, drag-and-drop reordering, state management
**Confidence:** HIGH (core APIs verified against official docs; drag-and-drop compatibility MEDIUM due to Reanimated v4 uncertainty)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Button interactions:**
- Tap = play audio with haptic feedback (not share — WhatsApp sharing is Phase 3)
- Long-press = open edit modal (title, thumbnail, color, sticker, delete)
- Tap the currently-playing button again to stop playback (toggle behavior)
- Tapping a different button stops the current sound and plays the new one (stop-and-restart)
- Visually highlight the active (currently playing) button with a glow, border, or pulse animation

**Sound button appearance:**
- When a sound HAS a thumbnail: image fills the entire square button, title overlaid at the bottom with a dark gradient overlay
- When a sound has NO thumbnail: solid theme color with centered title text (current behavior preserved)
- 3-column grid layout (current)
- All buttons are consistent square shape (current)

**Lists/boards navigation:**
- Horizontal scrollable tab bar below the header for switching between lists
- Each tab shows the list name, colored by its theme color
- A '+' icon as the last tab to create a new list
- Default "All Sounds" tab as the first tab — always present, shows all sounds regardless of list
- User-created lists appear after "All Sounds"

**Reordering:**
- "Edit" button in the header toggles an edit mode
- In edit mode, buttons get drag handles and can be rearranged via drag-and-drop
- Normal tap/long-press behavior is disabled during edit mode

**Audio creation flow:**
- Two-step flow: Step 1 = file picker (pick .opus/.m4a from device). Step 2 = creation form modal (name, thumbnail, color, optional sticker)
- Thumbnail: pick from device gallery OR take a new photo with camera
- Sticker is optional and SEPARATE from thumbnail — thumbnail is the button image, sticker is an extra image stored for WhatsApp sharing in Phase 3
- New sounds auto-assign to the currently active list tab
- Sounds can be moved between lists later via the edit modal

**Pre-phase architecture decisions (from STATE.md):**
- Use expo-audio (not expo-av — deprecated SDK 53, removed SDK 55)
- Audio stored in public Supabase Storage bucket (permanent CDN URLs, no signed URL expiry) — but Phase 1 is offline/local only; local file caching via documentDirectory is the Phase 1 implementation
- Soft-delete AudioItem rows (is_deleted + deleted_at) required from schema day one
- iOS Share Intent Receiver requires custom dev client (EAS Build) — must be set up in Phase 1 before Phase 3 work begins
- TypeScript migration via Zustand + TanStack Query scaffolding is part of Plan 01-01

### Claude's Discretion

- Exact highlight animation for active button (glow vs border vs pulse)
- Dark gradient overlay implementation for thumbnail buttons
- Edit mode visual treatment (how buttons look in edit/reorder mode)
- Creation form layout and field ordering
- Color picker design in creation/edit forms
- Loading states and transitions between lists

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SND-01 | User can view audio items in a grid layout with thumbnail or stylized title | SoundButton extension patterns, expo-image for thumbnails, LinearGradient for overlay |
| SND-02 | User can tap a button to play audio with haptic feedback | expo-audio AudioPlayer singleton, expo-haptics |
| SND-03 | Tapping a new button stops the currently playing sound and plays the new one | AudioPlayer.replace() + AudioPlayer.play() pattern; module-level ref for tracking active player |
| SND-04 | User can create multiple soundboard lists/boards | Zustand store with lists array, AsyncStorage persist middleware |
| SND-05 | User can set a theme color per list | Color stored in list entity; tab bar renders with list.color |
| SND-07 | User can reorder audio items within a list | react-native-draggable-flatlist v4.0.3 or react-native-reorderable-list (Reanimated 4 fallback) |
| AUD-01 | User can import audio files from device storage (.opus, .m4a) | expo-document-picker with type: 'audio/*' + client-side extension validation |
| AUD-02 | User can set a name and upload a thumbnail for each audio | Creation form modal; expo-image-picker for gallery/camera; expo-file-system File copy to documentDirectory |
| AUD-03 | User can attach an optional sticker/image to an audio item | Same pattern as thumbnail; stored separately in data model for Phase 3 use |
| AUD-04 | Imported audio is cached locally for offline playback | expo-file-system File copy to documentDirectory/sounds/; AudioPlayer plays from local URI |
| AUD-05 | User can edit audio item details (name, thumbnail, sticker) | Extended EditSoundModal with image fields; replace local file on thumbnail update |
| AUD-06 | User can delete audio items from their library | Zustand deleteSound action; delete local audio + thumbnail + sticker files |
</phase_requirements>

---

## Summary

Phase 1 is a pure local-first implementation: no network calls, no auth, no Supabase reads/writes. Every piece of data lives in Zustand (persisted to AsyncStorage) and every file lives in `documentDirectory`. The phase has three concrete plans: (01-01) scaffolding and data model, (01-02) audio playback engine and grid UI, (01-03) import flow and CRUD.

The most significant architectural work is the expo-av → expo-audio migration. The project currently uses `expo-av` (deprecated, still present in `package.json`), which must be replaced with `expo-audio`. The replacement API is well-understood: a module-level `createAudioPlayer` singleton is the correct pattern for a soundboard where a single player must be controlled globally, not tied to any component's lifecycle. The `replace()` method switches tracks without creating a new player, and the active sound is tracked in Zustand state for UI highlighting.

The second significant work is adding `react-native-draggable-flatlist` for edit-mode drag-and-drop reordering. The project already has `react-native-reanimated ~4.1.1` and `react-native-gesture-handler ~2.28.0` in its dependencies, which are the required peers. There is a confirmed compatibility concern: `react-native-draggable-flatlist` v4 was ported to Reanimated v2+ in Nov 2023, and there are open GitHub issues referencing usage with Reanimated 4.x in 2025, suggesting functional usage but possible edge-case friction. If blockers arise, `react-native-reorderable-list` (Reanimated ≥3.12, RNGH ≥2.12) is the documented fallback.

**Primary recommendation:** Use `createAudioPlayer` at module level for the audio singleton, `zustand` + `persist` middleware for state, `expo-document-picker` for file picking with post-pick extension validation, `expo-image-picker` for thumbnails, `expo-file-system` new stable API (File/Directory classes) for caching, and `react-native-draggable-flatlist` for reordering (with `react-native-reorderable-list` as fallback).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-audio | ~2.0 (SDK 54 ships 1.1.1) | Audio playback replacing expo-av | Official replacement; expo-av removed in SDK 55 |
| zustand | ^5.0.11 | Local state management | Lightweight, TypeScript-first, persist middleware built-in |
| @tanstack/react-query | ^5.x | Async data layer scaffolding | Required by roadmap for Phase 2+ server data; scaffold now |
| expo-file-system | ~19.0.21 (already installed) | Local file caching (sounds, images) | Stable new API in SDK 54; File/Directory class-based |
| expo-document-picker | ~14.0.8 (already installed) | Pick .opus/.m4a from device | Platform-native picker |
| expo-image-picker | to install | Pick thumbnail/sticker from gallery or camera | Platform-native image picker |
| react-native-draggable-flatlist | ^4.0.3 | Drag-and-drop reordering in edit mode | Most-used solution; uses existing Reanimated + RNGH deps |
| expo-haptics | ~15.0.8 (already installed) | Haptic feedback on tap | Already used in project |
| @react-native-async-storage/async-storage | 2.2.0 (already installed) | Zustand persist storage backend | Already installed |
| expo-image | ~3.0.11 (already installed) | Performant image rendering in buttons | Already installed; better than Image for thumbnails |
| expo-linear-gradient | to install | Dark gradient overlay on thumbnail buttons | Expo-native, no extra native setup needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-reorderable-list | latest | Fallback drag-and-drop if DraggableFlatList + Reanimated 4 conflicts | Only if react-native-draggable-flatlist produces runtime errors |
| expo-dev-client | ~6.0.20 (already installed) | Custom dev client for non-Expo-Go features | Required for future Phase 3 Share Extension; build once in Plan 01-01 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-draggable-flatlist | react-native-reorderable-list | reorderable-list has explicit Reanimated ≥3.12 requirement and is simpler but less battle-tested |
| AsyncStorage persist | MMKV persist | MMKV is faster but requires native build; AsyncStorage is already installed and sufficient for Phase 1 data volume |
| expo-linear-gradient | react-native-linear-gradient | expo-linear-gradient is Expo-managed, no separate native install needed |
| Zustand | Context + useReducer (existing) | Zustand persist middleware replaces manual AsyncStorage wiring; TypeScript types are ergonomic |

**Installation (new packages only):**
```bash
npx expo install expo-audio expo-image-picker expo-linear-gradient
npm install zustand @tanstack/react-query
npx expo install react-native-draggable-flatlist
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── store/
│   ├── soundboardStore.ts     # Zustand store: sounds, lists, activeSound
│   └── types.ts               # AudioItem, SoundList TypeScript types
├── services/
│   ├── AudioPlayerService.ts  # Module-level singleton; createAudioPlayer
│   └── FileCacheService.ts    # Copy audio/image to documentDirectory
├── components/
│   ├── SoundButton.tsx        # Extended: thumbnail + gradient + active highlight
│   ├── SoundGrid.tsx          # FlatList or DraggableFlatList wrapper
│   ├── ListTabBar.tsx         # Horizontal scrollable tab bar for lists
│   ├── EditSoundModal.tsx     # Extended: thumbnail/sticker fields
│   └── AddSoundModal.tsx      # New: two-step import flow
├── screens/
│   └── HomeScreen.tsx         # Composes grid + tabbar + header edit mode
└── utils/
    └── fileUtils.ts           # Extension validation, filename helpers
```

### Pattern 1: Module-Level AudioPlayer Singleton

**What:** A single `AudioPlayer` instance created with `createAudioPlayer` at module scope. Zustand stores the currently-playing sound ID for UI state; the player is NOT stored in React state.

**When to use:** Any app where a single audio stream plays at a time and playback must survive component unmounts (e.g., user opens edit modal while sound plays).

**Why not `useAudioPlayer` hook:** Hooks cannot be called from outside React components or event handlers, making a hook-based player impossible to control from a Zustand action or service module.

**Example:**
```typescript
// src/services/AudioPlayerService.ts
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

// Source: https://docs.expo.dev/versions/latest/sdk/audio/
let _player: AudioPlayer | null = null;

export async function initAudioSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,      // Critical for soundboard: play even in silent mode
    interruptionMode: 'doNotMix', // Stop music apps when we play
  });
}

export function getPlayer(): AudioPlayer {
  if (!_player) {
    // Initialize with no source; replace() will set it before play()
    _player = createAudioPlayer(null);
  }
  return _player;
}

export async function playSound(uri: string): Promise<void> {
  const player = getPlayer();
  player.replace({ uri });
  player.play();
}

export async function stopSound(): Promise<void> {
  const player = getPlayer();
  player.pause();
  player.seekTo(0); // Reset to start so next play starts fresh
}

export function releasePlayer(): void {
  if (_player) {
    _player.release();
    _player = null;
  }
}
```

**NOTE on `replace()` on Android:** There was a confirmed bug where `replace()` failed when the player was initialized with `null` source. This was fixed in expo-audio via PR #35749 (merged before SDK 54). Monitor for regression. If `replace(null)` init still fails on Android, initialize with a silent/dummy source or use the `{ uri }` directly on first call.

### Pattern 2: Zustand Store with Persist

**What:** A single Zustand store holding all soundboard state, persisted to AsyncStorage automatically.

**When to use:** All local state — sounds array, lists array, active sound ID, edit mode flag.

```typescript
// src/store/soundboardStore.ts
// Source: https://zustand.docs.pmnd.rs/ + official persist docs
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AudioItem {
  id: string;
  title: string;
  uri: string;             // local documentDirectory URI
  color: string;
  thumbnailUri?: string;   // local documentDirectory URI
  stickerUri?: string;     // local documentDirectory URI (Phase 3 use)
  listId: string;          // references SoundList.id
  order: number;           // sort order within list
  createdAt: number;
  is_deleted: boolean;     // soft-delete; required from day 1 per STATE.md
  deleted_at?: number;
}

export interface SoundList {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: number;
}

interface SoundboardState {
  sounds: AudioItem[];
  lists: SoundList[];
  activeSoundId: string | null;
  activeListId: string | null; // null = "All Sounds"
  isEditMode: boolean;
  // Actions
  addSound: (sound: AudioItem) => void;
  updateSound: (id: string, updates: Partial<AudioItem>) => void;
  deleteSound: (id: string) => void;
  addList: (list: SoundList) => void;
  updateList: (id: string, updates: Partial<SoundList>) => void;
  deleteList: (id: string) => void;
  reorderSounds: (listId: string, orderedIds: string[]) => void;
  setActiveSoundId: (id: string | null) => void;
  setActiveListId: (id: string | null) => void;
  setEditMode: (on: boolean) => void;
}

export const useSoundboardStore = create<SoundboardState>()(
  persist(
    (set) => ({
      sounds: [],
      lists: [],
      activeSoundId: null,
      activeListId: null,
      isEditMode: false,
      addSound: (sound) => set((s) => ({ sounds: [...s.sounds, sound] })),
      updateSound: (id, updates) =>
        set((s) => ({
          sounds: s.sounds.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
      deleteSound: (id) =>
        set((s) => ({
          sounds: s.sounds.map((item) =>
            item.id === id
              ? { ...item, is_deleted: true, deleted_at: Date.now() }
              : item
          ),
        })),
      addList: (list) => set((s) => ({ lists: [...s.lists, list] })),
      updateList: (id, updates) =>
        set((s) => ({
          lists: s.lists.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })),
      deleteList: (id) =>
        set((s) => ({ lists: s.lists.filter((l) => l.id !== id) })),
      reorderSounds: (listId, orderedIds) =>
        set((s) => ({
          sounds: s.sounds.map((item) => {
            const idx = orderedIds.indexOf(item.id);
            return item.listId === listId && idx !== -1
              ? { ...item, order: idx }
              : item;
          }),
        })),
      setActiveSoundId: (id) => set({ activeSoundId: id }),
      setActiveListId: (id) => set({ activeListId: id }),
      setEditMode: (on) => set({ isEditMode: on }),
    }),
    {
      name: 'soundboard-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

**CRITICAL v5 note:** In Zustand v5, object selectors without `useShallow` cause extra renders because `useSyncExternalStore` is used directly. Use `useShallow` for multi-field selectors:
```typescript
import { useShallow } from 'zustand/react/shallow';
const { sounds, lists } = useSoundboardStore(useShallow((s) => ({ sounds: s.sounds, lists: s.lists })));
```

### Pattern 3: File Cache Service

**What:** Functions that copy picked files to `documentDirectory` using the new stable SDK 54 `expo-file-system` API.

```typescript
// src/services/FileCacheService.ts
// Source: https://docs.expo.dev/versions/latest/sdk/filesystem/
import { File, Directory, Paths } from 'expo-file-system';

const soundsDir = new Directory(Paths.document, 'sounds');
const thumbnailsDir = new Directory(Paths.document, 'thumbnails');
const stickersDir = new Directory(Paths.document, 'stickers');

export async function ensureDirectories(): Promise<void> {
  if (!soundsDir.exists) soundsDir.create();
  if (!thumbnailsDir.exists) thumbnailsDir.create();
  if (!stickersDir.exists) stickersDir.create();
}

export async function cacheAudioFile(
  sourceUri: string,
  filename: string
): Promise<string> {
  await ensureDirectories();
  const dest = new File(soundsDir, filename);
  const source = new File(sourceUri);
  source.copy(dest);
  return dest.uri;
}

export async function cacheThumbnail(
  sourceUri: string,
  id: string,
  ext: string = 'jpg'
): Promise<string> {
  await ensureDirectories();
  const dest = new File(thumbnailsDir, `${id}.${ext}`);
  const source = new File(sourceUri);
  source.copy(dest);
  return dest.uri;
}

export async function deleteFile(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (e) {
    console.warn('Failed to delete file:', uri, e);
  }
}
```

**Fallback note:** The legacy `expo-file-system/legacy` API is still functional in SDK 54. If the new File-based API causes issues (especially with URIs from document picker that include `content://` scheme on Android), fall back to `FileSystem.copyAsync({ from, to })` from `expo-file-system/legacy`.

### Pattern 4: Drag-and-Drop Reordering

**What:** `DraggableFlatList` replaces the read-only `FlatList` when `isEditMode` is true.

```typescript
// Source: https://github.com/computerjazz/react-native-draggable-flatlist
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';

// In edit mode, render DraggableFlatList instead of FlatList
<DraggableFlatList
  data={filteredSounds}
  keyExtractor={(item) => item.id}
  numColumns={3}                    // Note: DraggableFlatList supports numColumns
  onDragEnd={({ data }) => {
    reorderSounds(activeListId, data.map((d) => d.id));
  }}
  renderItem={({ item, drag, isActive }: RenderItemParams<AudioItem>) => (
    <ScaleDecorator>
      <SoundButton
        sound={item}
        onLongPress={drag}         // Long press triggers drag in edit mode
        isActive={isActive}
        editMode={true}
      />
    </ScaleDecorator>
  )}
/>
```

**CRITICAL — numColumns with DraggableFlatList:** DraggableFlatList does NOT support `numColumns` prop natively the same way FlatList does. The recommended workaround for a grid is to either: (a) use a single column with rows of 3 items, or (b) wrap items in rows before rendering. Evaluate this limitation carefully during implementation. If grid drag-and-drop is essential, `react-native-reorderable-list` or a custom grid approach may be needed.

### Pattern 5: TanStack Query Scaffolding (Local Mode)

**What:** Set up QueryClient with `networkMode: 'always'` so queries that read from Zustand or local storage never pause waiting for network.

```typescript
// app/_layout.tsx — scaffold for Phase 2 server data
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',  // don't pause queries when offline
      retry: 0,
      staleTime: Infinity,    // local data never goes stale
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* existing providers */}
    </QueryClientProvider>
  );
}
```

Phase 1 queries don't need `useQuery` unless wrapping Zustand reads. The primary value is scaffolding the `QueryClientProvider` so Phase 2 can add server queries without layout changes.

### Anti-Patterns to Avoid

- **`useAudioPlayer` hook for global player:** Hook cannot be called from outside React — always use `createAudioPlayer` for the soundboard singleton.
- **Storing AudioPlayer in Zustand or React state:** The player object is not serializable. Store only the `activeSoundId` (string) in state.
- **Calling `player.stop()` — it doesn't exist:** expo-audio has no `stop()` method. Use `player.pause()` + `player.seekTo(0)` to achieve stop-and-reset behavior.
- **Using `expo-av` for new code:** Deprecated in SDK 53, removed in SDK 55. Import from `expo-audio` only.
- **Using `expo-file-system/legacy` for new files:** Use the stable `File`/`Directory` API from `expo-file-system` (SDK 54+). Keep legacy import only where needed for URI format compatibility.
- **Passing Zustand object selectors without `useShallow`:** Will cause unnecessary re-renders in Zustand v5. Always use `useShallow` for `{ fieldA, fieldB }` selections.
- **`numColumns` with DraggableFlatList:** Not directly supported. Either build rows manually or switch to an alternative.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audio persistence across component unmounts | Custom player ref management | `createAudioPlayer` singleton | Handles native lifecycle, memory, interruptions |
| File persistence | Copy to AsyncStorage or base64 | `expo-file-system` File copy to `documentDirectory` | System-safe path, survives updates |
| State persistence across restarts | Custom AsyncStorage serialization | Zustand `persist` middleware | Handles hydration timing, partial updates |
| Drag-and-drop grid reordering | Custom PanResponder gesture tracking | `react-native-draggable-flatlist` | Handles hit testing, scroll + drag conflict, animation |
| Image picking (gallery + camera) | Platform-specific camera intents | `expo-image-picker` | Handles permissions, crop UI, iOS PHPicker / Android gallery |
| Silent mode bypass | AVAudioSession native module | `setAudioModeAsync({ playsInSilentMode: true })` | One-line expo-audio API call |
| Haptic feedback | Custom native module | `expo-haptics` | Already installed, three feedback levels |

**Key insight:** The audio singleton and file cache are deceptively complex — iOS audio sessions, Android foreground service requirements for sustained playback, and file path handling across iOS vs Android all have gotchas that the Expo libraries already handle.

---

## Common Pitfalls

### Pitfall 1: expo-av Still Installed

**What goes wrong:** The project still has `expo-av` in `package.json`. If new code accidentally imports from `expo-av`, it silently works in SDK 54 but breaks when upgrading to SDK 55.

**Why it happens:** Old import paths (`import { Audio } from 'expo-av'`) are still in `src/utils/audioBridge.js`.

**How to avoid:** In Plan 01-01, remove `expo-av` from `package.json` and replace all imports in `audioBridge.js`. Add an ESLint rule or tsconfig path alias to error on `expo-av` imports.

**Warning signs:** Any `import` referencing `'expo-av'` in any file.

---

### Pitfall 2: AudioPlayer Has No `stop()` Method

**What goes wrong:** Code calls `player.stop()` — this method does not exist in expo-audio. The call throws a runtime error or silently fails.

**Why it happens:** Muscle memory from expo-av's `sound.stopAsync()`.

**How to avoid:** Always use `player.pause()` followed by `player.seekTo(0)`. Encapsulate this in `AudioPlayerService.stopSound()`.

**Warning signs:** Runtime error "player.stop is not a function" or audio not resetting to beginning.

---

### Pitfall 3: `replace()` with Null Initial Source on Android

**What goes wrong:** `createAudioPlayer(null).replace({ uri })` fails on Android (pre-fix). The player is created but replace doesn't work, so `play()` plays nothing or throws.

**Why it happens:** Android's media player cannot transition from uninitialized to loaded state via replace in some builds.

**How to avoid:** Check if the bug is present in the current expo-audio build (v1.1.1 in SDK 54). If it is, initialize the player with a very short silent audio file bundled as an asset, then immediately replace with the target URI. Alternatively, destroy and recreate the player on each new sound (acceptable for a soundboard where sounds are short).

**Warning signs:** Android plays nothing when tapping first sound; iOS works fine.

---

### Pitfall 4: DraggableFlatList Grid Layout

**What goes wrong:** Setting `numColumns={3}` on DraggableFlatList does not produce a grid; items stack vertically or layout breaks during drag.

**Why it happens:** DraggableFlatList's internal drag tracking is designed for single-column lists; multi-column support is fragile.

**How to avoid:** In Plan 01-02, immediately prototype drag behavior with 3 items before building the full grid. If broken, use one of: (a) wrap items into row arrays before passing to DraggableFlatList (each "item" is a row of 3), or (b) switch to `react-native-reorderable-list` which has a different internal architecture.

**Warning signs:** Drag placeholder appears in wrong position; items reorder incorrectly after drop.

---

### Pitfall 5: expo-document-picker Subtypes Stripped

**What goes wrong:** Passing `type: ['audio/opus', 'audio/mp4']` to `getDocumentAsync` shows all files or crashes, because specific subtypes are not supported since v11.3.0.

**Why it happens:** expo-document-picker only accepts broad categories: `'audio/*'`, `'image/*'`, `'video/*'`, `'*/*'`.

**How to avoid:** Use `type: 'audio/*'` and validate the file extension after picking. Accept `.opus`, `.m4a`, `.mp3` in the validation; reject others with a user-facing error.

```typescript
const ALLOWED_EXTENSIONS = ['.opus', '.m4a', '.mp3', '.aac', '.ogg'];

function isAllowedAudioFile(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext);
}
```

**Warning signs:** User selects a video file and it's accepted; extension validation is not implemented.

---

### Pitfall 6: Zustand v5 Render Loop with Object Selectors

**What goes wrong:** Components re-render on every state update even when their selected values haven't changed.

**Why it happens:** Zustand v5 uses `useSyncExternalStore` directly. Returning a new object `{ sounds, lists }` from a selector creates a new reference on every store update, triggering a re-render.

**How to avoid:** Use `useShallow` from `zustand/react/shallow` for all multi-field object selectors. For single primitives or arrays, standard selectors are fine.

**Warning signs:** SoundButton components re-render on every tap even when their data hasn't changed; FlatList flickers.

---

### Pitfall 7: initAudioSession Must Run Before First Playback

**What goes wrong:** On iOS, audio plays at wrong volume, gets silenced by silent mode, or interrupts music incorrectly if `setAudioModeAsync` hasn't been called.

**Why it happens:** iOS requires explicit AVAudioSession configuration. The default mode is "ambient" (respects silent switch, mixes with other audio).

**How to avoid:** Call `AudioPlayerService.initAudioSession()` in `_layout.tsx` inside a `useEffect` that runs once on mount, before any user interaction.

```typescript
// app/_layout.tsx
useEffect(() => {
  AudioPlayerService.initAudioSession();
}, []);
```

**Warning signs:** Sound doesn't play when iPhone is on silent; music app keeps playing while soundboard is active.

---

### Pitfall 8: expo-file-system `content://` URIs on Android

**What goes wrong:** `expo-document-picker` on Android returns a `content://` URI (Android content provider URI), not a `file://` URI. The new `expo-file-system` `File` class may not handle `content://` URIs for copy operations.

**Why it happens:** Android's storage model uses content provider URIs for document-picker results.

**How to avoid:** Use `copyToCacheDirectory: true` in `getDocumentAsync` (this is the default). This forces expo-document-picker to copy the file to the cache directory and return a `file://` URI that is safe to use everywhere. Then copy from cache to `documentDirectory` using FileCacheService.

**Warning signs:** `file.copy()` throws on Android; file not found errors when attempting playback.

---

## Code Examples

### Audio Session Init (call once on app mount)

```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/audio/
import { setAudioModeAsync } from 'expo-audio';

await setAudioModeAsync({
  playsInSilentMode: true,
  interruptionMode: 'doNotMix',
});
```

### Picking an Audio File

```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/document-picker/
import * as DocumentPicker from 'expo-document-picker';

const result = await DocumentPicker.getDocumentAsync({
  type: 'audio/*',
  copyToCacheDirectory: true,  // ensures file:// URI on Android
});

if (!result.canceled && result.assets.length > 0) {
  const { uri, name } = result.assets[0];
  // validate extension
  if (isAllowedAudioFile(name)) {
    const cachedUri = await FileCacheService.cacheAudioFile(uri, `${uuid()}.${ext}`);
    // proceed with cachedUri
  }
}
```

### Picking a Thumbnail

```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/imagepicker/
import * as ImagePicker from 'expo-image-picker';

// Gallery
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsEditing: true,
  quality: 0.8,
});

// Camera
const result = await ImagePicker.launchCameraAsync({
  mediaTypes: ['images'],
  allowsEditing: true,
  quality: 0.8,
});

if (!result.canceled && result.assets.length > 0) {
  const { uri } = result.assets[0];
  const thumbnailUri = await FileCacheService.cacheThumbnail(uri, soundId);
}
```

### Playing a Sound (Stop-and-Restart)

```typescript
// In SoundButton tap handler (called from HomeScreen)
import { playSound, stopSound } from '../services/AudioPlayerService';
import { useSoundboardStore } from '../store/soundboardStore';

async function handleTap(sound: AudioItem): Promise<void> {
  const { activeSoundId, setActiveSoundId } = useSoundboardStore.getState();

  if (activeSoundId === sound.id) {
    // Toggle: stop if already playing
    await stopSound();
    setActiveSoundId(null);
  } else {
    // Stop current, play new
    await playSound(sound.uri);
    setActiveSoundId(sound.id);
  }
}
```

### Active Button Highlight

```typescript
// SoundButton.tsx — Claude's discretion for exact animation
import Animated, { useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const animatedStyle = useAnimatedStyle(() => {
  if (!isActive) return {};
  return {
    borderWidth: 2,
    borderColor: '#25D366',
    shadowColor: '#25D366',
    shadowOpacity: withRepeat(
      withSequence(
        withTiming(0.9, { duration: 600 }),
        withTiming(0.3, { duration: 600 })
      ),
      -1, // loop forever
      true
    ),
    shadowRadius: 8,
  };
});
```

### Thumbnail Button with Gradient Overlay

```typescript
// Source: Claude's discretion; LinearGradient from expo-linear-gradient
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

{sound.thumbnailUri ? (
  <View style={styles.container}>
    <Image source={{ uri: sound.thumbnailUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.75)']}
      style={[StyleSheet.absoluteFill, styles.gradient]}
    />
    <Text style={styles.titleOnImage}>{sound.title}</Text>
  </View>
) : (
  <View style={[styles.container, { backgroundColor: sound.color }]}>
    <Text style={styles.title}>{sound.title}</Text>
  </View>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `expo-av` Audio.Sound | `expo-audio` `createAudioPlayer` | SDK 52 (deprecated), SDK 55 (removed) | New imperative API; no more `createAsync`/`loadAsync` pattern |
| `expo-file-system/legacy` path strings | `expo-file-system` File/Directory classes | SDK 54 (stable) | Object-oriented; no manual path concatenation |
| Context + useState for global state | Zustand with persist middleware | Community shift ~2023-2024 | Less boilerplate; built-in persistence |
| `expo-av` `Audio.Sound.createAsync` | `createAudioPlayer` + `player.replace()` | SDK 52+ | Player is reusable; no create-per-sound overhead |
| `AsyncStorage` direct calls | Zustand `persist` middleware | — | State hydration is automatic; no manual load/save |

**Deprecated/outdated:**
- `expo-av`: Do not use. Remove from `package.json`.
- `expo-file-system/legacy` for new features: Use `expo-file-system` stable API. Legacy remains for backward compat only.
- `Audio.Sound.createAsync()` pattern: Replaced by `createAudioPlayer` + `replace()`.

---

## Open Questions

1. **DraggableFlatList + Reanimated 4 grid compatibility**
   - What we know: DraggableFlatList v4.0.3 was ported to Reanimated v2+ (Nov 2023). The project uses Reanimated ~4.1.1. There are open GitHub issues from 2025 showing usage with Reanimated 4.x, indicating it works but possibly with edge cases. `numColumns` support is uncertain.
   - What's unclear: Whether `numColumns={3}` works correctly in drag mode; whether Reanimated 4 worklet changes break any internal APIs.
   - Recommendation: Prototype drag-and-drop first in Plan 01-02 before committing to DraggableFlatList. If it fails, switch to `react-native-reorderable-list`. The `reorderSounds` Zustand action is decoupled from the drag library, so switching is low-cost.

2. **`createAudioPlayer(null)` Android behavior in expo-audio v1.1.1**
   - What we know: Bug was fixed (PR #35749) before SDK 54. Fix was specifically for the case where `useAudioPlayer` was not given a source — may or may not apply to `createAudioPlayer(null)`.
   - What's unclear: Whether `createAudioPlayer(null)` followed by `replace({ uri })` is reliable on Android in SDK 54's v1.1.1.
   - Recommendation: In Plan 01-02, test `createAudioPlayer(null).replace({ uri }).play()` on Android simulator immediately. If it fails, initialize with a bundled silent audio file (`require('./assets/silence.mp3')`) and replace on first play.

3. **Custom dev client build timing**
   - What we know: `expo-dev-client` is already installed. EAS Build produces a development build that supports custom native modules (needed for Phase 3 Share Extension).
   - What's unclear: Whether the team has an EAS account set up. Local build with `npx expo run:android` works for Android without EAS; iOS device build requires EAS or a paid Apple Developer account.
   - Recommendation: Plan 01-01 should include EAS project setup and a test development build for Android. iOS EAS build can be deferred if no iOS device is needed for Phase 1 testing.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test files, no jest/vitest config found |
| Config file | Wave 0 must create `jest.config.js` or `vitest.config.ts` |
| Quick run command | `npx jest --testPathPattern=src/` (after Wave 0 setup) |
| Full suite command | `npx jest` |

**Note:** This is a React Native / Expo project. Jest with `jest-expo` preset is the standard test framework for this ecosystem. There are no existing test files. Vitest is not supported for React Native (requires Node environment; React Native uses Hermes). `jest-expo` configures the correct transform and module mocks.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SND-02 | Haptic triggered on tap | unit (mock expo-haptics) | `npx jest src/services/AudioPlayerService.test.ts` | Wave 0 |
| SND-03 | Stop-and-restart: playing B stops A | unit (mock AudioPlayer) | `npx jest src/services/AudioPlayerService.test.ts` | Wave 0 |
| SND-04 | addList creates list in store | unit (Zustand store) | `npx jest src/store/soundboardStore.test.ts` | Wave 0 |
| SND-05 | List retains theme color after persist | unit (Zustand persist) | `npx jest src/store/soundboardStore.test.ts` | Wave 0 |
| SND-07 | reorderSounds updates order field correctly | unit (Zustand store) | `npx jest src/store/soundboardStore.test.ts` | Wave 0 |
| AUD-01 | File extension validation rejects non-audio | unit (pure function) | `npx jest src/utils/fileUtils.test.ts` | Wave 0 |
| AUD-04 | cacheAudioFile copies to documentDirectory path | unit (mock expo-file-system) | `npx jest src/services/FileCacheService.test.ts` | Wave 0 |
| AUD-06 | deleteSound sets is_deleted + deleted_at | unit (Zustand store) | `npx jest src/store/soundboardStore.test.ts` | Wave 0 |
| SND-01, AUD-02, AUD-03, AUD-05 | Visual/modal behavior | manual | n/a — UI flows on device | n/a |

### Sampling Rate

- **Per task commit:** `npx jest src/ --passWithNoTests`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `jest.config.js` — configure `jest-expo` preset; install with `npx expo install jest-expo jest @types/jest`
- [ ] `src/store/soundboardStore.test.ts` — covers SND-04, SND-05, SND-07, AUD-06
- [ ] `src/services/AudioPlayerService.test.ts` — covers SND-02, SND-03 (mock expo-audio)
- [ ] `src/services/FileCacheService.test.ts` — covers AUD-04 (mock expo-file-system)
- [ ] `src/utils/fileUtils.test.ts` — covers AUD-01 (pure function, no mocks needed)

---

## Sources

### Primary (HIGH confidence)

- [expo-audio official docs](https://docs.expo.dev/versions/latest/sdk/audio/) — AudioPlayer API, createAudioPlayer, setAudioModeAsync, replace(), useAudioPlayerStatus
- [expo-file-system official docs](https://docs.expo.dev/versions/latest/sdk/filesystem/) — File, Directory, Paths API (SDK 54 stable)
- [expo-file-system upgrade blog](https://expo.dev/blog/expo-file-system) — SDK 54 new API overview
- [expo-document-picker official docs](https://docs.expo.dev/versions/latest/sdk/document-picker/) — getDocumentAsync, type filtering, result shape
- [expo-image-picker official docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) — launchImageLibraryAsync, launchCameraAsync, result shape, permissions
- [Expo development builds docs](https://docs.expo.dev/develop/development-builds/create-a-build/) — EAS build setup, expo-dev-client

### Secondary (MEDIUM confidence)

- [expo-audio Discussion #33192: useAudioPlayer inadequate for global playback](https://github.com/expo/expo/discussions/33192) — confirmed createAudioPlayer is the correct pattern for global singleton
- [expo-audio Issue #35670: replace() not working on Android](https://github.com/expo/expo/issues/35670) — confirmed bug + fix via PR #35749; fixed before SDK 54
- [expo-audio Issue #36034: play() on one player pauses others on Android](https://github.com/expo/expo/issues/36034) — Android-specific behavior note
- [react-native-draggable-flatlist GitHub releases](https://github.com/computerjazz/react-native-draggable-flatlist/releases) — v4.0.3 (May 2024), ported to Reanimated v2+ in v4.0.0
- [react-native-reorderable-list GitHub](https://github.com/omahili/react-native-reorderable-list) — Reanimated ≥3.12 peer, fallback option
- [Zustand v5 announcement](https://pmnd.rs/blog/announcing-zustand-v5) — breaking changes, useShallow requirement
- [Reanimated 4 compatibility table](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/) — confirmed Reanimated 4.1.x compatible with RN 0.81

### Tertiary (LOW confidence — needs runtime validation)

- [WebSearch: DraggableFlatList + Reanimated 4 2025 issues](https://github.com/computerjazz/react-native-draggable-flatlist/issues/617) — recent issue (2025) showing usage with Reanimated 4.1.6; functional but edge cases possible
- [WebSearch: expo-document-picker subtype restriction](https://github.com/expo/expo/issues/22351) — subtypes dropped in v11.3.0; broad `audio/*` required

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — core libraries verified against official Expo SDK 54 docs
- Architecture (audio singleton): HIGH — confirmed by official docs and GitHub discussion #33192
- Architecture (file caching): HIGH — official SDK 54 docs
- Architecture (Zustand): HIGH — official Zustand v5 docs
- Architecture (drag-and-drop): MEDIUM — DraggableFlatList v4 + Reanimated 4 combination is unverified in official docs; functional per community reports but needs prototype validation
- Pitfalls: HIGH — most derived from official GitHub issues with confirmed fixes or workarounds

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (Expo moves fast; re-verify expo-audio version if SDK upgrades occur)
