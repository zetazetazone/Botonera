# Codebase Concerns

**Analysis Date:** 2026-03-03

## Tech Debt

**Duplicate Color Arrays:**
- Issue: Color palette is hardcoded in three separate locations with identical values
- Files: `src/hooks/useSoundboard.js` (lines 65, 89), `src/components/EditSoundModal.js` (lines 12-18)
- Impact: Maintenance burden; changing color scheme requires updates in multiple places; inconsistency risk
- Fix approach: Extract colors to a shared constant in `src/constants/` or `src/utils/` and import across the app

**Mixed Language Codebase:**
- Issue: Project uses both JavaScript (.js) and TypeScript (.ts/.tsx) inconsistently
- Files: Core logic in `src/` uses `.js`, but app routing and new code uses `.tsx`
- Impact: Type safety only partially enforced; inconsistent developer experience; migration friction
- Fix approach: Migrate all `.js` files in `src/` to `.ts`/`.tsx` with proper type annotations

**Missing Error Recovery in Audio Bridge:**
- Issue: `playSoundFile()` returns `null` on error but callers don't validate
- Files: `src/utils/audioBridge.js` (lines 53-65), `src/screens/HomeScreen.js` (line 61)
- Impact: Silent failures; `activeSoundObj` can be set to null, potentially causing unload errors later
- Fix approach: Add proper error handling and optional chaining when storing/using `activeSoundObj`

**Incomplete Modal Cleanup:**
- Issue: Long-press to open edit modal plays sound, but sound continues playing if modal is dismissed via outside tap
- Files: `src/screens/HomeScreen.js` (lines 52-76), `src/components/EditSoundModal.js` (lines 1-50)
- Impact: Audio plays uncontrollably; poor UX
- Fix approach: Add sound cleanup callback triggered by `onClose` that always unloads audio

**Hardcoded Limits:**
- Issue: Title length limits hardcoded in UI (20 chars) with different truncation logic in model (15 chars)
- Files: `src/components/EditSoundModal.js` (line 62, maxLength=20), `src/hooks/useSoundboard.js` (lines 56-57, 96-97, truncate to 15)
- Impact: Inconsistent behavior; silent data loss during import; confusing UX
- Fix approach: Define `MAX_TITLE_LENGTH` constant (choose 15 or 20) and use consistently everywhere

## Known Bugs

**Audio Playback Not Stopped on Navigation:**
- Symptoms: Playing sound when closing modal doesn't fully stop before app state changes
- Files: `src/screens/HomeScreen.js` (lines 68-76)
- Trigger: Long-press a sound, then exit app without closing modal
- Workaround: Manually close modal before leaving screen

**Share Intent Error Swallowing:**
- Symptoms: Share intent processing errors logged but not surfaced to user
- Files: `src/screens/HomeScreen.js` (lines 26-44)
- Trigger: Receiving file share when app is in background
- Workaround: None; silent failure

**File Naming Collisions:**
- Symptoms: Multiple sounds can have identical saved filenames if imported within same millisecond
- Files: `src/utils/audioBridge.js` (line 25) uses `Date.now()` but `saveAudioFile` uses original filename
- Trigger: Rapidly import multiple files in succession
- Workaround: Add artificial delay between imports

## Security Considerations

**No Input Validation on Titles:**
- Risk: User-supplied text directly stored in AsyncStorage without sanitization
- Files: `src/hooks/useSoundboard.js` (line 117), `src/components/EditSoundModal.js` (lines 56-62)
- Current mitigation: maxLength attribute on TextInput (UI-only, easily bypassed)
- Recommendations: Add server-side validation if data is ever synced; implement length check in hook before saving

**Unvalidated File URIs:**
- Risk: File URIs accepted from share intent without type validation
- Files: `src/screens/HomeScreen.js` (line 30), `src/hooks/useSoundboard.js` (line 92)
- Current mitigation: DocumentPicker type filtering (insufficient for share intent)
- Recommendations: Validate MIME type after receiving file; reject non-audio formats

**AsyncStorage Not Encrypted:**
- Risk: Sound metadata and file paths stored in plaintext
- Files: `src/hooks/useSoundboard.js` (line 35)
- Current mitigation: None
- Recommendations: Consider encrypted storage for sensitive paths; at minimum document this limitation

**No File System Permissions Validation:**
- Risk: App assumes persistent access to saved file URIs without checking
- Files: `src/utils/audioBridge.js` (lines 23-34), `src/screens/HomeScreen.js`
- Current mitigation: File operations wrapped in try-catch
- Recommendations: Validate file existence before playback; handle 404 gracefully

## Performance Bottlenecks

**Synchronous Modal Render with Heavy Operations:**
- Problem: Long-press loads sound file synchronously in same tick as modal render
- Files: `src/screens/HomeScreen.js` (lines 52-66)
- Cause: Awaiting async operation but UI renders immediately
- Improvement path: Wrap sound loading in loading state with spinner

**No Pagination on Sound Grid:**
- Problem: FlatList renders all sounds even if hundreds are stored
- Files: `src/screens/HomeScreen.js` (lines 92-112)
- Cause: No pagination or virtualization configured
- Improvement path: Add FlatList pagination props or lazy loading

**Color Array Recreated Every Import:**
- Problem: Colors array instantiated fresh in two functions every time
- Files: `src/hooks/useSoundboard.js` (lines 65, 89)
- Cause: No memoization or extraction
- Improvement path: Extract to constant; saves negligible but improves consistency

**No Caching of Sound Objects:**
- Problem: Playing a sound that's already loaded creates new Sound object
- Files: `src/screens/HomeScreen.js` (line 61)
- Cause: No cache or object pooling
- Improvement path: Cache Sound objects by URI; unload only when deleted

## Fragile Areas

**Context Hook Dependency:**
- Files: `src/hooks/useSoundboard.js` (lines 147-153)
- Why fragile: Throws error if used outside provider; no graceful fallback; easy to accidentally use before provider wraps component
- Safe modification: Add optional parameter to hook to enable stub mode for testing
- Test coverage: No tests visible for context error boundary

**File System Cleanup Race Condition:**
- Files: `src/hooks/useSoundboard.js` (line 125)
- Why fragile: Deletes file from disk after removing from state; if deletion fails, stale file remains but metadata gone
- Safe modification: Reverse order: delete from disk first, only remove from state if successful
- Test coverage: No unit tests for delete operation

**Modal State Not Synchronized with Playback:**
- Files: `src/screens/HomeScreen.js`, `src/components/EditSoundModal.js`
- Why fragile: Modal can be destroyed while sound still playing; activeSoundObj might reference stale sound
- Safe modification: Tie sound lifecycle to modal visibility state; use useEffect cleanup
- Test coverage: No integration tests for modal lifecycle

**Filename Parsing Regex:**
- Files: `src/hooks/useSoundboard.js` (lines 54, 94)
- Why fragile: Regex `(.+?)(?:\.[^.]*$|$)` doesn't handle edge cases (dots in middle of filename, no extension)
- Safe modification: Use library like `path-parse` or `url-parse` for proper filename handling
- Test coverage: No tests for unusual filenames

## Scaling Limits

**AsyncStorage Single Key Storage:**
- Current capacity: AsyncStorage typically handles objects up to several MB on most devices
- Limit: With large audio files (1MB+ each), storing 100+ sounds becomes problematic; JSON parsing becomes slow
- Scaling path: Migrate to SQLite or realm.js for structured storage; implement pagination in UI

**File System on Device Storage:**
- Current capacity: Limited by device's app storage partition (typically 1-10GB)
- Limit: Each audio file stored uncompressed; no deduplication
- Scaling path: Implement cloud sync with backend; add file compression option

**No Concurrent Audio Playback:**
- Current capacity: Only one Sound object active at a time
- Limit: Cannot play multiple sounds simultaneously
- Scaling path: Add sound mixer support if concurrent playback needed

## Dependencies at Risk

**React 19.1.0 in React Native (0.81.5) Context:**
- Risk: React 19 is very new; React Native ecosystem still stabilizing; version mismatch potential
- Impact: Breaking changes in React could require React Native upgrade; dependency resolution issues
- Migration plan: Monitor React Native 0.82+ release for official React 19 support; prepare for upgrade cycle

**Expo SDK 54 with Rapid Release Cycle:**
- Risk: Expo releases monthly; deprecations and breaking changes frequent
- Impact: Monthly patch cycle required to stay current; eventual forced upgrades
- Migration plan: Establish monthly update cadence; monitor Expo changelog for deprecations in `expo-av`, `expo-file-system`

**expo-file-system Using Legacy API:**
- Risk: Code imports from `expo-file-system/legacy` which may be deprecated
- Impact: Future Expo versions may remove legacy API; code becomes incompatible
- Files: `src/utils/audioBridge.js` (line 2)
- Migration plan: Migrate to modern Expo File System API immediately; test thoroughly

## Missing Critical Features

**No Persistence of Playback State:**
- Problem: If user has open modal with playing sound and kills app, state lost
- Blocks: Seamless app resumption; poor offline experience

**No File Integrity Validation:**
- Problem: Cannot detect corrupted or missing audio files until playback
- Blocks: Proactive error handling; early file validation

**No Sorting or Search:**
- Problem: Sounds stored in creation order only; no way to find by name or organize
- Blocks: Usability for 50+ sounds; no user-facing organization

**No Analytics or Usage Tracking:**
- Problem: No visibility into which sounds are used, when, how often
- Blocks: Informed decisions about features; understanding user behavior

## Test Coverage Gaps

**No Unit Tests for Audio Bridge:**
- What's not tested: `saveAudioFile`, `deleteAudioFile`, `playSoundFile`, `shareAudioToWhatsApp`
- Files: `src/utils/audioBridge.js`
- Risk: Audio operations fail silently; bugs in file handling undetected; unsupported audio formats cause crashes
- Priority: High

**No Tests for Soundboard Context:**
- What's not tested: `loadSounds`, `saveToStorage`, `addNewSound`, `updateSound`, `deleteSound`
- Files: `src/hooks/useSoundboard.js`
- Risk: State management bugs; AsyncStorage failures; data corruption scenarios untested
- Priority: High

**No Integration Tests for Share Intent:**
- What's not tested: Full flow from receiving shared file to saving and displaying
- Files: `src/screens/HomeScreen.js` (lines 25-45)
- Risk: Shared file imports fail in production; error handling untested; edge cases (large files, invalid formats) not covered
- Priority: Medium

**No UI Component Tests:**
- What's not tested: Modal interactions, color selection, button states, responsive grid layout
- Files: `src/components/EditSoundModal.js`, `src/components/SoundButton.js`, `src/components/AddSoundFab.js`
- Risk: UI breaks on different device sizes; button states inconsistent; accessibility issues
- Priority: Medium

**No E2E Tests:**
- What's not tested: Full user flows (add sound, play, edit, delete, share)
- Risk: Regressions undetected; broken workflows reach production
- Priority: Medium

---

*Concerns audit: 2026-03-03*
