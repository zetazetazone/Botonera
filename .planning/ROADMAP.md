# Roadmap: YapDeck

## Overview

YapDeck ships in four coarse phases. Phase 1 builds the local-first soundboard — the entire audio playback and management experience runs offline before any cloud code is written. Phase 2 wires in Supabase auth, user identity, and cloud persistence, unlocking personalized libraries. Phase 3 implements both directions of WhatsApp integration: outbound audio sharing and inbound share intent capture. Phase 4 adds the social layer — Explore, clone, and follow — completing the v1 feature set for app store launch.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation and Soundboard** - Local-first soundboard with audio management, playback, and file caching — no network required
- [ ] **Phase 2: Auth and Data Layer** - User authentication, profiles, and Supabase cloud persistence for lists and audio items
- [ ] **Phase 3: WhatsApp Integration** - Outbound audio sharing to WhatsApp and inbound Share Intent Receiver for capturing audio from WhatsApp
- [ ] **Phase 4: Social and Explore** - Explore tab, public list discovery, clone, follow, and list visibility controls

## Phase Details

### Phase 1: Foundation and Soundboard
**Goal**: Users can build and play a local soundboard — import audio files, organize them into lists, tap to play with haptics, and have everything persist offline without signing in
**Depends on**: Nothing (first phase)
**Requirements**: SND-01, SND-02, SND-03, SND-04, SND-05, SND-07, AUD-01, AUD-02, AUD-03, AUD-04, AUD-05, AUD-06
**Success Criteria** (what must be TRUE):
  1. User can import a .opus or .m4a file from device storage, name it, add a thumbnail, and see it appear as a tappable button in a grid
  2. Tapping a button plays the audio with haptic feedback; tapping a different button immediately stops the first and plays the new one
  3. Audio plays offline after the first import (cached to documentDirectory, not dependent on network)
  4. User can create multiple named lists, assign a theme color to each, and reorder audio items within a list
  5. User can edit or delete any audio item (name, thumbnail, sticker) from their library
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — TypeScript types, Zustand store, service scaffolds, Jest test infrastructure, dependency install
- [ ] 01-02-PLAN.md — SoundButton, SoundGrid, ListTabBar, HomeScreen with audio playback, haptics, and stop-and-restart
- [ ] 01-03-PLAN.md — Audio import flow, edit/delete modals, list creation, drag-and-drop reordering

### Phase 2: Auth and Data Layer
**Goal**: Users can sign in, own their soundboard data in the cloud, and access it from any device — with a profile that identifies them
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, PROF-01, PROF-02, PROF-03, SND-06
**Success Criteria** (what must be TRUE):
  1. User can sign up and sign in with email/password; session persists across app restarts
  2. User can sign in with Google and Apple OAuth and land in the app without manual email entry
  3. User can set a username and upload an avatar image that appears on their profile
  4. User can view another user's public profile
  5. User can mark audio items as favorites and access them from a dedicated quick-access view
**Plans**: TBD

Plans:
- [ ] 02-01: Supabase Auth (email + Google + Apple OAuth), deep link configuration, session persistence
- [ ] 02-02: Cloud data sync for lists and audio items via TanStack Query, user profile (username, avatar), share_count tracking, favorites

### Phase 3: WhatsApp Integration
**Goal**: Users can send any audio from their soundboard directly to WhatsApp in one tap, and can capture audio shared from WhatsApp into their library
**Depends on**: Phase 2
**Requirements**: WA-01, WA-02, WA-03, WA-04, WA-05
**Success Criteria** (what must be TRUE):
  1. User can long-press or tap a share button on any audio item and it opens in WhatsApp on both iOS and Android (tested on real physical devices)
  2. If the audio has a sticker attached, user is offered a second share action to send the sticker as a follow-up WhatsApp message
  3. User can share a .opus or .m4a audio from WhatsApp and YapDeck appears as a destination in the system share sheet on both iOS and Android
  4. After sharing audio into YapDeck, user sees a modal to name the audio and assign it to a list, and it appears in their library after saving
**Plans**: TBD

Plans:
- [ ] 03-01: WhatsApp combo-share technical spike (validate audio + sticker single intent vs sequential; lock UX design), outbound share implementation (react-native-share Android, expo-sharing iOS)
- [ ] 03-02: Share Intent Receiver — iOS Share Extension (expo-share-intent v5.x), Android intent filter, Opus-to-m4a transcoding, name + list assignment modal

### Phase 4: Social and Explore
**Goal**: Users can discover trending sounds and public lists, clone lists into their own library, follow lists from other creators, and control the visibility of their own lists
**Depends on**: Phase 3
**Requirements**: SOC-01, SOC-02, SOC-03, SOC-04, SOC-05, SOC-06
**Success Criteria** (what must be TRUE):
  1. User can open an Explore tab and see trending audio items ranked by share_count, and preview any of them before saving
  2. User can browse public lists in Explore, tap to preview the audios inside, and clone a list to their own library in one tap
  3. User can follow a public list so it appears in their library alongside their own lists
  4. User can toggle their own lists between public and private
**Plans**: TBD

Plans:
- [ ] 04-01: Explore tab (trending audios by share_count, public list discovery), preview, clone (reference copy), follow, and list visibility toggle

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Soundboard | 1/3 | In Progress|  |
| 2. Auth and Data Layer | 0/2 | Not started | - |
| 3. WhatsApp Integration | 0/2 | Not started | - |
| 4. Social and Explore | 0/1 | Not started | - |
