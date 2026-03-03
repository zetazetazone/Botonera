# Pitfalls Research

**Domain:** Mobile soundboard / audio sharing app (React Native Expo + Supabase + WhatsApp)
**Researched:** 2026-03-04
**Confidence:** MEDIUM — core claims verified via official docs and GitHub issues; WhatsApp combo-share behavior is LOW confidence due to lack of authoritative documentation

---

## Critical Pitfalls

### Pitfall 1: iOS Share Intent Receiver Requires Ejecting from Expo Go

**What goes wrong:**
The team assumes "Expo managed workflow" means they can test Share Intent Receiver functionality using Expo Go. It does not. Receiving share intents on iOS requires a native Share Extension target, which is a separate process from the main app. This forces the use of a custom dev client (EAS Build or `expo run:ios`) from the moment share intent work begins.

**Why it happens:**
Expo Go's sandbox cannot host native app extensions. Share extensions require their own bundle identifier, provisioning profile, and App Group entitlement. Developers often discover this late when they try to test and find the feature simply does not appear in the iOS share sheet.

**How to avoid:**
Switch to a custom dev client before starting Share Intent work. Use `expo-share-intent` (achorein's library — actively maintained as of early 2026). Configure the App Group entitlement in `app.json` at project start, not when the feature is needed. The library also requires a `patch-package` post-install step — set this up during initial project configuration.

**Warning signs:**
- Team is still using Expo Go when share intent work starts
- No App Group identifier defined in `app.json`
- No separate provisioning profile for the Share Extension target in EAS credentials

**Phase to address:** The foundation / environment setup phase. Do not start Share Intent Receiver work without validating a custom dev client build first.

---

### Pitfall 2: Android Audio Sharing Fails with `file://` URIs

**What goes wrong:**
On Android, sharing an audio file to WhatsApp (or any external app) using a raw `file://` URI results in either a blank intent dialog, a "Sharing failed. Please try again" error from WhatsApp, or the audio silently not attaching. This is the single most common failure point for the outbound sharing feature.

**Why it happens:**
Android's scoped storage model (enforced since Android 7+, strict since Android 10+) prohibits apps from sharing `file://` URIs to other apps. External apps cannot access a file path outside their own sandbox. WhatsApp rejects the intent silently on devices. The fix is to expose the file through a `FileProvider`, producing a `content://` URI that WhatsApp can receive.

**How to avoid:**
Before calling any share API, copy the audio file to the app's cache directory (`FileSystem.cacheDirectory`), then generate a `content://` URI via a `FileProvider` configuration. The `react-native-share` library handles this internally if configured correctly — the `filepaths.xml` provider config must cover the exact cache paths used. Verify on a real device (not emulator) since emulators tolerate `file://` URIs in ways real devices do not.

**Warning signs:**
- Sharing tested only on emulator
- Audio URL being passed directly from Supabase CDN (remote URL) to share intent rather than a locally cached copy
- No `filepaths.xml` or FileProvider authority configured in `AndroidManifest.xml`

**Phase to address:** The WhatsApp sharing phase. Make "test audio share on real Android device" a mandatory exit criterion before the phase is considered done.

---

### Pitfall 3: WhatsApp Does Not Accept Audio + Image in a Single Share Intent

**What goes wrong:**
The PROJECT.md acknowledges this risk but teams often attempt it anyway expecting it to work. WhatsApp's share intent handling on both iOS and Android does not reliably support sending multiple different media types (audio file + image/sticker) in a single `ACTION_SEND_MULTIPLE` intent. WhatsApp silently drops one attachment or rejects the intent entirely.

**Why it happens:**
WhatsApp is not designed as a generic share target for multi-type bundles. `ACTION_SEND_MULTIPLE` on Android works for same-type media (multiple images), but mixing audio and image MIME types in one intent is not a documented use case. iOS UIActivityViewController has similar constraints.

**How to avoid:**
Design the share flow with a confirmed fallback from day one: share audio first, then optionally share sticker as a second sequential intent. Do not invest engineering effort trying to make the combo intent work before validating it actually works on current WhatsApp versions. Build the fallback UI first, then attempt the combo as an enhancement — not the other way around.

**Warning signs:**
- Architecture assumes combo share works without a proof-of-concept test against actual WhatsApp
- UI flow has no fallback path for "audio only" share
- No real-device WhatsApp combo test done in Phase 1 spike

**Phase to address:** An early technical spike phase before any WhatsApp UI is built. Spend one day validating combo share on real devices with current WhatsApp before committing to UX designs.

---

### Pitfall 4: expo-av Sound Objects Accumulate and Stop Playing After Many Taps

**What goes wrong:**
In a soundboard with rapid-tap usage, each tap that creates a new `Audio.Sound` object without properly unloading the previous one accumulates native audio resources. After enough taps (varies by device, typically 20-50 sounds), audio playback silently stops working for the remainder of the session. The app appears functional but produces no sound.

**Why it happens:**
`Audio.Sound.createAsync()` allocates native resources that are not garbage collected. Without an explicit `sound.unloadAsync()` call, each sound object persists in memory. This is documented in Expo's own docs but easy to overlook in rapid-tap scenarios where "stop and restart" behavior is desired — stopping playback is not the same as unloading.

**How to avoid:**
Maintain a single shared Sound object reference per soundboard (not one per button). The stop-and-restart pattern should be: call `stopAsync()` + `setPositionAsync(0)` on the existing object, not create a new one. Only create a new Sound object when switching to a different audio clip. Always unload Sound objects when navigating away from the soundboard screen via a `useEffect` cleanup function.

**Warning signs:**
- Each button tap creates `Audio.Sound.createAsync()` independently
- No `useEffect` cleanup calling `unloadAsync()`
- Audio playback works in development but fails after sustained use in testing

**Phase to address:** Core soundboard playback phase. Write a stress test (tap 30 different sounds rapidly) as part of the definition of done.

---

### Pitfall 5: Opus Files Are Not Natively Playable on iOS Below Version 17

**What goes wrong:**
The app receives `.opus` files shared from WhatsApp (via the Share Intent Receiver) and attempts to play them via `expo-av`. On iOS 16 and below, `.opus` files in a standalone container fail to play — iOS's AVFoundation does not natively support bare Opus outside of specific container formats. The audio loads but produces silence or an error.

**Why it happens:**
Opus codec support on iOS was limited prior to iOS 17. WhatsApp packages audio as `.opus` (OGG container with Opus codec). iOS expects Opus in an ISOBMFF/MP4 container for support on older versions. Android handles `.opus` natively. The discrepancy creates a cross-platform gap that is invisible during Android testing.

**How to avoid:**
On import (when the user saves a received `.opus` file), transcode it to `.m4a` (AAC) using a native transcoding library before storing it locally or uploading to Supabase. This ensures universal playback across all target iOS versions. `react-native-audio-transcoder` or FFmpeg-based solutions handle this. Alternatively, set a minimum iOS version of 17 — but this significantly shrinks the addressable market.

**Warning signs:**
- `.opus` file playback only tested on Android
- No transcoding step in the share-intent-to-save flow
- iOS minimum deployment target below 17 without a transcoding strategy

**Phase to address:** Share Intent Receiver phase. Opus-to-m4a transcoding must be part of the "save received audio" flow, not deferred.

---

### Pitfall 6: Supabase Storage Signed URLs Expire and Break Cached Audio

**What goes wrong:**
If private buckets with signed URLs are used for audio storage, cached local file metadata (URLs stored in the local database or AsyncStorage) contains URLs that expire. When a user opens the app after 1 hour (default Supabase signed URL TTL), all cached audio references become invalid. The app shows sounds that cannot play.

**Why it happens:**
Signed URLs are time-limited by design. Teams often cache the URL alongside the file path without accounting for expiry. The audio file itself may be correctly cached locally, but the code re-fetches from the URL instead of using the local cache when the URL is stale.

**How to avoid:**
Use public buckets for audio files (acceptable since audio is content users choose to share publicly anyway). Public bucket URLs are permanent CDN URLs that do not expire. Alternatively, if privacy is required: store signed URLs with their expiry timestamp, check before use, and refresh if expired. The simpler and correct pattern for a sharing-oriented app is: public bucket for audio + private bucket only for user avatars.

**Warning signs:**
- All Supabase buckets configured as private
- URL stored as a raw string without an expiry timestamp
- No logic to distinguish "local cache hit" from "remote fetch"

**Phase to address:** Foundation / Supabase schema phase. Bucket visibility policy must be decided before any audio upload code is written.

---

### Pitfall 7: Reference-Only Clones Break When Creator Deletes Audio

**What goes wrong:**
The PROJECT.md documents this risk: cloned lists reference the same `audio_url` values as the original. If the original creator deletes their audio item, the `audio_url` in Supabase Storage is deleted, and all clone lists that referenced it now point to a 404. Users of cloned lists experience broken audio with no explanation.

**Why it happens:**
The data model stores only references (foreign keys or URLs) to shared audio items, not copies. This is intentional for storage efficiency, but there is no cascade protection or soft-delete mechanism. Supabase Storage does not prevent deletion of referenced files.

**How to avoid:**
Implement soft deletes on `AudioItem` records (add an `is_deleted` boolean and a `deleted_at` timestamp). Do not delete the actual Storage object while any `ListAudios` references point to it. Add a background job or database trigger that checks reference count before physical deletion. Alternatively, copy audio files on clone (increases storage costs but eliminates breakage risk) — this is worth evaluating for v1 simplicity.

**Warning signs:**
- Delete audio feature implemented without checking reference counts
- No `is_deleted` column or soft delete pattern in the schema
- Storage object deletion happens synchronously in the UI flow

**Phase to address:** Data model / backend phase. The soft-delete policy must be in the schema from the beginning — retrofitting it after data exists is painful.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip `unloadAsync()` on Sound objects | Simpler playback code | Audio stops working after sustained use; memory exhaustion | Never |
| Use Expo Go for all development | Faster iteration | Cannot test share intents, native modules, or EAS features | Only for non-native UI work |
| Store raw signed URLs without expiry | Simpler caching logic | Broken audio for users after 1 hour | Never if using private buckets |
| Skip `FileProvider` config on Android | Faster first share implementation | Silent failures on real devices sharing to WhatsApp | Never |
| Physical delete of storage objects | Simpler delete flow | Broken audio in cloned lists | Never — use soft delete |
| Share from remote CDN URL directly (no local copy) | Skip caching step | Offline failure; re-download on every share; Android URI rejection | MVP only if offline not a concern, Android still needs content URI |
| Single global audio session (no per-screen cleanup) | Less state management | Audio continues playing when navigating away; OS session conflicts | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| WhatsApp (Android) | Pass `file://` URI directly to share intent | Copy file to cache, expose via FileProvider as `content://` URI |
| WhatsApp (iOS) | Assume `UIActivityViewController` handles file selection | Use `expo-sharing` with a locally downloaded file copy, not a remote URL |
| WhatsApp (both) | Share audio + sticker in one call | Validate combo intent works first; default to sequential shares |
| Supabase Storage | Use private bucket for audio requiring playback in-app | Use public bucket for audio; signed URLs expire and break cached references |
| Supabase Auth (Google OAuth) | Redirect URL mismatch between local dev and production | Configure `exp://` scheme for dev client AND `yapdeck://` custom scheme for production; register both in Supabase dashboard |
| Supabase Auth (Apple Sign-In) | Missing or wrong Services ID type | Must be "Web" type Services ID; Return URLs must include Supabase callback exactly |
| expo-share-intent | Not configuring App Group entitlement | Must add App Group in both main app and extension targets; this is required for data passing between extension and app |
| expo-av | Using `Audio.Sound.createAsync()` per tap | Pre-load sound for currently displayed board; reuse and seek-to-zero on retap |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all audio metadata for a list on mount | Slow list open; timeout on large lists | Paginate list audio items; lazy load thumbnails | Lists with more than ~50 items |
| Downloading audio on first play (no pre-caching) | Tap-to-play latency of 2-5 seconds on slow connections | Cache to `documentDirectory` on list open; play from cache | Always noticeable; worse on mobile data |
| Unloaded Sound objects per tap | App-wide audio failure after ~30 taps | Single Sound object reference per playback session | Within one session with rapid tapping |
| Supabase CDN cold start for first audio fetch | First play after app install is slow | Prefetch audio on list entry; cache aggressively | First-time users in regions far from CDN node |
| Re-fetching full AudioItem list on every render | Excessive Supabase reads; quota burn | Use React Query or SWR with stale-while-revalidate; cache at query level | Not a user-visible problem until read quota or costs become an issue |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Public bucket with no RLS on upload | Any user can upload files to any path, including overwriting others' audio | RLS on `storage.objects`: INSERT policy must check `auth.uid()` matches path prefix |
| Missing RLS on `AudioItem` table | Users can update or delete other users' audio records | Row-level policy: `creator_id = auth.uid()` for UPDATE and DELETE |
| Storing Supabase service role key in app bundle | Full database access if key is extracted from APK/IPA | Service role key must never leave the server; mobile app uses anon key only |
| No file size validation before upload | Users upload multi-GB files; storage costs explode | Validate file size client-side AND enforce max-size policy on Supabase Storage bucket settings |
| Exposing internal audio file paths in public metadata | Path enumeration attacks on storage | Store only opaque UUIDs as path components; never expose user ID in storage path |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No haptic feedback on sound tap | Soundboard feels unresponsive; users tap multiple times creating double-play | `expo-haptics` impact on every tap; visual state change (scale animation) for immediate feedback |
| Playing new sound while previous still plays (overlap) | Confusing audio mud; sounds bleed into each other | Stop current sound before starting next; this is defined in PROJECT.md but must be the default behavior |
| Share action with no loading state | User taps share, nothing visibly happens; they tap again | Show loading indicator during file copy + share intent launch; disable button during operation |
| No offline indicator | User taps sound, silence; no explanation | Check network before play; show "cached" vs "needs connection" state on each sound tile |
| Generic error messages for share failures | User does not know if WhatsApp is not installed vs. share failed | Handle `ActivityNotFoundException` (Android) and detect WhatsApp absence explicitly; show actionable error |
| Cloned list changes are invisible | User clones a list expecting it to be "theirs" but the creator can delete items | Clearly label cloned lists; show a warning if source items become unavailable |

---

## "Looks Done But Isn't" Checklist

- [ ] **Audio playback:** Works in Expo Go but tested on a custom dev client build? Expo Go sandboxes some audio session behaviors.
- [ ] **WhatsApp share (Android):** Tested on a real physical Android device (not emulator) with real WhatsApp installed?
- [ ] **WhatsApp share (iOS):** Tested with a locally downloaded copy of the file (not remote Supabase URL) being passed to share?
- [ ] **Share Intent Receiver:** Verified the received `.opus` file actually plays back on iOS after import?
- [ ] **Auth deep links:** Tested Google OAuth full round-trip on both iOS simulator and Android emulator with correct redirect URL?
- [ ] **Sound cleanup:** Confirmed audio stops when navigating away from soundboard screen (useEffect cleanup)?
- [ ] **File caching:** Confirmed cached files survive app restart (stored in `documentDirectory`, not `cacheDirectory` which OS can clear)?
- [ ] **Supabase RLS:** Verified a user cannot delete another user's audio via direct API call?
- [ ] **Soft deletes:** Confirmed deleting an audio item does not 404 on other users' lists that reference it?
- [ ] **Opus playback (iOS):** Tested `.opus` file playback specifically on iOS 16 device or simulator?

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Expo Go used for share intent development (wrong environment) | LOW | Add EAS build profile, run `expo prebuild`, set up custom dev client — 1 day work |
| Android `file://` URI sharing fails in production | MEDIUM | Add FileProvider config + file copy step; requires native config change + EAS rebuild |
| Sound objects not unloaded — audio stops in production | LOW | Refactor playback hook to single Sound object reference; no native changes required |
| Supabase private bucket with expiring URLs in production | HIGH | Migrate bucket to public (possible with data migration); update all stored URLs; CDN cache propagation delay |
| Opus files not playing on iOS — users report silence | MEDIUM | Add transcoding step in share-to-save flow; requires native FFmpeg or transcoder library integration |
| Reference-only clone data broken by creator deletes | HIGH | Backfill soft-delete column; add reference count check to delete flow; cannot recover already-deleted storage objects |
| Combo WhatsApp share not working — shipped as primary UX | MEDIUM | Implement sequential share fallback; update UI flow to make sticker share optional and separate |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| iOS share intent requires custom dev client | Foundation / project setup | Custom dev client EAS build succeeds and runs on device |
| Android `file://` URI share failure | WhatsApp sharing phase | Audio share to real WhatsApp on physical Android device passes |
| WhatsApp combo intent not supported | Early technical spike (before UX design) | Test audio+image in single intent on real devices; fallback path designed before UI work |
| Sound object accumulation / playback failure | Core soundboard phase | Stress test: 30 rapid taps across different sounds without audio failure |
| Opus non-playable on iOS | Share Intent Receiver phase | Received `.opus` file plays on iOS 16 simulator after import |
| Signed URL expiry breaking cached audio | Foundation / Supabase setup | Bucket policy set to public; no signed URL code paths for audio playback |
| Reference-only clone breakage | Data model / backend phase | Soft-delete schema in place; delete blocked if reference count > 0 |
| Supabase RLS gaps | Backend security review | Penetration test: anon user cannot delete another user's audio via REST |
| Auth OAuth redirect misconfiguration | Auth implementation phase | Full OAuth round-trip tested on physical device with production-like redirect URLs |
| expo-av unload omission | Soundboard implementation | `useEffect` cleanup verified via React DevTools; navigation away stops audio |

---

## Sources

- GitHub issue: audio file sharing on Android devices — [react-native-share #571](https://github.com/react-native-community/react-native-share/issues/571)
- GitHub issue: file+message sharing to WhatsApp broken on iOS 16.6+ — [react-native-share #1460](https://github.com/react-native-share/react-native-share/issues/1460)
- expo-share-intent README and limitations — [achorein/expo-share-intent](https://github.com/achorein/expo-share-intent)
- expo-share-extension (separate process model) — [MaxAst/expo-share-extension](https://github.com/MaxAst/expo-share-extension)
- Supabase Storage CDN cache invalidation behavior — [Supabase Storage CDN Docs](https://supabase.com/docs/guides/storage/cdn/fundamentals)
- Supabase Storage RLS and presigned URL gotchas — [Supabase Discussion #18947](https://github.com/orgs/supabase/discussions/18947)
- Supabase Auth deep linking for React Native — [Supabase Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- Google OAuth hanging at `setSession` — [supabase-js #1429](https://github.com/supabase/supabase-js/issues/1429)
- expo-file-system Android null directory bug — [expo #24662](https://github.com/expo/expo/issues/24662)
- expo-av sound accumulation and unload pattern — [expo-av documentation](https://docs.expo.dev/versions/latest/sdk/audio-av/)
- Opus iOS support limitations pre-iOS 17 — [Opus Audio Codec FAQ](https://www.free-codecs.com/guides/opus_audio_codec_faq.htm)
- WhatsApp supported MIME types — [AWS End User Messaging Social](https://docs.aws.amazon.com/social-messaging/latest/userguide/supported-media-types.html)
- App Group data sharing between extension and containing app — [iOS App Groups Setup](https://medium.com/@B4k3R/setting-up-your-appgroup-to-share-data-between-app-extensions-in-ios-43c7c642c4c7)
- EAS Build with share extension multiple targets — [expo-share-intent #159](https://github.com/achorein/expo-share-intent/issues/159)

---
*Pitfalls research for: Mobile soundboard / audio sharing app (YapDeck)*
*Researched: 2026-03-04*
