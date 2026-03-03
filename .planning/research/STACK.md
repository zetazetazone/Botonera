# Stack Research

**Domain:** Mobile soundboard and social audio sharing app (React Native / Expo + Supabase)
**Researched:** 2026-03-04
**Confidence:** HIGH (core framework/Supabase), MEDIUM (sharing layer), LOW (multi-attachment WhatsApp combo)

---

## Current Project Reality

The scaffold at initial commit is on **Expo SDK 54**, React Native **0.81.5**, with the New Architecture enabled (`newArchEnabled: true`). This changes some recommendations below relative to a greenfield start.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo SDK | ~54.0.x (current) | App framework, build tooling, OTA updates | Expo is the officially recommended React Native framework; SDK 54 ships with New Architecture by default and is actively maintained. SDK 55 is the next release — stay on 54 until expo-av migration is complete. |
| React Native | 0.81.5 | Cross-platform mobile runtime | Pinned by Expo SDK 54; New Architecture enabled by default from RN 0.82+ |
| TypeScript | ~5.9.x | Type safety across the codebase | Strongly typed audio APIs, Supabase response shapes, and router params prevent a class of runtime bugs common in media apps |
| Expo Router | ~6.0.x | File-based navigation, tab routing | Built on React Navigation v7, file-based routing eliminates boilerplate for tabs + stack navigators. Already installed. |

### Audio Layer

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| expo-audio | latest (SDK 54 compatible) | Audio playback for soundboard | **Replace expo-av immediately.** expo-av is deprecated and will be removed in SDK 55. expo-audio is stable as of SDK 53, offers `useAudioPlayer` hook for managed lifecycle, and is the officially maintained replacement. |
| expo-haptics | ~15.0.x | Haptic feedback on button taps | Already installed; provides `ImpactFeedbackStyle.Medium` for the tap-to-play feel. No alternative needed. |

**Critical audio note:** expo-audio has a platform asymmetry on Android — calling `player.play()` on one `AudioPlayer` instance pauses all other `AudioPlayer` instances. For a soundboard that plays one sound at a time (stop-and-restart model), this is actually the correct behavior. Do not fight it. On iOS, concurrent playback is the default, so explicit stop-before-play logic must be added manually (call `player.seekTo(0)` and `player.pause()` on the active player before starting the new one). [GitHub issue #36034](https://github.com/expo/expo/issues/36034)

### Backend / Data

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @supabase/supabase-js | ^2.x (latest ~2.98.x) | Postgres queries, Auth, Storage client | Single SDK for all Supabase services. Isomorphic, works in React Native without any polyfills beyond AsyncStorage. |
| @react-native-async-storage/async-storage | 2.2.0 (already installed) | Supabase session persistence | Required by supabase-js for auth token storage on mobile; already in project. |
| react-native-url-polyfill | ^2.x | URL API polyfill for supabase-js | supabase-js uses the URL constructor internally; React Native's runtime does not provide it natively. Install once, import before supabase client init. |

### File Operations

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| expo-file-system | ~19.0.x | Local audio file caching to document directory | Already installed. Use `FileSystem.documentDirectory` for persistent cache (survives app restart), not `cacheDirectory` (OS can delete). Required for offline soundboard access. |
| expo-document-picker | ~14.0.x | Audio file selection from device storage | Already installed. Use `type: ['audio/*']` to filter. Returns a `uri` that can be directly read with expo-file-system and uploaded to Supabase Storage. |

### Sharing (Outbound — Sending to WhatsApp)

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| react-native-share | ^12.x (latest ~12.2.5) | `shareSingle()` targeting `com.whatsapp` | Supports targeting WhatsApp specifically via `social: Share.Social.WHATSAPP`. expo-sharing only opens the generic system sheet — it cannot target WhatsApp directly. Requires `expo prebuild` (already implied by dev-client usage). |
| expo-sharing | ~14.0.x (already installed) | Fallback system share sheet | Keep as fallback for when WhatsApp is not installed or when audio-only share is acceptable without app targeting. |

**WhatsApp sharing constraints:**
- **Android:** `shareSingle` to WhatsApp with a single audio file URI works reliably. Use `url: 'file:///...'` path from document directory.
- **iOS:** Sending a file directly to a specific WhatsApp contact is not possible via `shareSingle` on iOS — WhatsApp opens but does not attach the file; it renders the path as text. [GitHub issue #1699](https://github.com/react-native-share/react-native-share/issues/1699). The working iOS approach is the system share sheet (`expo-sharing` or `Share.open()`), which opens WhatsApp in the recipient chooser. This is the practical fallback.
- **Audio + sticker combo:** WhatsApp's share intent does not support two attachments in a single share action on either platform. Implement as two sequential shares or accept image-only / audio-only as separate actions. Do not promise single-action combo share without validating on real devices.

### Share Intent Receiver (Inbound — Receiving from WhatsApp)

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| expo-share-intent | ^5.1.1 (already installed, SDK 54 needs v5.x) | iOS Share Extension + Android intent filter | Already configured in `app.json`. Provides `useShareIntent` hook with `hasShareIntent`, `shareIntent`, `resetShareIntent`. Supports `audio/*` MIME type. Requires `expo prebuild` — cannot run in Expo Go. |

**expo-share-intent SDK version mapping:**
- SDK 55+ → v6.0+
- SDK 54 → v5.x (current install is correct)
- SDK 53 → v4.x

### State Management

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| Zustand | ^5.x | Client-side UI state (active player, selected list, playback status) | Lightest footprint for soundboard state; hook-based API fits React Native. Community consensus in 2025 for mobile projects. No need for Redux overhead. |
| TanStack Query | ^5.x | Server state (audio list fetching, explore feed, Supabase queries) | Caching, background refetch, and optimistic updates for Supabase calls. Standard pairing with Supabase in React Native community in 2025. |

### UI & Styling

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| react-native-reanimated | ~4.1.x (already installed) | Grid animation, press animations, smooth list transitions | Already installed. v4 is the New Architecture native implementation. Use `useAnimatedStyle` for button press scale effects. |
| react-native-gesture-handler | ~2.28.x (already installed) | Long-press detection for share action | Already installed. Works with reanimated. Use `LongPressGestureHandler` for share trigger on soundboard buttons. |
| expo-image | ~3.0.x (already installed) | Optimized thumbnail / sticker rendering | Already installed. Handles caching, progressive loading, and blurhash placeholders better than `<Image>` from React Native core. |

### Storage (Key-Value)

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| react-native-mmkv | ^4.x | Fast local key-value store for settings and playback preferences | ~30x faster than AsyncStorage for synchronous reads. Use for: last active list, volume preference, onboarding flags. Requires `expo prebuild` and Nitro Modules (`react-native-nitro-modules`). v4+ uses Nitro, fully supports New Architecture. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| expo-av | Deprecated in SDK 53, no patches in SDK 54, removed in SDK 55. Audio.Sound API leaks if not manually unloaded. | expo-audio with `useAudioPlayer` |
| react-native-sound | Unmaintained since 2021, no New Architecture support, known crash on Android with concurrent sounds | expo-audio |
| react-native-track-player | Designed for music players with queues and background playback controls. Significant overhead for a simple tap-to-play soundboard where sounds are short clips. | expo-audio for short clips |
| expo-sharing for targeted WhatsApp | expo-sharing only opens the OS-level share sheet; cannot pre-select WhatsApp. Works as fallback only. | react-native-share `shareSingle` on Android |
| Multiple audio files as combo WhatsApp share | WhatsApp's share intent only accepts one attachment per share action. Sending audio + sticker in one call will fail silently or only send one. | Two sequential shares or present user with choice |
| AsyncStorage for frequent reads | Async only, slower than MMKV for reads on the render path | react-native-mmkv for settings |
| NativeWind | Version compatibility issues with Expo SDK 54 + New Architecture reported; requires careful dependency pinning that adds friction. NativeWind v4.2+ with Tailwind CSS 3 works but is fragile. | React Native StyleSheet or Unistyles for SDK 54 |
| Redux / Redux Toolkit | Excessive boilerplate for a 5-screen app. Soundboard state does not need time-travel debugging. | Zustand + TanStack Query |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| expo-audio | expo-av | Only if on SDK 53 or below (migrate ASAP; SDK 54 is last version with expo-av) |
| react-native-share | Linking API (`whatsapp://send?...`) | Text-only WhatsApp deep links. Does not support file attachments. |
| expo-share-intent | react-native-receive-sharing-intent | If not using Expo managed workflow. expo-share-intent is the Expo-native module equivalent. |
| react-native-mmkv | AsyncStorage | If you cannot run prebuild (e.g., Expo Go testing only). AsyncStorage is acceptable for infrequent reads like auth tokens. |
| TanStack Query | SWR | Both work well; TanStack Query has wider React Native community adoption in 2025 and better offline/optimistic update primitives. |
| Zustand | Jotai | If you need atomic per-component state (Jotai's model). For this app, global soundboard state (active player singleton, current list) maps better to Zustand's store model. |

---

## Installation Commands

```bash
# Migrate audio from expo-av to expo-audio (URGENT — SDK 55 removes expo-av)
npx expo install expo-audio

# Backend
npx expo install @supabase/supabase-js react-native-url-polyfill

# Sharing (requires prebuild, not Expo Go compatible)
npx expo install react-native-share

# State management (not Expo-managed, use npm directly)
npm install zustand @tanstack/react-query

# Fast local storage (requires prebuild + Nitro)
npx expo install react-native-mmkv react-native-nitro-modules

# After adding native modules:
npx expo prebuild --clean
```

---

## Version Compatibility Matrix

| Package | Version in Project | Compatible With | Notes |
|---------|-------------------|-----------------|-------|
| expo | ~54.0.33 | RN 0.81.x | SDK 55 will drop expo-av entirely |
| expo-av | ~16.0.8 | SDK 54 only | **Deprecated. Migrate to expo-audio before SDK 55 upgrade** |
| expo-audio | to install | SDK 53+ | Replaces expo-av Audio; uses `useAudioPlayer` hook |
| expo-share-intent | ^5.1.1 | SDK 54 | Must upgrade to ^6.x when moving to SDK 55 |
| react-native-mmkv | ^4.x | RN New Arch | Requires `react-native-nitro-modules`; prebuild required |
| react-native-share | ^12.2.5 | SDK 54, New Arch | Requires `expo prebuild`; does not work in Expo Go |
| @supabase/supabase-js | ^2.98.x | Any | Needs `react-native-url-polyfill` imported before first supabase call |
| react-native-reanimated | ~4.1.x | RN 0.81, New Arch | v4 is pure New Architecture; no bridging needed |

---

## Stack Patterns by Variant

**If share to WhatsApp on Android (audio-only):**
- Use `react-native-share` `Share.shareSingle({ social: Share.Social.WHATSAPP, url: fileUri })`
- Copy file from Supabase CDN to `FileSystem.documentDirectory` first; share the local URI
- Because WhatsApp requires a locally accessible path, not a remote URL

**If share to WhatsApp on iOS (audio-only):**
- Use `expo-sharing` (`Sharing.shareAsync(localUri)`) — opens system sheet, user taps WhatsApp
- Do NOT use `shareSingle` on iOS for file attachments — known broken behavior
- Warn user to select WhatsApp from the sheet

**If share audio + sticker combo:**
- Implement as two separate share flows presented sequentially
- Audio share first, sticker share second, or allow user to pick audio-only or audio+sticker
- Do not attempt a single share call with two different MIME type files

**If user is receiving an audio from WhatsApp (inbound share intent):**
- `expo-share-intent` handles both iOS Share Extension and Android intent filter
- Hook into `useShareIntent()` in the root layout
- Filter for `shareIntent.type === 'file'` and check `shareIntent.files[0].mimeType.startsWith('audio/')`
- Copy received file to `FileSystem.documentDirectory` before prompting to save

**If playing audio in soundboard grid:**
- Maintain a single `AudioPlayer` ref in Zustand store (the "active player")
- On tap: if active player exists, call `player.seekTo(0)` then immediately call `player.play()` on the new sound
- On Android: starting a new player automatically pauses others (use this behavior)
- On iOS: explicitly pause the previous player before starting new one

---

## Sources

- [Expo SDK 53 changelog — expo-av deprecation confirmed](https://expo.dev/changelog/sdk-53) — HIGH confidence
- [Expo SDK 54 changelog — expo-av SDK 54 is last release](https://expo.dev/changelog/sdk-54) — HIGH confidence
- [expo-audio docs (current)](https://docs.expo.dev/versions/latest/sdk/audio/) — HIGH confidence
- [expo-av docs (current, deprecated notice)](https://docs.expo.dev/versions/latest/sdk/audio-av/) — HIGH confidence
- [expo-share-intent GitHub — version-to-SDK mapping](https://github.com/achorein/expo-share-intent) — HIGH confidence
- [react-native-share npm — v12.2.5 current](https://www.npmjs.com/package/react-native-share) — HIGH confidence
- [react-native-share issue #1699 — iOS file share to WhatsApp broken](https://github.com/react-native-share/react-native-share/issues/1699) — HIGH confidence (open issue, unresolved as of search date)
- [expo-audio GitHub issue #36034 — Android concurrent play behavior](https://github.com/expo/expo/issues/36034) — MEDIUM confidence (GitHub issue thread, not official docs)
- [react-native-mmkv npm — v4.x Nitro-based, New Arch](https://www.npmjs.com/package/react-native-mmkv) — HIGH confidence
- [Supabase React Native quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) — HIGH confidence
- [@supabase/supabase-js v2.98.x current](https://www.npmjs.com/package/@supabase/supabase-js) — MEDIUM confidence (npm registry, verified via search)
- [Galaxies.dev React Native tech stack 2025](https://galaxies.dev/article/react-native-tech-stack-2025) — MEDIUM confidence (community resource)
- [TanStack Query React Native docs](https://tanstack.com/query/latest/docs/framework/react/react-native) — HIGH confidence

---

*Stack research for: YapDeck — mobile soundboard and social audio sharing app*
*Researched: 2026-03-04*
