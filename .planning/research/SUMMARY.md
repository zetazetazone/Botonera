# Project Research Summary

**Project:** YapDeck — Mobile soundboard and social audio sharing app
**Domain:** Mobile soundboard + WhatsApp-first social audio sharing (React Native / Expo + Supabase)
**Researched:** 2026-03-04
**Confidence:** MEDIUM (WhatsApp combo-share behavior is LOW; core stack and architecture are HIGH)

## Executive Summary

YapDeck is a mobile soundboard whose core value proposition is the speed of getting a sound from a personal library into a WhatsApp chat. Research confirms there are no existing competitors that treat WhatsApp as a first-class integration target — all current soundboard apps (Soundboard Studio, Instant Buttons, MyInstants) use the generic OS share sheet. YapDeck's differentiation is real and the market gap is genuine. The recommended build approach is an Expo SDK 54 app on React Native's New Architecture, with Supabase handling auth, Postgres, and Storage, expo-audio replacing the already-deprecated expo-av, react-native-share for outbound WhatsApp targeting, and expo-share-intent for inbound audio capture from WhatsApp.

The recommended architecture is a four-layer stack: Expo Router screens at the top, a services layer (AudioPlayer singleton, FileCacheService, ShareService, SupabaseService) in the middle, Zustand for ephemeral UI state and TanStack Query for server state below that, and Supabase plus the device filesystem at the data layer. This structure is well-documented and maps cleanly to the feature set. The AudioPlayer must be a singleton — creating per-button Sound objects is a known catastrophic failure mode at scale. All audio played or shared must pass through a local file cache; remote CDN URLs must never reach the audio player or the share intent.

The two highest-risk areas both involve WhatsApp platform behavior. First, the audio + sticker "combo share" (a single intent carrying both an audio file and an image to WhatsApp) is NOT reliably achievable on either platform based on confirmed unresolved GitHub issues — the fallback (sequential shares) must be the primary design path, not the fallback. Second, the iOS Share Intent Receiver requires a native Share Extension and cannot be tested in Expo Go at all; the team must move to a custom dev client (EAS Build) before any share intent work begins. A third risk — Opus audio files not playing on iOS 16 and below — requires a transcoding step during audio import that must be built before the Share Intent Receiver is considered complete. These three constraints drive the phase ordering below.

---

## Key Findings

### Recommended Stack

The project already has a solid Expo SDK 54 scaffold with New Architecture enabled. The most urgent change before feature work begins is replacing expo-av (deprecated in SDK 53, last available in SDK 54, removed in SDK 55) with expo-audio using the `useAudioPlayer` hook. react-native-mmkv (v4 Nitro-based) provides fast synchronous storage for UI preferences and replaces AsyncStorage for that use case. Supabase JS v2.x integrates cleanly with React Native when paired with AsyncStorage for session persistence and `react-native-url-polyfill`. For sharing, react-native-share `shareSingle` targets WhatsApp on Android, while expo-sharing (system sheet) is the correct iOS path for file attachments.

**Core technologies:**
- Expo SDK 54 + React Native 0.81.5: App framework — already installed; New Architecture enabled by default
- expo-audio (replaces expo-av): Audio playback — migrate immediately before SDK 55 removes expo-av
- @supabase/supabase-js v2.x: Backend (auth, Postgres, Storage) — single SDK for all backend services
- expo-share-intent v5.x: iOS Share Extension + Android intent filter — inbound WhatsApp audio capture; must match SDK 54
- react-native-share v12.x: Outbound WhatsApp targeting — `shareSingle` on Android; expo-sharing is the iOS fallback
- Zustand v5 + TanStack Query v5: State management — Zustand for ephemeral UI state, TanStack Query for all server state
- react-native-reanimated v4 + react-native-gesture-handler v2.28: UI interactions — already installed; v4 is New Architecture native
- react-native-mmkv v4: Fast local KV store for settings — 30x faster than AsyncStorage for synchronous reads; requires prebuild

**Critical version constraint:** expo-share-intent must remain at v5.x for SDK 54. Upgrading to SDK 55 requires bumping it to v6.x simultaneously. Do not upgrade either independently.

### Expected Features

The competitor analysis confirms YapDeck's differentiators (direct WhatsApp targeting, Share Intent Receiver, sticker pairing, clone/follow lists) are genuinely absent from all reviewed competitors. The full feature dependency chain means all social features gate on authentication, all sharing gates on audio import and local caching, and the Explore tab gates on share_count tracking being wired from day one.

**Must have (table stakes):**
- Tap-to-play soundboard grid with stop-and-restart — the core interaction; overlapping audio is unacceptable
- Audio import from device (.opus, .m4a minimum) — content creation entry point
- Local file cache for offline playback — required for real-world use cases (parties, transit)
- Named buttons with thumbnail images — grid is unusable without visual identity at scale
- Multiple lists / boards — single-board app feels incomplete; all competitors support this
- User authentication (email + OAuth) — gates all personalized and social features
- One-tap share audio to WhatsApp — the entire product value proposition
- Haptic feedback on tap — expected in any tappable media app; expo-haptics already installed
- Audio format support (.opus, .m4a) — WhatsApp's native formats must be importable
- Offline playback after first load — cache to documentDirectory (not cacheDirectory, which OS can clear)

**Should have (differentiators):**
- Share Intent Receiver (accept audio FROM WhatsApp) — closes the capture loop; genuinely unique to YapDeck
- Sticker pairing per audio — unique differentiator; design with audio-only share as primary fallback
- Explore tab with trending sounds (share_count ranked) — social discovery layer; must track share_count from day one
- Clone public lists — viral growth mechanism; reference clone using same AudioItem rows
- User profiles (username, avatar) — required for public attribution
- Follow public lists — add once retention data shows repeat visits to specific creators
- Favorites / quick-access tray — add when personal libraries grow beyond ~40 sounds
- Search within personal library — client-side filter acceptable for small libraries

**Defer (v2+):**
- In-app audio recording — mic permission, recording UI, format decisions; import covers 90% of capture
- Collaborative list editing — data model supports it (is_collaborative field); implement post-PMF
- Video support — separate codec stack, WhatsApp already handles video natively
- Monetization / paid sound marketplace — requires payment rails; premature pre-PMF
- Animated waveform visualizer during playback — high CPU in grid layout; provides zero functional value

### Architecture Approach

The recommended architecture separates concerns cleanly into four layers: Expo Router screens (thin route files importing from screens/), a services layer with no React (AudioPlayer singleton, FileCacheService, ShareService, SupabaseService), a state layer (Zustand for ephemeral UI state like currentlyPlayingId, TanStack Query for all server state), and a data layer (Supabase Postgres + Storage + Auth, device filesystem via expo-file-system). The key rule: if state derives from the server or needs persistence across sessions, it belongs in TanStack Query. If state is "what is the UI doing right now," it belongs in Zustand. Components never import Supabase directly — always through hooks that wrap TanStack Query.

**Major components:**
1. AudioPlayer singleton (services/audio-player.ts) — owns a single Sound object for the app lifetime; all play/stop calls route through it to prevent concurrent audio and resource accumulation
2. FileCacheService (services/file-cache.ts) — all audio access goes through cache check first; downloads to FileSystem.documentDirectory (not cacheDirectory) on miss; ShareService depends on this being called before any share action
3. ShareService (services/share.ts) — outbound WhatsApp sharing; always calls FileCacheService first; uses react-native-share on Android, expo-sharing on iOS
4. SupabaseService (services/supabase.ts) — all Supabase calls (auth, CRUD, storage upload, share_count increment); components never call Supabase directly
5. Share Intent Receiver (app/share-receiver.tsx + app/+native-intent.ts) — inbound audio from WhatsApp; copies temp file to persistent storage immediately before any UI is shown
6. playerStore (Zustand) — currentlyPlayingId and isBuffering; drives highlighting across grid without prop drilling
7. TanStack Query hooks (hooks/) — all data fetching; never import services directly in components

**Build order implied by architecture dependencies:**
Supabase client + schema types → FileCacheService → AudioPlayer singleton → Core Soundboard UI → Supabase data hooks → Share Intent Receiver → Outbound WhatsApp share → Explore tab

### Critical Pitfalls

1. **iOS Share Intent Receiver requires a custom dev client — not testable in Expo Go.** Expo Go cannot host native Share Extension targets. Switch to EAS Build (custom dev client) before starting any share intent work. Configure App Group entitlement in app.json at project start. Do not discover this mid-feature-development.

2. **Android audio sharing fails silently with file:// URIs.** Android's scoped storage (strict since Android 10+) blocks apps from sharing file:// URIs to external apps. WhatsApp rejects these silently on real devices (emulators are tolerant, masking the bug). react-native-share handles this via FileProvider if configured correctly — filepaths.xml must cover the exact cache paths used. Mandatory exit criterion: audio share tested on a real physical Android device with WhatsApp installed.

3. **WhatsApp does not accept audio + image in a single share intent.** ACTION_SEND_MULTIPLE with mixed MIME types is not a documented WhatsApp use case and fails silently. The sticker-audio "combo share" must be designed as two sequential shares from the start. Validate the combo intent on real devices in a technical spike before committing to UX designs for it.

4. **expo-av Sound objects accumulate and audio stops working after ~30-50 taps.** Audio.Sound.createAsync() allocates native resources that are not garbage-collected without explicit unloadAsync() calls. The fix is a singleton Sound object reference — stop + seek to zero on retap of the same sound, create a new object only when switching clips. Verify with a stress test (30 rapid taps across different sounds) as part of soundboard phase exit criteria.

5. **Opus files (.opus from WhatsApp) are not natively playable on iOS 16 and below.** iOS's AVFoundation does not support bare Opus outside specific container formats on iOS < 17. Transcode incoming .opus files to .m4a (AAC) during the share-intent-to-save flow. This must be part of the Share Intent Receiver phase, not deferred.

6. **Supabase private bucket signed URLs expire (1 hour default) and break cached audio references.** Audio files should be stored in a public Supabase Storage bucket — audio is content users choose to share publicly, so privacy is not a concern. Public bucket URLs are permanent CDN URLs. This bucket policy decision must be made before any upload code is written.

7. **Reference-only cloned lists break when creators delete audio.** Implement soft deletes on AudioItem records (is_deleted boolean + deleted_at timestamp) and block Storage object deletion while any ListAudios rows reference it. This must be in the schema from day one — retrofitting soft deletes after data exists is expensive.

---

## Implications for Roadmap

Based on research, the dependency graph and pitfall-prevention requirements dictate the following phase structure. Architecture research explicitly defines a build order; this aligns with it.

### Phase 1: Foundation and Environment Setup

**Rationale:** Everything else depends on Supabase being configured, expo-av being replaced, and a custom dev client being available. The signed URL / public bucket decision and soft-delete schema must be made before any upload code is written. Discovering Expo Go limitations during Share Intent work (Pitfall 1) would be expensive.

**Delivers:** Runnable custom dev client build, Supabase project with correct schema (public audio bucket, soft-delete columns, RLS policies, indexes), expo-audio replacing expo-av, Supabase client with AsyncStorage session, TanStack Query client, Zustand stores stubbed, TypeScript types generated from schema.

**Addresses:** Audio import prerequisites, authentication prerequisites, all social feature prerequisites.

**Avoids:** Signed URL expiry breaking cached audio (Pitfall 6), reference-clone breakage from missing soft-delete (Pitfall 7), discovering Expo Go limitations during Share Intent work (Pitfall 1).

**Research flag:** Standard patterns — well-documented Expo + Supabase setup. Skip `/gsd:research-phase`.

---

### Phase 2: Core Soundboard Playback

**Rationale:** AudioPlayer singleton and FileCacheService are dependencies for both sharing and the Share Intent Receiver. Building the core tap-to-play experience first validates the audio architecture before wiring in network calls or sharing. Stress-testing the AudioPlayer here (before it is called from 10 places) catches the sound-object accumulation pitfall early.

**Delivers:** AudioPlayer singleton using expo-audio `useAudioPlayer`, FileCacheService with documentDirectory caching, soundboard grid UI (AudioButton component with haptics, scale animation, playing state highlight), multiple lists/boards, named buttons with thumbnails, stop-and-restart tap behavior.

**Addresses:** Tap-to-play grid (P1), named buttons with thumbnails (P1), multiple lists (P1), offline playback (P1), haptic feedback (P1), local file cache (P1).

**Avoids:** Sound object accumulation causing audio failure after sustained use (Pitfall 4). Exit criterion: stress test — 30 rapid taps across different sounds without audio failure.

**Research flag:** Standard patterns — well-documented. Skip `/gsd:research-phase`.

---

### Phase 3: Authentication and Supabase Data Layer

**Rationale:** Auth gates all personalized features. Once the local soundboard works, wiring Supabase data (lists, audio items, upload) and auth enables the full personal library experience. share_count tracking must be wired into this phase (not the Explore phase) so data accumulates from first use.

**Delivers:** Supabase Auth (email + Google/Apple OAuth) with deep link configuration for both dev and production redirect URLs, audio import from device files with upload to Supabase Storage, CRUD for lists and audio items via TanStack Query hooks, share_count increment on every successful share (fire-and-forget), user profile (username, avatar).

**Addresses:** User authentication (P1), audio import (P1), multiple lists data persistence (P1), user profiles (P1), share_count data for future Explore tab.

**Avoids:** Auth redirect URL mismatch (Integration Gotcha in PITFALLS.md — register both exp:// and yapdeck:// schemes in Supabase dashboard). Exit criterion: full OAuth round-trip tested on physical device.

**Research flag:** Auth deep linking and Google/Apple OAuth for React Native has known edge cases. Consider `/gsd:research-phase` specifically for OAuth redirect configuration on both platforms.

---

### Phase 4: WhatsApp Combo Share Technical Spike

**Rationale:** PITFALLS.md is explicit: validate the audio + sticker combo share on real devices BEFORE building any UX for it. This is a one-day spike that determines whether the core differentiator UX is sequential shares or a true combo. Discovering this during the full sharing phase would require rework of UX designs. The spike result directly informs Phase 5 design decisions.

**Delivers:** Confirmed answer on whether a single WhatsApp intent can carry audio + image on current WhatsApp versions on both iOS and Android. Decision on primary share UX (sequential or combo). If combo fails (expected per research), sequential share flow design locked.

**Addresses:** WhatsApp combo intent constraint (Pitfall 3), sticker pairing UX design.

**Avoids:** Investing in combo-share UX designs that must be thrown away (PITFALLS.md explicitly warns against this).

**Research flag:** This IS the research. Run as a technical spike, not a full feature phase. Result gates Phase 5 design decisions.

---

### Phase 5: Outbound WhatsApp Sharing

**Rationale:** Depends on FileCacheService (Phase 2), auth + data layer (Phase 3), and the combo-share spike result (Phase 4). This is the core product value proposition — the app is not useful without it.

**Delivers:** One-tap share audio to WhatsApp using react-native-share on Android (content:// URI via FileProvider) and expo-sharing on iOS (system sheet), sticker pairing UI (stored as sticker_id FK on AudioItem), share UI with loading state and explicit error handling for WhatsApp-not-installed case, share_count increment confirmed working.

**Addresses:** Share audio to WhatsApp (P1), sticker pairing (P1).

**Avoids:** Android file:// URI failure (Pitfall 2) — mandatory exit criterion: share tested on real physical Android device with WhatsApp. Share action with no loading state (UX Pitfalls in PITFALLS.md).

**Research flag:** react-native-share FileProvider configuration has known complexity. Consider `/gsd:research-phase` for Android FileProvider config specifics.

---

### Phase 6: Share Intent Receiver (Inbound from WhatsApp)

**Rationale:** Requires a custom dev client (established in Phase 1) and the Supabase upload path (Phase 3). This is the highest-complexity single feature — iOS Share Extension is a separate process, Opus transcoding is required, and the temp file must be copied immediately. Keeping it as a dedicated phase ensures proper testing time on both platforms.

**Delivers:** iOS Share Extension via expo-share-intent v5.x, Android intent filter for audio/*, +native-intent.ts Expo Router hook, ShareReceiverScreen with immediate file copy to documentDirectory, Opus-to-m4a transcoding for iOS compatibility, name + list assignment UI, upload to Supabase on save.

**Addresses:** Share Intent Receiver (P1), receive-and-save WhatsApp audio flow, Opus audio format support.

**Avoids:** iOS Share Extension requiring custom dev client (Pitfall 1 — already resolved in Phase 1), Opus non-playable on iOS 16 (Pitfall 5 — transcoding step is part of this phase's definition of done), temp file disappearing before user finishes form (Anti-Pattern 3 in ARCHITECTURE.md — copy immediately in useEffect before rendering form). Exit criterion: received .opus file from WhatsApp plays on iOS 16 simulator after import.

**Research flag:** iOS App Group entitlement configuration and EAS multi-target builds have known issues. Run `/gsd:research-phase` for this phase — it is the most sparsely documented area with active open GitHub issues.

---

### Phase 7: Explore Tab and Social Features

**Rationale:** Purely read-only from a services perspective — no new service layer code needed, only a new Supabase query and UI. share_count data has been accumulating since Phase 3. Clone lists and follow lists depend on the existing data model. This is the growth and retention layer.

**Delivers:** Explore tab with trending audio items (SELECT WHERE is_public ORDER BY share_count DESC, indexed from Phase 1), public list discovery, one-tap clone list (reference clone, same AudioItem rows), follow lists (subscription pattern), per-list theme colors.

**Addresses:** Explore tab / trending (P1), clone public lists (P1), follow public lists (P2), per-list theme colors (P2).

**Avoids:** Reference clone breakage when creator deletes audio (Pitfall 7 — soft-delete schema from Phase 1 prevents this). Explore query performance (CREATE INDEX idx_audio_share_count from Phase 1 schema).

**Research flag:** Standard patterns — read-only Supabase queries, well-documented. Skip `/gsd:research-phase`.

---

### Phase 8: Polish and v1.x Features

**Rationale:** Post-launch additions driven by user behavior data. Each feature here is explicitly deferred until retention and usage patterns are observed.

**Delivers:** Favorites / quick-access tray (when library exceeds ~40 sounds), search within personal library (client-side filter), audio trim (start/end points), push notifications for followed list updates.

**Addresses:** Favorites (P2), search library (P2), audio trim (P2), push notifications (P2).

**Research flag:** Push notifications require APNS + FCM setup. Run `/gsd:research-phase` if/when push notifications are prioritized.

---

### Phase Ordering Rationale

- **Foundation before all else** because Supabase schema decisions (public bucket, soft-delete columns, indexes) cannot be retroactively fixed without data migrations, and the custom dev client must exist before Share Intent work begins.
- **Core playback before networking** because the AudioPlayer singleton and FileCacheService are dependencies of both ShareService and the Share Intent Receiver; validating them independently prevents integration surprises.
- **Auth before social features** because lists, audio items, Explore, and clone all require user identity.
- **Combo-share spike before sharing UX** because the spike result determines whether the sharing UX is one action or two — committing to UX designs before this is answered is waste.
- **Outbound share before inbound** because outbound uses already-established services (FileCacheService, Supabase data layer) while inbound (Share Intent Receiver) requires the most novel native configuration and its own dedicated testing time.
- **Explore last** because it is purely read-only, requires share_count data that accumulates naturally, and has no unresolved technical unknowns.

### Research Flags

Phases likely needing `/gsd:research-phase` during planning:

- **Phase 3 (Auth):** Google OAuth and Apple Sign-In redirect URL configuration for React Native has known Supabase-specific edge cases (supabase-js #1429, multiple scheme registration). Worth a targeted research spike before implementation.
- **Phase 5 (Outbound Sharing):** react-native-share FileProvider configuration on Android is underdocumented; file:// vs content:// URI handling has broken builds silently.
- **Phase 6 (Share Intent Receiver):** Highest-complexity feature in the entire app. iOS App Group entitlements, EAS multi-target builds, and Opus transcoding all have open issues. This phase warrants the most thorough pre-implementation research of any phase.

Phases with standard patterns (skip `/gsd:research-phase`):

- **Phase 1 (Foundation):** Expo + Supabase setup is exhaustively documented by both Expo and Supabase official docs.
- **Phase 2 (Core Soundboard):** AudioPlayer singleton pattern is well-documented; expo-audio migration path is clear.
- **Phase 7 (Explore + Social):** Supabase read queries, reference clones as join table inserts, and follow subscriptions are all standard patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core choices (expo-audio, Supabase, react-native-share, expo-share-intent) verified against official changelogs and npm. Version compatibility matrix confirmed. Only uncertainty is WhatsApp share behavior, which is a WhatsApp constraint, not a stack choice. |
| Features | MEDIUM | Table stakes and differentiators are well-defined. Competitor analysis confirms market gap. WhatsApp combo-share behavior (audio + sticker in one intent) is LOW confidence — two unresolved GitHub issues (#1524, #1699) suggest it is reliably broken, but current WhatsApp versions were not tested directly. |
| Architecture | MEDIUM-HIGH | Four-layer architecture, singleton patterns, and data flow are well-documented and validated by community articles. Share Intent Receiver iOS process model is confirmed by official expo-share-intent docs. Main uncertainty is the specific EAS multi-target build configuration for iOS Share Extensions. |
| Pitfalls | MEDIUM | Critical pitfalls (Expo Go limitation, Android file:// URI, sound object accumulation, signed URL expiry) are documented in official sources or high-confidence GitHub issues. Opus iOS limitation is confirmed by codec documentation. Combo-share failure is confirmed by unresolved issues but not by authoritative WhatsApp developer documentation. |

**Overall confidence:** MEDIUM-HIGH

The core architecture and stack are well-understood. The two genuine unknowns — combo-share multi-attachment intent behavior and iOS Share Extension EAS build configuration specifics — are both addressed by the phase structure: the combo-share spike (Phase 4) resolves the first before UX is designed, and the `/gsd:research-phase` flag on Phase 6 addresses the second before native implementation begins.

### Gaps to Address

- **WhatsApp combo-share current behavior:** Research confirms it is unreliable based on 2023-2024 GitHub issues, but WhatsApp updates frequently. The Phase 4 spike should test against the WhatsApp version current at implementation time. Do not assume it is permanently broken — just design the fallback as primary.
- **Opus transcoding library selection:** PITFALLS.md mentions `react-native-audio-transcoder` or FFmpeg-based solutions but does not evaluate them against Expo SDK 54 New Architecture compatibility. This must be evaluated during Phase 6 research.
- **EAS build multi-target provisioning:** expo-share-intent requires a separate provisioning profile for the Share Extension target. The exact EAS `eas.json` configuration for this is not fully documented in the research. Phase 6 `/gsd:research-phase` should specifically target this.
- **Android Opus native playback:** STACK.md notes Android handles .opus natively, but PITFALLS.md only addresses the iOS transcoding problem. If the Share Intent Receiver accepts .opus files, verify Android playback with expo-audio before shipping.

---

## Sources

### Primary (HIGH confidence)

- Expo SDK 53/54 changelogs — expo-av deprecation timeline confirmed
- expo-audio official docs — `useAudioPlayer` hook API and migration path
- expo-share-intent GitHub (achorein) — version-to-SDK mapping, App Group requirements
- react-native-share npm / docs — v12.x API, social targeting, FileProvider requirement
- Supabase React Native quickstart — AsyncStorage session configuration
- Supabase Storage CDN docs — public vs. private bucket behavior, signed URL TTL
- Supabase RLS docs — row-level security policies
- expo-file-system docs — documentDirectory vs. cacheDirectory persistence guarantees
- TanStack Query React Native docs — offline and invalidation patterns
- Expo App folder structure best practices — file-based routing conventions

### Secondary (MEDIUM confidence)

- GitHub issue expo/expo #36034 — Android AudioPlayer concurrent play behavior (expo-audio)
- GitHub issue react-native-share #1699 — iOS file share to WhatsApp broken for audio
- Fintech Mobile Architecture article (Medium, Feb 2026) — Zustand + TanStack Query + Supabase pattern validation
- expo-share-intent DeepWiki architecture — iOS Share Extension process model
- Supporting iOS Share Extensions on React Native (devas.life) — iOS App Group data passing
- iOS App Groups setup guide — extension-to-app data sharing mechanism

### Tertiary (LOW confidence)

- GitHub issue react-native-share #1524 — audio + image combo share to WhatsApp on iOS (closed stale, unresolved) — combo-share unreliability
- GitHub issue react-native-share #1460 — file + message sharing to WhatsApp broken on iOS 16.6+ — corroborates iOS file share limitations
- Opus Audio Codec FAQ — iOS pre-17 Opus playback constraints
- Galaxies.dev React Native tech stack 2025 — community consensus for Zustand + TanStack Query

---

*Research completed: 2026-03-04*
*Ready for roadmap: yes*
