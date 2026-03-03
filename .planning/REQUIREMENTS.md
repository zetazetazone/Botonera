# Requirements: YapDeck

**Defined:** 2026-03-04
**Core Value:** Users can instantly tap an audio button and share it — with an optional sticker combo — to WhatsApp in one fluid action.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Soundboard

- [ ] **SND-01**: User can view audio items in a grid layout with thumbnail or stylized title
- [ ] **SND-02**: User can tap a button to play audio with haptic feedback
- [ ] **SND-03**: Tapping a new button stops the currently playing sound and plays the new one
- [ ] **SND-04**: User can create multiple soundboard lists/boards
- [ ] **SND-05**: User can set a theme color per list
- [ ] **SND-06**: User can mark audio items as favorites for quick access
- [ ] **SND-07**: User can reorder audio items within a list

### Audio Management

- [ ] **AUD-01**: User can import audio files from device storage (.opus, .m4a)
- [ ] **AUD-02**: User can set a name and upload a thumbnail for each audio
- [ ] **AUD-03**: User can attach an optional sticker/image to an audio item
- [ ] **AUD-04**: Imported audio is cached locally for offline playback
- [ ] **AUD-05**: User can edit audio item details (name, thumbnail, sticker)
- [ ] **AUD-06**: User can delete audio items from their library

### WhatsApp Integration

- [ ] **WA-01**: User can share an audio file directly to WhatsApp (targeting com.whatsapp)
- [ ] **WA-02**: After sharing audio, if a sticker is attached, user is offered to send sticker as a second WhatsApp message
- [ ] **WA-03**: App registers as a Share Target so users can share .opus/.m4a files from WhatsApp into YapDeck
- [ ] **WA-04**: When receiving a shared file, user sees a modal to name the audio and select a list
- [ ] **WA-05**: Share Intent Receiver works on both iOS (Share Extension) and Android (intent filter)

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can sign in with Google OAuth
- [ ] **AUTH-03**: User can sign in with Apple OAuth
- [ ] **AUTH-04**: User session persists across app restarts

### Profiles

- [ ] **PROF-01**: User can set a username
- [ ] **PROF-02**: User can upload an avatar image
- [ ] **PROF-03**: User can view other users' profiles

### Social / Explore

- [ ] **SOC-01**: User can browse an Explore tab with trending audios ranked by share_count
- [ ] **SOC-02**: User can browse popular public lists in Explore
- [ ] **SOC-03**: User can preview audios in a public list before cloning
- [ ] **SOC-04**: User can clone a public list to their library (reference-only)
- [ ] **SOC-05**: User can follow a public list so it appears in their library
- [ ] **SOC-06**: User can make their own lists public or private

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Collaboration

- **COLLAB-01**: User can enable collaborative editing on a list
- **COLLAB-02**: Collaborators can add/remove audios from shared lists

### Advanced Audio

- **ADVA-01**: User can trim audio (set start/end points)
- **ADVA-02**: User can record audio in-app
- **ADVA-03**: User can search within their personal library

### Notifications

- **NOTF-01**: User receives push notification when a followed list is updated
- **NOTF-02**: User can configure notification preferences

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| In-app messaging / chat | WhatsApp IS the chat layer; YapDeck feeds it |
| Video support | Different codec stack, much larger files; WhatsApp handles video natively |
| Monetization / paid sounds marketplace | Premature for v1; requires payment rails and content moderation |
| Audio recording in-app | Core value is organizing/sharing existing files, not recording |
| Animated waveform visualizer | High CPU in grid layout; zero functional value in tap-and-send context |
| Auto-play on explore scroll | Catastrophic UX in shared spaces; tap-to-preview only |
| Raw file download from others' audio | Copyright/IP liability; allow play and share but not raw download |
| Combo share (audio + sticker single message) | WhatsApp does not accept multi-type intents; replaced by sequential share (WA-02) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SND-01 | Phase 1 | Pending |
| SND-02 | Phase 1 | Pending |
| SND-03 | Phase 1 | Pending |
| SND-04 | Phase 1 | Pending |
| SND-05 | Phase 1 | Pending |
| SND-06 | Phase 2 | Pending |
| SND-07 | Phase 1 | Pending |
| AUD-01 | Phase 1 | Pending |
| AUD-02 | Phase 1 | Pending |
| AUD-03 | Phase 1 | Pending |
| AUD-04 | Phase 1 | Pending |
| AUD-05 | Phase 1 | Pending |
| AUD-06 | Phase 1 | Pending |
| WA-01 | Phase 3 | Pending |
| WA-02 | Phase 3 | Pending |
| WA-03 | Phase 3 | Pending |
| WA-04 | Phase 3 | Pending |
| WA-05 | Phase 3 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| PROF-01 | Phase 2 | Pending |
| PROF-02 | Phase 2 | Pending |
| PROF-03 | Phase 2 | Pending |
| SOC-01 | Phase 4 | Pending |
| SOC-02 | Phase 4 | Pending |
| SOC-03 | Phase 4 | Pending |
| SOC-04 | Phase 4 | Pending |
| SOC-05 | Phase 4 | Pending |
| SOC-06 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after roadmap creation*
