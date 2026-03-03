# Architecture

**Analysis Date:** 2026-03-03

## Pattern Overview

**Overall:** React Native Soundboard Application with Expo Router file-based routing and Context API state management

**Key Characteristics:**
- Expo-managed React Native application with multiplatform support (iOS, Android, Web)
- File-based routing using Expo Router with stack navigation
- Global state management via React Context API (SoundboardContext)
- Functional components with React Hooks
- Native file system integration for audio persistence
- Share intent handling for cross-app audio reception
- Local async storage for metadata persistence

## Layers

**Routing Layer:**
- Purpose: Manages navigation flow and app shell structure
- Location: `app/_layout.tsx`, `app/index.tsx`
- Contains: Root layout with providers, entry point screen routing
- Depends on: expo-router, ShareIntentProvider, SoundboardProvider
- Used by: All screens and components

**State Management Layer:**
- Purpose: Centralized soundboard data management and persistence
- Location: `src/hooks/useSoundboard.js`
- Contains: Context provider, hook export, AsyncStorage operations, document picker integration
- Depends on: AsyncStorage, expo-document-picker, React Context
- Used by: HomeScreen, EditSoundModal

**Screen Layer:**
- Purpose: Main UI container that orchestrates sound grid display and interactions
- Location: `src/screens/HomeScreen.js`
- Contains: Share intent processing, modal state, sound grid rendering with FlatList
- Depends on: useSoundboard hook, SoundButton component, AddSoundFab, EditSoundModal
- Used by: app/index.tsx

**Component Layer:**
- Purpose: Reusable UI elements for sound interaction and editing
- Location: `src/components/`
- Contains: SoundButton.js (grid items), AddSoundFab.js (FAB), EditSoundModal.js (edit UI)
- Depends on: React Native primitives, useSoundboard hook
- Used by: HomeScreen

**Utility/Bridge Layer:**
- Purpose: Native audio operations and file system management
- Location: `src/utils/audioBridge.js`
- Contains: Audio playback, file persistence, sharing, haptic feedback
- Depends on: expo-av, expo-file-system, expo-sharing, expo-haptics
- Used by: useSoundboard hook, HomeScreen

**Theme/Constants Layer:**
- Purpose: Design system and application constants
- Location: `constants/theme.ts`
- Contains: Color definitions (light/dark modes), font family mappings
- Depends on: React Native Platform
- Used by: Components for styling

## Data Flow

**Sound Loading Flow:**

1. App mounts → RootLayout initializes providers
2. SoundboardProvider mounts → useEffect triggers loadSounds()
3. AsyncStorage retrieves @soundboard_items → setSounds() updates state
4. HomeScreen renders with sounds array
5. FlatList displays each sound via SoundButton components

**Add New Sound Flow:**

1. User taps AddSoundFab → calls addNewSound()
2. DocumentPicker opens file dialog
3. User selects audio file → saveAudioFile() copies to SOUNDS_DIRECTORY
4. New sound metadata object created with id, title, color, uri
5. saveToStorage() persists [sounds, newSound] to AsyncStorage
6. setSounds() triggers HomeScreen re-render

**Share Intent Receiving Flow:**

1. App receives incoming share intent via ShareIntentProvider
2. HomeScreen useEffect detects hasShareIntent && file type
3. saveSoundFromUri() called with shareIntent.files[0].path
4. Audio file copied to SOUNDS_DIRECTORY
5. New sound added to AsyncStorage
6. resetShareIntent() clears the intent

**Sound Editing Flow:**

1. User long-presses SoundButton → triggers handleLongPress()
2. playSoundFile() loads audio into Audio.Sound object
3. EditSoundModal opens with selected sound data
4. User modifies title/color in modal
5. handleSave() calls updateSound(id, title, color)
6. updateSound() maps over sounds array and updates matching id
7. saveToStorage() persists changes
8. Modal closes via handleModalClose()

**Share to External App Flow:**

1. User short-taps SoundButton → triggers handleShortTap()
2. shareAudioToWhatsApp(uri) called
3. Haptics.impactAsync() provides feedback
4. Sharing.shareAsync() opens native share sheet
5. User selects target app (WhatsApp, etc.)

**State Management:**

- Sounds array stored in AsyncStorage at key `@soundboard_items`
- Sound metadata: {id, title, uri, color, createdAt}
- No in-memory cache - AsyncStorage is source of truth
- Each operation (add/update/delete) triggers full array persistence
- Loading state managed during initial AsyncStorage hydration

## Key Abstractions

**Sound Object:**
- Purpose: Represents a single audio item in the soundboard
- Examples: Used in useSoundboard context and all components
- Pattern: Plain object with id (timestamp string), title, uri (file path), color (hex), createdAt (timestamp)

**SoundboardContext:**
- Purpose: Global state provider for sound management
- Examples: `src/hooks/useSoundboard.js`
- Pattern: React Context with Provider component and custom hook (useSoundboard) for consumption

**Audio Bridge:**
- Purpose: Abstraction over native audio/file operations to isolate Expo SDK dependencies
- Examples: `src/utils/audioBridge.js` exports (saveAudioFile, deleteAudioFile, playSoundFile, shareAudioToWhatsApp)
- Pattern: Module-level functions without class instantiation, handles file paths and Audio.Sound lifecycle

**Share Intent Handler:**
- Purpose: Receive audio files from other apps and integrate into soundboard
- Examples: Integrated in HomeScreen.js via ShareIntentContext from expo-share-intent
- Pattern: Detected via hasShareIntent flag, processed in useEffect hook

## Entry Points

**Application Entry:**
- Location: `app/_layout.tsx`
- Triggers: Expo startup sequence
- Responsibilities: Initialize ShareIntentProvider, SoundboardProvider, render Stack with root routes

**Main Screen Entry:**
- Location: `app/index.tsx`
- Triggers: Router resolves to index route
- Responsibilities: Render StatusBar, mount HomeScreen component

**Home Screen:**
- Location: `src/screens/HomeScreen.js`
- Triggers: App mounts via app/index.tsx
- Responsibilities: Listen to share intents, render sound grid, manage modal/playback state, coordinate add/edit/delete operations

## Error Handling

**Strategy:** Try-catch blocks with console.error logging and user-facing Alert dialogs for critical failures

**Patterns:**

- Document picking failures: Alert.alert("Error", "Could not add sound file.") in addNewSound catch
- AsyncStorage failures: Console.error logged, app continues with empty sounds array
- Audio playback failures: playSoundFile returns null, component handles gracefully
- File system failures: deleteAudioFile catches and logs with idempotent flag to prevent crashes
- Share intent errors: ShareIntentProvider error accessed via useShareIntentContext, logged to console
- Directory creation: ensureDirectoryExists creates directories with intermediates: true for robustness

## Cross-Cutting Concerns

**Logging:** Console methods (console.error, console.warn) used throughout for debugging - no centralized logger

**Validation:**
- Title length capped at 15-20 characters via substring truncation
- File type restrictions in DocumentPicker (audio/*, application/ogg)
- URI validation implicit via expo APIs (FileSystem.getInfoAsync)

**Authentication:** Not implemented - app is local-only with no backend services

**Persistence:**
- AsyncStorage for metadata (sounds array)
- FileSystem (expo-file-system) for audio files in app document directory
- Path: FileSystem.documentDirectory + "sounds/"

**Permissions:**
- Share intent requires manifest configuration in app.json
- File system access implicit via Expo managed workflow
- Sharing/haptics permissions handled automatically by Expo

**Performance:**
- FlatList with numColumns={3} uses renderItem for virtualization
- Sound objects kept minimal (id, title, uri, color, createdAt)
- No pagination implemented - assumes manageable sound count
- Audio.Sound objects unloaded after playback to free resources

---

*Architecture analysis: 2026-03-03*
