# Architecture Research

**Domain:** Mobile soundboard + audio sharing social app (React Native / Expo + Supabase)
**Researched:** 2026-03-04
**Confidence:** MEDIUM-HIGH

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                                │
│                      (Expo Router / React Native)                        │
├────────────────┬─────────────────┬─────────────────┬────────────────────┤
│   Soundboard   │    Explore      │    Profile /    │   Share Intent     │
│   Tab (lists   │    Tab (public  │    Auth         │   Receiver Screen  │
│   + grid)      │    trending)    │    Screens      │   (inbound share)  │
└───────┬────────┴────────┬────────┴────────┬────────┴──────────┬─────────┘
        │                 │                 │                   │
┌───────▼─────────────────▼─────────────────▼───────────────────▼─────────┐
│                         SERVICE / HOOK LAYER                             │
├──────────────┬───────────────┬──────────────┬──────────────────────────┤
│  AudioPlayer  │  ShareService │  FileCache   │  SupabaseService         │
│  (singleton   │  (outbound    │  Service     │  (auth, audio metadata,  │
│  expo-av)     │  to WhatsApp) │  (expo-fs)   │   lists, social)         │
└──────────────┴───────────────┴──────────────┴──────────────────────────┘
        │                                              │
┌───────▼──────────────────────────────────────────────▼──────────────────┐
│                        STATE LAYER                                       │
├─────────────────────────┬────────────────────────────────────────────────┤
│  Zustand Stores          │  TanStack Query Cache                         │
│  - playerStore           │  - audio metadata (lists, items, explore)     │
│  - uiStore               │  - user profile                               │
│  (ephemeral UI state)    │  (server state, auto-invalidated)             │
└─────────────────────────┴────────────────────────────────────────────────┘
        │                                              │
┌───────▼──────────────────────────────────────────────▼──────────────────┐
│                       DATA / EXTERNAL LAYER                              │
├──────────────┬───────────────────────────────────────────────────────────┤
│  Device FS   │  Supabase (Postgres + Storage + Auth)                     │
│  (app docs   │  - audio_items table          - audio bucket (public CDN) │
│   directory) │  - soundboard_lists table     - avatars bucket            │
│              │  - list_audios join table     - stickers bucket           │
│              │  - users table                                            │
│              │  RLS policies on all tables                               │
└──────────────┴───────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| Soundboard Tab | Display user's lists and audio grids, trigger playback + share | AudioPlayer, ShareService, SupabaseService |
| Explore Tab | Show trending audio_items (by share_count) and popular public lists | SupabaseService (read-only, no auth required for browse) |
| Share Intent Receiver Screen | Accept inbound audio from WhatsApp, prompt to name + assign to list, trigger upload | FileCacheService, SupabaseService |
| AudioPlayer (singleton) | Own the single expo-av Sound object; stop current before starting next | playerStore |
| ShareService | Copy cached file to temp, call react-native-share.shareSingle targeting WhatsApp | FileCacheService |
| FileCacheService | Download audio from Supabase Storage URLs to app document directory; manage filenames | expo-file-system, Supabase Storage |
| SupabaseService | Auth session, CRUD for audio_items / lists / list_audios, increment counters | Supabase SDK |
| playerStore (Zustand) | currentlyPlayingId, isPlaying — drives UI highlighting across grid | AudioPlayer |
| TanStack Query | Server-state cache: lists, audio items, explore feed; invalidation on mutations | SupabaseService |

---

## Recommended Project Structure

```
src/
├── app/                          # Expo Router file-based routes
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator definition
│   │   ├── index.tsx             # Soundboard tab (my lists)
│   │   ├── explore.tsx           # Explore/trending tab
│   │   └── profile.tsx           # Profile + settings
│   ├── list/[id].tsx             # Soundboard grid for a specific list
│   ├── audio/new.tsx             # Create audio flow (pick, name, upload)
│   ├── share-receiver.tsx        # Inbound share intent handler screen
│   ├── auth/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── +native-intent.ts         # expo-share-intent deep link router hook
│
├── screens/                      # Screen-level components (not routes)
│   ├── SoundboardGridScreen.tsx
│   ├── ExploreScreen.tsx
│   └── ShareReceiverScreen.tsx
│
├── components/                   # Reusable UI components
│   ├── audio-button/
│   │   ├── index.tsx             # Tap-to-play soundboard button
│   │   └── audio-button.styles.ts
│   ├── list-card/
│   ├── audio-upload-sheet/       # Bottom sheet for upload flow
│   └── sticker-picker/
│
├── services/                     # Business logic, no UI
│   ├── audio-player.ts           # Singleton expo-av wrapper
│   ├── file-cache.ts             # Download + persist audio files
│   ├── share.ts                  # Outbound WhatsApp sharing
│   └── supabase.ts               # Supabase client + typed helpers
│
├── hooks/                        # Data fetching hooks (TanStack Query)
│   ├── useMyLists.ts
│   ├── useListAudios.ts
│   ├── useExplore.ts
│   └── useShareIntent.ts         # Wraps expo-share-intent listener
│
├── stores/                       # Zustand ephemeral state
│   ├── player-store.ts           # currentlyPlayingId, isPlaying
│   └── ui-store.ts               # modals, sheet visibility
│
├── lib/                          # Config and utilities
│   ├── supabase-client.ts        # createClient, session storage
│   ├── query-client.ts           # TanStack Query client config
│   └── constants.ts              # WHATSAPP_PACKAGE_ID, mime types, etc.
│
└── types/                        # Shared TypeScript types
    ├── database.types.ts         # Generated from Supabase schema
    └── app.types.ts              # AudioItem, SoundboardList, etc.
```

### Structure Rationale

- **app/:** Expo Router owns routing; keep route files thin — they import from screens/.
- **screens/:** Complex screen logic lives here, not in route files, so it doesn't accidentally create routes.
- **services/:** Pure business logic with no React. AudioPlayer singleton lives here — one instance for the app lifetime.
- **hooks/:** All data fetching through TanStack Query hooks. Components never call supabase directly.
- **stores/:** Zustand for local ephemeral UI state only (what is currently playing, which modal is open). Server state lives in TanStack Query.
- **+native-intent.ts:** Required by expo-share-intent with Expo Router to intercept the deep link and redirect to share-receiver screen.

---

## Architectural Patterns

### Pattern 1: AudioPlayer Singleton

**What:** A single `Audio.Sound` object (expo-av) owned at the service layer, not inside any React component. All play/stop calls go through `audioPlayer.play(uri)`, which stops the current sound before loading the new one.

**When to use:** Required for soundboard UX — rapid taps on different buttons must stop any in-flight audio immediately. React component lifecycle cannot reliably manage this because buttons unmount when lists scroll.

**Trade-offs:** Singleton means global state; easier to reason about for a soundboard than per-component sound objects. Not suitable for apps needing concurrent audio (music player with crossfade, etc.).

**Example:**
```typescript
// src/services/audio-player.ts
import { Audio } from 'expo-av';

let currentSound: Audio.Sound | null = null;

export const audioPlayer = {
  async play(localUri: string): Promise<void> {
    // Stop and unload any existing sound first
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: localUri },
      { shouldPlay: true }
    );
    currentSound = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        usePlayerStore.getState().setPlaying(null);
      }
    });
  },

  async stop(): Promise<void> {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }
  },
};
```

### Pattern 2: Cache-First Audio File Access

**What:** Before playing an audio item, check if the file exists at a known local path (`FileSystem.documentDirectory + audioId + ext`). If yes, play from local. If no, download from Supabase Storage URL then play.

**When to use:** Every audio playback call. This makes the soundboard usable in poor network conditions and prevents re-downloading the same file on every tap.

**Trade-offs:** Disk space grows with collection size. Accept this trade-off for v1 — soundboard clips are small (seconds-long voice notes). Add eviction logic post-launch if needed.

**Example:**
```typescript
// src/services/file-cache.ts
import * as FileSystem from 'expo-file-system';

export async function getLocalUri(audioId: string, remoteUrl: string, ext = 'm4a'): Promise<string> {
  const localPath = `${FileSystem.documentDirectory}audio/${audioId}.${ext}`;
  const info = await FileSystem.getInfoAsync(localPath);

  if (info.exists) {
    return localPath;
  }

  // Ensure directory exists
  await FileSystem.makeDirectoryAsync(
    `${FileSystem.documentDirectory}audio/`,
    { intermediates: true }
  );

  const result = await FileSystem.downloadAsync(remoteUrl, localPath);
  if (result.status !== 200) {
    throw new Error(`Download failed for audio ${audioId}`);
  }
  return localPath;
}
```

### Pattern 3: Share Intent Receiver Flow

**What:** expo-share-intent registers as an iOS Share Extension and Android Intent Filter for `audio/*` MIME types. When the user shares an audio from WhatsApp, the OS redirects to the app. The `+native-intent.ts` hook catches the deep link and navigates to `/share-receiver`. That screen reads the intent, copies the temp file to the cache directory, prompts for a name + list assignment, then uploads to Supabase.

**When to use:** This is the only correct approach for Expo managed workflow without ejecting. The alternative (custom iOS Share Extension with MaxAst/expo-share-extension) allows a native UI in the share sheet but is unnecessary for this use case.

**Key constraint:** On iOS, the file provided by the Share Extension is in a temporary container and MUST be copied immediately (before the screen is dismissed from memory). Copy to `FileSystem.documentDirectory` as the first action.

**Example:**
```typescript
// src/app/+native-intent.ts  (Expo Router)
import { useShareIntentContext } from 'expo-share-intent';

export function useShareIntent() {
  // expo-share-intent reads from the deep link and
  // exposes shareIntent.files[0] with { path, mimeType, fileName }
  // Redirect to the receiver screen
}

// src/app/share-receiver.tsx
export default function ShareReceiverScreen() {
  const { shareIntent, resetShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (shareIntent?.files?.[0]) {
      const file = shareIntent.files[0];
      // 1. Copy temp file to persistent storage immediately
      fileCacheService.persistInboundFile(file.path, file.fileName);
      // 2. Show UI to name clip and choose list
    }
  }, [shareIntent]);
}
```

### Pattern 4: Outbound Share to WhatsApp

**What:** To share an audio (+ optional sticker) to WhatsApp: ensure the audio is cached locally, then call `react-native-share`'s `Share.open()` with `type: 'audio/m4a'` and optionally `urls: [audioPath, stickerPath]`. Target WhatsApp with `social: Share.Social.WHATSAPP`.

**When to use:** This is the primary social action. Use `Share.open()` (system sheet) over `Share.shareSingle()` because `shareSingle` has documented instability with audio files on iOS.

**Known limitation — combo send:** WhatsApp does not accept two attachments in a single share intent. Sending audio + sticker simultaneously as one "combo" is NOT reliably possible via system share. The fallback is to share audio only, and mention sticker separately in the text field (or do two sequential shares). This must be validated during Phase 1 implementation.

**Example:**
```typescript
// src/services/share.ts
import Share from 'react-native-share';

export async function shareToWhatsApp(audioLocalUri: string, caption?: string): Promise<void> {
  await Share.open({
    url: audioLocalUri,
    type: 'audio/m4a',
    message: caption,
    social: Share.Social.WHATSAPP,
    // Targeting com.whatsapp ensures it doesn't fall back to WhatsApp Business
  });
}
```

---

## Data Flow

### Core Flows

**1. Tap Audio Button (happy path — already cached)**
```
User taps AudioButton
    ↓
Component calls audioPlayer.play(audioItem.id)
    ↓
fileCacheService.getLocalUri(id, remoteUrl) → returns local path (cache hit)
    ↓
audioPlayer.stop() → audioPlayer.load(localPath) → audioPlayer.play()
    ↓
playerStore.setPlaying(audioItem.id)
    ↓
All AudioButton components re-render; active button gets highlight
    ↓
Playback completes → playerStore.setPlaying(null)
```

**2. Tap Audio Button (cache miss — first play)**
```
User taps AudioButton
    ↓
fileCacheService.getLocalUri() → local path not found
    ↓
FileSystem.downloadAsync(supabaseStorageUrl, localPath)
    [Supabase CDN serves from nearest edge node]
    ↓
File written to FileSystem.documentDirectory/audio/<id>.m4a
    ↓
audioPlayer.play(localPath) → playerStore.setPlaying(id)
```

**3. Share Audio to WhatsApp**
```
User long-presses or taps share button on AudioButton
    ↓
ShareService.shareToWhatsApp(audioItem)
    ↓
fileCacheService.getLocalUri() ensures file is local
    ↓
react-native-share.Share.open({ url: localUri, social: WHATSAPP })
    ↓
OS hands off to WhatsApp — app is backgrounded
    ↓
On return: SupabaseService.incrementShareCount(audioItem.id)
    [fire-and-forget, no UI dependency]
    ↓
TanStack Query invalidates ['audio', id] to reflect updated share_count
```

**4. Receive Audio from WhatsApp (Share Intent)**
```
User shares audio FROM WhatsApp TO YapDeck
    ↓
iOS: Share Extension captures file → writes to App Group container
     Deep link (yapdeck://share-intent) → OS opens main app
Android: Intent Filter matches audio/* → MainActivity receives intent
    ↓
expo-share-intent normalizes to ShareIntent object
+native-intent.ts routes to /share-receiver
    ↓
ShareReceiverScreen reads shareIntent.files[0]
    ↓
fileCacheService.persistInboundFile(tempPath) — COPY IMMEDIATELY
    [tempPath is ephemeral; must copy before app goes to background]
    ↓
User inputs: title, sticker (optional), target list
    ↓
SupabaseService.uploadAudio(persistedLocalPath) → Supabase Storage
SupabaseService.createAudioItem({ title, audio_url, ... })
SupabaseService.addToList(listId, newAudioItem.id)
    ↓
TanStack Query invalidates ['lists', listId] → Soundboard tab refreshes
resetShareIntent() → navigate back to Soundboard tab
```

**5. Explore Tab — Trending Feed**
```
User opens Explore tab
    ↓
useExplore() hook calls SupabaseService.getTrending()
    [SELECT * FROM audio_items WHERE is_public=true ORDER BY share_count DESC LIMIT 20]
    [No auth required — public bucket + RLS allows anonymous read]
    ↓
TanStack Query caches result (staleTime: 5 minutes)
    ↓
User taps Clone List
    ↓
SupabaseService.cloneList(listId) — creates new SoundboardList
  + inserts ListAudios rows pointing to SAME audio_item ids (reference clone)
    ↓
No audio files copied — same Supabase Storage URLs reused
TanStack Query invalidates ['my-lists']
```

### State Management Split

```
TanStack Query (server state)          Zustand (ephemeral UI state)
─────────────────────────────          ─────────────────────────────
audio_items (metadata, URLs)           currentlyPlayingId
soundboard_lists (user's lists)        isBuffering
explore feed (trending)                activeListId (navigation context)
user profile                           shareSheetOpen
                                       uploadProgress
```

The key rule: if state derives from the server or needs persistence across sessions, it belongs in TanStack Query. If state is "what is the UI doing right now," it belongs in Zustand.

---

## Component Boundaries

| Boundary | Communication Method | Direction | Notes |
|----------|---------------------|-----------|-------|
| Screen → Hook | React hook call | Screen calls hook | Screen never imports supabase directly |
| Hook → SupabaseService | Function call | Hook calls service | Service functions are async, typed |
| SupabaseService → Supabase SDK | Supabase JS client | Unidirectional | Wrap in try/catch; translate errors to domain errors |
| AudioButton → AudioPlayer | Service call (not hook) | Component calls singleton | audioPlayer is imported as module-level singleton |
| AudioPlayer → playerStore | Zustand set() | AudioPlayer writes, components read | Avoids prop-drilling play state |
| Share Intent → App | OS deep link | OS → expo-share-intent → JS | +native-intent.ts is the entry point |
| FileCacheService → Supabase Storage | HTTPS download via expo-file-system | One-way pull | Never write to Supabase from FileCacheService directly |

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | Supabase JS SDK, AsyncStorage session | Must configure AsyncStorage for session persistence in RN |
| Supabase Postgres | Supabase JS SDK (typed queries) | Generate types from schema: `supabase gen types typescript` |
| Supabase Storage | Direct URL download via expo-file-system; upload via supabase.storage.from().upload() | Use public bucket for audio files to get CDN hit rate |
| WhatsApp (outbound) | react-native-share Share.open() | Requires custom dev client (not Expo Go) |
| WhatsApp (inbound) | expo-share-intent config plugin | Requires custom dev client; iOS also needs App Group entitlement |
| expo-av | Module-level singleton wrapper | Configure Audio.setAudioModeAsync once at app startup |

### Internal Module Boundaries

| Boundary | Communication | Rule |
|----------|---------------|------|
| Screens ↔ Services | Hooks only (no direct service imports in components) | Keeps components testable |
| AudioPlayer ↔ Components | Zustand playerStore for state; direct service call to trigger | Components never hold Sound object references |
| FileCacheService ↔ SupabaseService | FileCacheService receives URL from SupabaseService; pulls file independently | Keeps concerns separate |
| ShareService ↔ FileCacheService | ShareService calls FileCacheService.getLocalUri() before sharing | Audio must be local before sharing |

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current architecture is fine. Supabase free tier handles this. Public bucket CDN absorbs read load. |
| 1k-100k users | Add database indexes on `share_count DESC`, `creator_id`, `list_id`. Consider Supabase Pro for connection pooling via PgBouncer. Paginate explore feed (cursor-based). |
| 100k+ users | Materialized view for trending feed (avoid full table scan on every request). Supabase Storage CDN already handles file distribution. Consider separate `share_events` table instead of counter column for accurate counts. |

### Scaling Priorities

1. **First bottleneck — explore query:** `ORDER BY share_count DESC` on a large `audio_items` table will slow down. Fix: add `CREATE INDEX idx_audio_share_count ON audio_items(share_count DESC) WHERE is_public = true`. Do this from day one.
2. **Second bottleneck — Supabase connection limits:** Default Postgres allows ~60 concurrent connections on free tier. Fix: enable PgBouncer (Supabase Pro) or use the connection pooler URL. Not a problem until sustained concurrent users.

---

## Anti-Patterns

### Anti-Pattern 1: Audio.Sound Objects Inside React Components

**What people do:** Create `const [sound, setSound] = useState<Audio.Sound>()` inside each AudioButton component, loading/unloading on mount/unmount.

**Why it's wrong:** If two buttons are tapped in quick succession, the first sound's unload races with the second sound's load. Grid virtualization causes buttons to unmount unexpectedly, unloading audio mid-play. Results in crashes, memory leaks, and overlapping audio.

**Do this instead:** One singleton at the service layer. Components call `audioPlayer.play(uri)` and read `playerStore.currentlyPlayingId` for UI state.

### Anti-Pattern 2: Fetching Audio From Supabase Storage URL Directly in expo-av

**What people do:** Pass the Supabase Storage HTTPS URL directly to `Audio.Sound.createAsync({ uri: remoteUrl })`.

**Why it's wrong:** Every tap re-downloads the file. No persistence. Fails offline. Signed URL expiry can cause playback to fail mid-listen.

**Do this instead:** Always download to local filesystem first via FileCacheService. expo-av always gets a `file://` URI.

### Anti-Pattern 3: Not Copying Inbound Share Intent Files Immediately

**What people do:** Store the temp file path from expo-share-intent, then copy it after showing the user a form.

**Why it's wrong:** On iOS, the Share Extension's temp container is cleaned up when the extension is deallocated — this can happen before the user finishes filling the form. The file silently disappears.

**Do this instead:** Copy from temp path to `FileSystem.documentDirectory` as the very first action in `useEffect`, before rendering any form. Then work from the persistent copy.

### Anti-Pattern 4: Reference Clones Without Handling Creator Deletion

**What people do:** Clone a list by referencing the same `audio_item` rows. Assume the audio files will always exist.

**Why it's wrong:** If the original creator deletes their audio, `audio_url` still exists in the clone's `list_audios` but the Storage file is gone. Playback silently fails with a 404.

**Do this instead (v1 acceptable):** Accept this risk for v1 since reference-only clones are a stated design decision. Mitigate by soft-deleting audio_items (add `deleted_at` column), preventing Storage deletion until no list references the item. Add a `ON DELETE CASCADE` guard or a database function to check references before allowing hard deletion.

### Anti-Pattern 5: Calling `ShareService` With Remote URLs

**What people do:** Call `Share.open({ url: supabaseStorageUrl })` thinking the OS can share a remote URL to WhatsApp as a file.

**Why it's wrong:** WhatsApp does not accept HTTP/HTTPS URLs as file attachments in share intents. It requires a local `file://` URI or a content URI.

**Do this instead:** Always resolve to a local file via `fileCacheService.getLocalUri()` before calling ShareService. The share flow should be: verify cached → if not cached, download → share from local path.

---

## Build Order Implications

The component dependencies dictate this build sequence:

1. **Foundation first:** Supabase client setup, AsyncStorage session, database types, TanStack Query client, Zustand stores. Everything else depends on these.

2. **FileCacheService second:** AudioPlayer and ShareService both depend on it. Build and test independently (download a file, verify it persists).

3. **AudioPlayer singleton third:** Depends on FileCacheService. Test with a local file before wiring to UI.

4. **Core Soundboard UI fourth:** AudioButton + grid layout + playerStore wiring. This is the app's core experience. At this point, the app can play sounds without any network calls (using bundled test audio).

5. **Supabase data layer fifth:** Hooks for lists, audio items, upload. Wire to Soundboard UI.

6. **Share Intent Receiver sixth:** Depends on FileCacheService + Supabase upload. Requires a custom dev client (EAS Build) — plan build time accordingly. This is the only feature that cannot be tested in Expo Go at all.

7. **Outbound WhatsApp share seventh:** Depends on FileCacheService (audio must be local) and custom dev client. Test on both platforms.

8. **Explore tab last:** Depends on working data model and RLS policies. Purely read-only; no new services needed.

---

## Sources

- [expo-av Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio-av/) — HIGH confidence
- [expo-file-system Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/) — HIGH confidence
- [expo-share-intent GitHub](https://github.com/achorein/expo-share-intent) — HIGH confidence (official source)
- [expo-share-intent DeepWiki Architecture](https://deepwiki.com/achorein/expo-share-intent) — MEDIUM confidence (derived from source)
- [react-native-share Documentation](https://react-native-share.github.io/react-native-share/docs/share-single) — HIGH confidence
- [Supabase Storage CDN Documentation](https://supabase.com/docs/guides/storage/cdn/fundamentals) — HIGH confidence
- [Expo App Folder Structure Best Practices](https://expo.dev/blog/expo-app-folder-structure-best-practices) — HIGH confidence
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence
- [Fintech Mobile Architecture: Clean Architecture React Native + Supabase + Zustand](https://medium.com/@seyhunak/fintech-mobile-architecture-clean-architecture-react-native-expo-supabase-backend-with-zustand-5857fb7a531f) — MEDIUM confidence (community article, Feb 2026)
- [react-native-share WhatsApp audio limitations (Issue #571)](https://github.com/react-native-community/react-native-share/issues/571) — MEDIUM confidence (community-reported, unresolved)
- [Supporting iOS Share Extensions & Android Intents on React Native](https://www.devas.life/supporting-ios-share-extensions-android-intents-on-react-native/) — MEDIUM confidence

---

*Architecture research for: YapDeck — Mobile soundboard + audio sharing social app*
*Researched: 2026-03-04*
