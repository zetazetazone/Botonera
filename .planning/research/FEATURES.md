# Feature Research

**Domain:** Mobile soundboard / social audio sharing (WhatsApp-first)
**Researched:** 2026-03-04
**Confidence:** MEDIUM — soundboard feature landscape well-documented; WhatsApp combo-share behavior LOW confidence due to platform variability and unresolved library issues

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Tap-to-play buttons in a grid | Core soundboard interaction — every app does this | LOW | Stop-and-restart on rapid tap is the right behavior; overlapping audio creates chaos |
| Named buttons with visual identity | Users cannot operate an unlabeled board; thumbnail/image makes sounds scannable at a glance | LOW | Text label required; image/thumbnail expected in any modern app |
| Multiple boards / lists | Every soundboard app (Soundboard Studio, Instant Buttons, Custom Soundboard) supports multiple boards | MEDIUM | Users organize sounds by context: meme pack, voice lines, work sounds |
| Favorites / bookmarks | Standard across all reviewed apps; users expect quick access to most-used sounds | LOW | Simple join table or boolean on AudioItem |
| Search within library | Expected in any content-heavy app; even apps with 20 sounds benefit from search | LOW | Client-side filter acceptable for small libraries; server-side for explore |
| Import audio from device / cloud | Users bring their own sounds; no import = product is closed garden | MEDIUM | Files app integration on iOS, SAF on Android, plus cloud (Dropbox/Drive) |
| Share audio to other apps | Sharing is the entire distribution model for this category | MEDIUM | react-native-share targets WhatsApp (com.whatsapp) |
| Basic playback controls (stop, replay) | Any audio app must let users stop what's playing | LOW | Stop-all button expected; per-button stop on re-tap acceptable |
| User accounts / authentication | Needed for cross-device sync and social features (follow, clone) | MEDIUM | Supabase Auth with email + Google/Apple OAuth |
| Offline playback after first load | Users play sounds in social contexts (parties, chats) where connectivity is unreliable | MEDIUM | Local file cache via expo-file-system to app documents directory |
| Haptic feedback on button tap | Expected in any tappable media app; reinforces the button metaphor | LOW | expo-haptics ImpactFeedbackStyle.Medium on tap |
| Audio format support (.opus, .m4a) | WhatsApp's native formats; if the app can't handle what WhatsApp sends, import fails | MEDIUM | FFmpeg or native codec — Android handles .opus natively; iOS needs consideration |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| One-tap WhatsApp share (audio + optional sticker) | The core value prop — fastest path from sound to friend's chat | HIGH | Confirmed risk: react-native-share cannot reliably send audio + image as single WhatsApp attachment on iOS (GitHub issue #1524 closed without resolution). Fallback: two sequential shares or audio-only share |
| Share Intent Receiver (accept audio FROM WhatsApp) | Closes the loop — users receive a funny voice note and can save it directly into YapDeck without leaving WhatsApp | HIGH | iOS requires a Share Extension (separate Xcode target, separate process, custom URL scheme redirect). Android uses intent-filter in AndroidManifest. Both require native code; not achievable with Expo managed workflow alone |
| Sticker pairing per audio | Unique to YapDeck; no other reviewed soundboard app offers sticker-audio combos | MEDIUM | Sticker as thumbnail that also gets shared; stored as sticker_id FK on AudioItem |
| Explore tab with trending sounds | Social discovery layer; transforms app from personal tool to community platform | MEDIUM | Requires share_count tracking and a ranked query; sort by share_count DESC with time decay optional |
| Clone public lists (one-tap) | Viral growth mechanism — users discover a list and want it; cloning is frictionless adoption | MEDIUM | Reference clone (not copy): new SoundboardList row pointing to same AudioItems via ListAudios join table |
| Follow public lists | Lists stay fresh without user effort; followed creator's updates propagate | MEDIUM | Subscription pattern; requires notification or pull-to-refresh model |
| Themed lists (color per list) | Personalization; makes the grid visually distinctive when managing many boards | LOW | theme_color already in data model |
| Receive-and-save WhatsApp audio flow | Frictionless capture: "I got this audio from a friend, I want it in my board" — no other soundboard app targets this use case | HIGH | Depends on Share Intent Receiver being implemented first |
| Public list discovery + community sharing | Network effect: great lists attract followers who discover more lists | MEDIUM | Requires is_public flag, Explore tab, and list detail view |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| In-app audio recording | Users want to capture sounds spontaneously | Adds mic permission, recording UI, audio quality controls, and format decisions. Out of scope for v1; core value is organizing and sharing existing files, not recording | Import from device files or WhatsApp share intent receiver covers 90% of capture use cases |
| Real-time collaborative editing of lists | "Google Docs for soundboards" seems fun | Requires operational transforms or CRDT, conflict resolution UI, presence indicators. Complex data sync for marginal gain | is_collaborative field in data model deferred to v2; share/clone covers sharing without real-time conflict |
| In-app messaging / chat | Users want to discuss sounds with friends | Competes with WhatsApp (the app's primary partner), adds moderation burden, and dilutes the product focus | WhatsApp IS the chat layer; YapDeck feeds it |
| Video support | Users want to share funny video clips too | Different codec stack, much larger file sizes, WhatsApp's video sharing is already excellent natively, separate UX for video vs audio | Explicitly out of scope v1; if added, v2+ only |
| Monetization / paid sounds marketplace | Revenue generation sounds useful | Requires payment rails (Stripe), legal review, creator payouts, content moderation at scale. Premature for v1 | Defer until post-launch with established user base |
| Animated waveform visualizer during playback | Looks impressive in demos | High CPU usage in grid layout with many buttons; causes battery drain; provides zero functional value in tap-and-send soundboard context | Static thumbnail/image is sufficient; waveform reserved for the audio creation/trim screen only |
| Auto-play on explore tab scroll | Seems engaging | Catastrophic in shared spaces (office, transit); burns data; users immediately uninstall apps that make noise without consent | Tap-to-preview only; never auto-play |
| Unlimited sound uploads (no constraints) | Power users want no limits | Storage costs grow unbounded; without quotas, one user can exhaust capacity; moderation becomes impossible | Set a per-user audio count limit (e.g., 500 items) and storage cap; enforce at upload time |
| Download / export sounds from other users' public lists | Seems like natural community behavior | Copyright / IP liability: if a user uploads a clip from a movie or song and others download it, YapDeck becomes a piracy vector | Allow play and share (sending back to WhatsApp) but not raw file download from other users' audio |

---

## Feature Dependencies

```
[User Authentication]
    └──requires──> [User Profiles]
    └──enables──> [Public Lists]
    └──enables──> [Follow Lists]
    └──enables──> [Clone Lists]

[Audio Import]
    └──requires──> [Audio Format Support (.opus, .m4a)]
    └──enables──> [Soundboard Grid]
    └──enables──> [Share to WhatsApp]

[Soundboard Grid]
    └──requires──> [Audio Import]
    └──requires──> [Local File Cache]
    └──enhances──> [Haptic Feedback]

[Share to WhatsApp]
    └──requires──> [Audio Import]
    └──optionally enhances──> [Sticker Pairing] (combo share)
    └──tracked by──> [share_count] (enables Trending/Explore)

[Share Intent Receiver]
    └──requires──> [iOS Share Extension] (native module)
    └──requires──> [Android Intent Filter] (native module)
    └──enables──> [Receive-and-Save WhatsApp Audio Flow]
    └──requires──> [Audio Import] (downstream save path)

[Explore Tab / Trending]
    └──requires──> [Public Lists]
    └──requires──> [share_count tracking]
    └──requires──> [User Authentication] (to follow/clone)

[Clone Lists]
    └──requires──> [Public Lists]
    └──requires──> [User Authentication]
    └──conflicts──> [Collaborative Editing] (both mutate list membership)

[Follow Lists]
    └──requires──> [Public Lists]
    └──requires──> [User Authentication]

[Sticker Pairing]
    └──enhances──> [Share to WhatsApp] (sticker travels with audio)
    └──stored on──> [AudioItem.sticker_id]
```

### Dependency Notes

- **Share to WhatsApp requires Audio Import:** You can only share what's been imported and cached locally.
- **Share Intent Receiver requires native modules:** Cannot be implemented in Expo managed workflow; bare workflow or custom dev client required. This is likely the highest-complexity single feature.
- **Explore Tab requires share_count tracking:** Every successful share must increment share_count server-side; if tracking is skipped early, there's no trending data to surface.
- **Clone Lists conflicts with Collaborative Editing:** Both features mutate list membership. Build clone first (simpler); collaborative editing needs a conflict model.
- **Sticker Pairing + WhatsApp combo share is HIGH RISK:** react-native-share cannot reliably send two file types in one WhatsApp share on iOS (GitHub issue #1524, closed unresolved). Fallback to sequential share (audio first, sticker as image second) or audio-only must be designed in from the start.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] User authentication (email + Google/Apple OAuth) — gate to all personalized features
- [ ] Audio import from device files (.opus, .m4a minimum) — the content creation step
- [ ] Soundboard grid with tap-to-play, stop-and-restart, haptic feedback — the core interaction
- [ ] Local file cache for offline playback — needed for real-world use (parties, transit)
- [ ] Named buttons with thumbnail image — without visual identity, grid is unusable at scale
- [ ] Multiple lists / boards — organization is table stakes; single board app feels toy-like
- [ ] One-tap share audio to WhatsApp — the entire value prop; without this it's just a local player
- [ ] Sticker pairing (optional per audio) — differentiator; ship audio-only share as fallback if combo share fails
- [ ] Share Intent Receiver (iOS Share Extension + Android intent filter) — closes the capture loop; without it, users must export audio manually
- [ ] Explore tab with trending audios — social layer that makes the app feel alive; drives retention
- [ ] Clone public lists — viral growth mechanism
- [ ] User profiles (username, avatar) — required for public lists and attribution

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Follow lists — add when retention data shows users returning to check specific creators
- [ ] Push notifications for followed list updates — add when follow feature ships
- [ ] Favorites / quick-access tray — add when user library grows beyond 30-40 sounds
- [ ] Search within personal library — add when users report difficulty finding sounds
- [ ] Audio trim (start/end points) — add when import flow data shows users struggling with long clips
- [ ] Per-list theme colors — low effort polish; add in a UX sprint post-launch

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Collaborative list editing — data model already supports it (is_collaborative field); implement when social use is proven
- [ ] Audio recording in-app — significant scope expansion; only if import-only flow shows friction
- [ ] Video support — only if audio-only traction proves concept; separate product decision
- [ ] Monetization / premium features — after user base established; don't over-engineer billing pre-PMF
- [ ] Animated stickers (APNG/GIF stickers) — after static sticker pairing is validated
- [ ] AI sound categorization / auto-tagging — after content volume justifies it

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Soundboard grid (tap-to-play) | HIGH | LOW | P1 |
| Audio import from device | HIGH | LOW | P1 |
| Local file cache | HIGH | LOW | P1 |
| Share audio to WhatsApp | HIGH | MEDIUM | P1 |
| User authentication | HIGH | MEDIUM | P1 |
| Multiple lists / boards | HIGH | LOW | P1 |
| Named buttons + thumbnails | HIGH | LOW | P1 |
| Haptic feedback | MEDIUM | LOW | P1 |
| Share Intent Receiver (receive FROM WhatsApp) | HIGH | HIGH | P1 |
| Sticker pairing | MEDIUM | MEDIUM | P1 |
| Explore tab / trending | HIGH | MEDIUM | P1 |
| Clone public lists | HIGH | MEDIUM | P1 |
| User profiles | MEDIUM | LOW | P1 |
| Favorites | MEDIUM | LOW | P2 |
| Follow public lists | MEDIUM | MEDIUM | P2 |
| Search library | MEDIUM | LOW | P2 |
| Audio trim | MEDIUM | MEDIUM | P2 |
| Per-list theme colors | LOW | LOW | P2 |
| Push notifications | MEDIUM | HIGH | P2 |
| Collaborative editing | LOW | HIGH | P3 |
| In-app recording | MEDIUM | HIGH | P3 |
| Video support | MEDIUM | HIGH | P3 |
| Monetization | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Soundboard Studio | Instant Buttons | MyInstants | YapDeck Approach |
|---------|------------------|-----------------|------------|------------------|
| Tap-to-play grid | Yes (professional cartwall) | Yes (category tiles) | Yes (web + app) | Yes, with haptics |
| Multiple boards | Yes (unlimited in Pro) | Category-based | Category-based | Yes, user-created lists |
| Custom audio import | Yes (cloud + device) | Yes (record + upload) | Yes (community upload) | Yes, device + WhatsApp intent |
| Social sharing | No — no social features | Share button (OS share sheet) | Share button (OS share sheet) | Direct WhatsApp target with sticker combo |
| WhatsApp integration | None | OS share sheet only | OS share sheet only | Direct share + receive intent |
| Explore / trending | None | Fixed categories | Country-trending | share_count-ranked explore tab |
| Clone / follow lists | None | None | None | Both — core differentiator |
| Sticker pairing | None | None | None | Unique to YapDeck |
| Share intent receiver | None | None | None | Unique to YapDeck |
| Offline playback | Yes (local files) | Partial | Web-dependent | Yes, local cache required |
| Social profiles | None | None | User accounts on web | Profiles with username/avatar |

**Key gap in market:** No existing soundboard app treats WhatsApp as a first-class integration target or provides a receive-and-save flow. All competitors use the generic OS share sheet — YapDeck's direct WhatsApp targeting and Share Intent Receiver are genuinely differentiating.

---

## WhatsApp Integration: Technical Reality Check

This section documents known constraints that directly affect feature design.

### Audio-Only Share (MEDIUM confidence)
`react-native-share` with `social: Share.Social.WHATSAPP` and a local audio file URL works on Android for M4A/MP3. OPUS sharing to WhatsApp on Android has had reliability issues (toast "Sharing failed"). iOS path using `Share.shareSingle` is functional for audio files.

### Combo Share: Audio + Image in One WhatsApp Message (LOW confidence)
WhatsApp's intent handling does not reliably accept multiple file attachments of different types in a single share intent. GitHub issue react-native-share #1524 (multiple file formats to WhatsApp on iOS) was closed as stale without resolution. **Design decision required:** ship audio-only as primary path, sticker as a subsequent share if supported.

### Share Intent Receiver / Inbound Sharing (MEDIUM confidence)
Technically achievable but requires leaving Expo managed workflow:
- **iOS:** Share Extension target in Xcode. Separate process from main app. Communicates via App Groups or custom URL scheme redirect. Cannot share memory directly.
- **Android:** `ACTION_SEND` intent filter in AndroidManifest. React Native's Linking module does NOT handle ACTION_SEND by default; custom Kotlin code required to emit events to JS.

This is the single highest-complexity feature in v1. Plan a dedicated phase or spike for it.

---

## Sources

- Soundboard Studio App Store listing: https://apps.apple.com/us/app/soundboard-studio/id1108810082
- Soundboard Studio product site: https://soundboardstudio.com/
- CellularNews "12 Best Soundboard Apps": https://cellularnews.com/mobile-apps/best-soundboard-app/
- MobileMarketingReads soundboard roundup: https://mobilemarketingreads.com/best-soundboard-apps/
- react-native-share GitHub issue #1524 (multiple file formats to WhatsApp, iOS): https://github.com/react-native-share/react-native-share/issues/1524
- react-native-share GitHub issue #571 (audio file on real device): https://github.com/react-native-community/react-native-share/issues/571
- "Supporting iOS Share Extensions & Android Intents on React Native": https://www.devas.life/supporting-ios-share-extensions-android-intents-on-react-native/
- WhatsApp Android developer FAQ: https://faq.whatsapp.com/en/android/28000012
- LogRocket "Sharing content in React Native": https://blog.logrocket.com/sharing-content-react-native-apps-using-react-native-share/
- MyInstants WhatsApp Soundboard: https://www.myinstants.com/en/categories/whatsapp%20audios/us/

---

*Feature research for: Mobile soundboard / social audio sharing (YapDeck)*
*Researched: 2026-03-04*
