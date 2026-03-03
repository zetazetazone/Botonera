# Coding Conventions

**Analysis Date:** 2026-03-03

## Naming Patterns

**Files:**
- Components use PascalCase: `SoundButton.js`, `EditSoundModal.js`, `HomeScreen.js`
- Hooks use kebab-case with `use-` prefix: `use-color-scheme.ts`, `use-theme-color.ts`
- Utility files use camelCase: `audioBridge.js`
- Constants use UPPER_SNAKE_CASE: `SOUNDS_DIRECTORY`, `STORAGE_KEY`, `COLORS`

**Functions:**
- Exported React components use PascalCase: `SoundboardProvider()`, `EditSoundModal()`, `HomeScreen()`
- Exported hooks use camelCase with `use` prefix: `useSoundboard()`, `useThemeColor()`
- Exported utility functions use camelCase: `saveAudioFile()`, `playSoundFile()`, `shareAudioToWhatsApp()`
- Internal handler functions use camelCase with `handle` prefix: `handleSave()`, `handleDelete()`, `handleShortTap()`, `handleLongPress()`
- Async functions explicitly marked: `async` keyword used for all async functions

**Variables:**
- Local state variables use camelCase: `sounds`, `isLoading`, `selectedSound`, `activeSoundObj`
- Boolean variables prefix with `is` or `has`: `isModalVisible`, `isLoading`, `hasShareIntent`
- Color constants use all caps: `COLORS`, `randomColor`
- Event handlers follow pattern: `onPress`, `onClose`, `onSave`, `onDelete`, `onLongPress`

**Types:**
- Object/interface-like structures use descriptive camelCase: `sound`, `soundToDelete`, `shareIntent`
- No explicit TypeScript interfaces in codebase (mixed JS/TS project)

## Code Style

**Formatting:**
- Uses expo lint (based on eslint-config-expo)
- Semicolons: Required at end of statements
- Indentation: 4 spaces for all indentation
- Line length: No strict limit observed, but most lines under 100 characters
- Quotes: Single quotes for strings (JSDoc/comments may use any)

**Linting:**
- Tool: ESLint with `eslint-config-expo` (flat config)
- Config location: `eslint.config.js`
- Run command: `npm run lint`
- Ignores: `dist/*` directory

**Comment Style:**
- JSDoc comments for exported functions with param and return types
- Example from `audioBridge.js`:
  ```javascript
  /**
   * Copies a file from a temporary picker location to the permanent app storage.
   * @param {string} sourceUri The temporary URI of the picked file.
   * @returns {string} The new permanent URI of the copied file.
   */
  ```
- Inline comments use `//` for explanatory notes
- No extensive inline comments; code is self-documenting where possible

## Import Organization

**Order:**
1. Third-party libraries and React imports (react, react-native, expo-*)
2. Local absolute imports using `@/` path alias (e.g., `@/constants/theme`, `@/hooks/use-color-scheme`)
3. Local relative imports (e.g., `../components/SoundButton`)

**Pattern Example from `HomeScreen.js`:**
```javascript
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    // ... more react-native imports
} from 'react-native';
import AddSoundFab from '../components/AddSoundFab';
import EditSoundModal from '../components/EditSoundModal';
import SoundButton from '../components/SoundButton';
import { useSoundboard } from '../hooks/useSoundboard';
import { playSoundFile, shareAudioToWhatsApp } from '../utils/audioBridge';
```

**Path Aliases:**
- Configured in `tsconfig.json`: `@/*` maps to root directory
- Used for accessing constants and hooks from any depth: `@/constants/theme`

## Error Handling

**Patterns:**
- Try/catch blocks wrap async operations
- All errors logged to console with `console.error()` or `console.warn()`
- User-facing errors via React Native `Alert.alert()` for warnings
- Graceful fallbacks provided:
  - `playSoundFile()` returns `null` on error instead of throwing
  - `deleteAudioFile()` uses `idempotent: true` to ignore missing files
  - File operations continue even if error occurs

**Example from `useSoundboard.js`:**
```javascript
try {
    const storedSounds = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedSounds !== null) {
        setSounds(JSON.parse(storedSounds));
    }
} catch (error) {
    console.error("Error loading sounds from storage", error);
} finally {
    setIsLoading(false);
}
```

## Logging

**Framework:** Console-based (no structured logging library)

**Patterns:**
- `console.error()` for recoverable errors and failures
- `console.warn()` for non-critical warnings (e.g., "Sharing is not available")
- Error messages are descriptive and include context: `"Error loading sounds from storage"`, `"Error saving sound from incoming share:"`
- Errors logged with full error object for debugging: `console.error("message", error)`

**No debug/verbose logging** for successful operations

## Comments

**When to Comment:**
- JSDoc for all exported functions and hooks
- Inline comments for non-obvious logic or workarounds
- Comments explaining constraints (e.g., "Remove extension from filename if present for a cleaner default title")
- Comments on color choices and design decisions
- Complex algorithms or regex patterns explained

**JSDoc/TSDoc Usage:**
- Required for exported functions
- Includes `@param` tags with types and descriptions
- Includes `@returns` tag with type and description
- Example:
  ```javascript
  /**
   * Plays a local audio file.
   * @param {string} uri The URI of the audio file to play.
   * @returns {Promise<Audio.Sound>} The sound object (for stopping/unloading later).
   */
  ```

## Function Design

**Size Guidelines:**
- Small focused functions (50-100 lines typical for utilities)
- Larger component functions acceptable (HomeScreen is 177 lines for full screen)
- Provider/Context hooks can be longer (useSoundboard is 154 lines)

**Parameters:**
- Object destructuring used for component props: `function SoundButton({ sound, onPress, onLongPress })`
- Callbacks passed as named props: `onPress`, `onSave`, `onClose`
- Single parameter acceptable for utility functions: `async (uri) => { ... }`

**Return Values:**
- React components return JSX
- Hooks return context values as objects: `{ sounds, isLoading, addNewSound, ... }`
- Async utilities return Promises with meaningful types
- Error cases return `null` or fallback values rather than throwing

## Module Design

**Exports:**
- Named exports for utilities: `export const saveAudioFile = async (...)`
- Default export for components: `export default function HomeScreen() { ... }`
- Default export for hooks: `export default function AddSoundFab(...)`
- Context provider exported as named: `export const SoundboardProvider = (...)`
- Custom hook exported as named: `export const useSoundboard = () => { ... }`

**Barrel Files:**
- Not used in this codebase
- Each file exports only what it defines

**File Structure per Module:**
- Components: `export default function ComponentName() { ... }` followed by `const styles = StyleSheet.create({ ... })`
- Screens: Same pattern as components
- Hooks: Export context, provider, and custom hook
- Utils: Multiple named exports, all functions with JSDoc

## React Patterns

**State Management:**
- React hooks (useState) for local component state
- React Context API with Provider pattern for global state (`SoundboardContext`)
- AsyncStorage for persistence
- No Redux or other state libraries

**Component Patterns:**
- Functional components exclusively
- Props destructuring in function signature
- useEffect for side effects
- Controlled components for modals and forms

**Styling:**
- React Native `StyleSheet.create()` for all styling
- Styles defined at module bottom as `const styles = StyleSheet.create({ ... })`
- Inline style props for dynamic values: `style={[styles.container, { backgroundColor: sound.color }]}`
- Responsive sizing via `Dimensions.get('window')`

---

*Convention analysis: 2026-03-03*
