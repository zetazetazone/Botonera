# External Integrations

**Analysis Date:** 2026-03-03

## APIs & External Services

**Share Intent / App Communication:**
- Expo Share Intent - Receive audio files shared from other applications
  - Integration: `expo-share-intent` plugin in `app.json`
  - Usage: `src/screens/HomeScreen.js` uses `useShareIntentContext()` to intercept shared files
  - Configuration: Handles `file` type shares with wildcard intent filters (`*/*`)
  - Incoming filter: Configured in `app.json` plugin `expo-share-intent`

**File Sharing:**
- Native Share Sheet - System share dialog for sending sounds to other apps
  - Implementation: `expo-sharing` package
  - Used in: `src/utils/audioBridge.js` - `shareAudioToWhatsApp()` function
  - Target: Opens native share dialog; user selects WhatsApp or other apps from sheet
  - No direct API key/auth required

## Data Storage

**Databases:**
- None detected - Uses only local device storage

**Local File Storage:**
- Expo File System (expo-file-system)
  - Purpose: Store audio files locally on device
  - Location: `FileSystem.documentDirectory + "sounds/"`
  - Implementation: `src/utils/audioBridge.js` manages directory and file operations
  - Operations:
    - `ensureDirectoryExists()` - Creates sounds directory
    - `saveAudioFile()` - Copies files from picker to permanent storage
    - `deleteAudioFile()` - Removes audio files
  - Audio formats supported: MP3, OGG, WAV (via expo-av)

**Persistent App Data:**
- AsyncStorage (@react-native-async-storage/async-storage)
  - Purpose: Store sound metadata (titles, colors, timestamps)
  - Storage key: `@soundboard_items`
  - Location: Device persistent storage (varies by OS)
  - Data format: JSON-serialized array of sound objects
  - Implementation: `src/hooks/useSoundboard.js` manages load/save operations
  - Schema: Each sound stores: `{ id, title, uri, color, createdAt }`

**File Storage:**
- Local filesystem only - No cloud storage integration
- Files stored in app-specific document directory via `expo-file-system`

**Caching:**
- None detected - No caching layer implemented

## Authentication & Identity

**Auth Provider:**
- None - Application is completely local and offline-capable
- No user accounts, login, or authentication system
- No API keys or credentials required

## Monitoring & Observability

**Error Tracking:**
- None detected - No remote error tracking service

**Logs:**
- Console logging only
- Implementation: Standard `console.error()`, `console.warn()`, `console.log()` calls
- Examples in:
  - `src/utils/audioBridge.js` - Error logging for audio playback and file operations
  - `src/hooks/useSoundboard.js` - Error logging for storage operations
  - `src/screens/HomeScreen.js` - Share intent error logging

## Haptic & Device Feedback

**Haptics:**
- Expo Haptics (expo-haptics)
  - Light impact on sound button tap: `Haptics.ImpactFeedbackStyle.Light`
  - Medium impact on share action: `Haptics.ImpactFeedbackStyle.Medium`
  - Location: `src/utils/audioBridge.js` - `playSoundFile()` and `shareAudioToWhatsApp()`
  - No configuration required - Uses device defaults

**Audio Output:**
- Expo AV (expo-av)
  - Purpose: Audio playback for soundboard sounds
  - Implementation: `src/utils/audioBridge.js` - `playSoundFile()` function
  - Creates `Audio.Sound` objects with auto-play
  - Returns sound object for lifecycle management (stop/unload)

## Document/File Picking

**Document Picker:**
- Expo Document Picker (expo-document-picker)
  - Purpose: Select audio files from device storage
  - Location: `src/hooks/useSoundboard.js` - `addNewSound()` function
  - Supported types: Audio files (`audio/*`, `application/ogg`)
  - Configuration: `copyToCacheDirectory: true` - Files copied to cache before permanent storage

## CI/CD & Deployment

**Hosting:**
- Expo EAS Build - Managed cloud build service
- Deployment targets:
  - Android - Google Play Store (via built APK)
  - iOS - Apple App Store (via built IPA)
  - Web - Static web host compatible (via static output)

**CI Pipeline:**
- None detected - No GitHub Actions, GitLab CI, or other CI integration
- Manual build via `expo run:android` or EAS Build CLI

**Build Commands:**
- Development server: `npm start -- --port 8082`
- Android emulator: `npm run android`
- iOS simulator: `npm run ios`
- Web: `npm run web`
- Native build: `npm run android:dev` (requires development client)

## Environment Configuration

**Required env vars:**
- None detected - No environment variables required
- Application is fully self-contained and offline-capable

**Configuration files:**
- `app.json` - Expo project configuration (app name, icons, permissions, plugins)
- `android/app/build.gradle` - Android-specific build configuration
- No secrets or credentials in codebase

**Secrets location:**
- Not applicable - No external integrations requiring secrets
- Code does not read from .env files

## Permissions

**Android (app.json/build.gradle):**
- Share intent filters: `*/*` (all file types)
- Package: `com.anonymous.Botonera`
- Adaptive icon support
- Edge-to-edge enabled
- Predictive back gesture: disabled

**iOS (app.json):**
- Tablet support enabled
- Share intent bundle ID: `com.botonera.share`

## Webhooks & Callbacks

**Incoming:**
- Share intent callback - Triggered when app receives file share from system
- Implementation: `useShareIntentContext()` hook in `src/screens/HomeScreen.js`
- Event handling: Listens to `hasShareIntent`, `shareIntent` objects, and `shareError`
- Reset mechanism: `resetShareIntent()` clears intent after processing

**Outgoing:**
- None detected - No webhook or callback mechanisms sending data

## Splash Screen & Icons

**Splash Screen:**
- Expo Splash Screen (expo-splash-screen)
- Image: `assets/images/splash-icon.png` (200x200)
- Background color: White (light), Black (dark mode)
- Configuration: `app.json` plugin settings

**Icons:**
- App icon: `assets/images/icon.png`
- Android adaptive icon:
  - Foreground: `assets/images/android-icon-foreground.png`
  - Background: `assets/images/android-icon-background.png`
  - Monochrome: `assets/images/android-icon-monochrome.png`
- Web favicon: `assets/images/favicon.png`

---

*Integration audit: 2026-03-03*
