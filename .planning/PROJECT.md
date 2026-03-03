# YapDeck

## What This Is

A mobile soundboard and social app for saving, organizing, and sharing audio clips (optionally paired with stickers/images) directly to WhatsApp. Built with React Native (Expo) and Supabase, targeting both iOS and Android for public app store launch.

## Core Value

Users can instantly tap an audio button and share it — with an optional sticker combo — to WhatsApp in one fluid action. The fastest path from "I have a sound" to "my friend heard it in WhatsApp."

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] In-app soundboard with grid layout, tap-to-play, haptic feedback
- [ ] Long-press / share button to send audio (+ optional sticker) to WhatsApp as a single share
- [ ] Audio creation flow: pick file, upload thumbnail, name it, attach optional sticker
- [ ] Share Intent Receiver: accept .opus/.m4a from WhatsApp, prompt to save and assign to a list (iOS + Android)
- [ ] Explore tab with trending audios (by share_count) and popular public lists
- [ ] Clone public lists (reference-only, links to same audio files)
- [ ] Follow public lists to appear in user library
- [ ] User authentication: email/password + Google/Apple OAuth via Supabase Auth
- [ ] User profiles: username, avatar
- [ ] Local file caching: audios copied to app document directory for persistence
- [ ] Audio playback: stop-and-restart behavior on rapid taps (expo-av)

### Out of Scope

- Real-time chat / messaging — not a messaging app, WhatsApp handles that
- Audio recording within the app — v1 is about organizing and sharing existing files
- Video support — audio + optional image only for v1
- Monetization / payments — defer to post-launch
- Collaborative list editing — data model supports it (`is_collaborative`) but UI deferred

## Context

**Stack:** React Native (Expo) with TypeScript, Supabase (Postgres + Storage + Auth)

**Data models defined:**
- User: id, username, avatar_url, created_at
- AudioItem: id, title, audio_url, thumbnail_url, sticker_id, creator_id, created_at, play_count, share_count
- SoundboardList: id, title, creator_id, is_public, is_collaborative, theme_color
- ListAudios (join table): list_id, audio_id, position_index

**Key libraries planned:**
- expo-haptics for button feedback
- expo-av for audio playback
- expo-file-system for local caching
- expo-sharing / react-native-share for WhatsApp integration (targeting com.whatsapp)

**Existing codebase:** Initial Expo project scaffolded (initial commit exists)

## Constraints

- **Platform**: Must work on both iOS and Android from v1
- **WhatsApp integration**: Combo send (audio + sticker in one share) depends on WhatsApp's share intent handling — may need fallback to two sequential shares if single attachment isn't supported
- **Share Intent Receiver**: iOS requires a Share Extension (native module), Android uses intent filters — both must be implemented
- **Audio formats**: Must handle at minimum .opus and .m4a (WhatsApp's native formats)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase over Firebase | User preference, Postgres flexibility, built-in auth + storage | — Pending |
| Reference-only clones | Lighter storage, simpler implementation; risk if creator deletes | — Pending |
| Stop-and-restart playback | Cleaner UX for soundboard use case vs overlapping sounds | — Pending |
| Both platforms from v1 | Public launch target requires iOS + Android | — Pending |
| Email + OAuth auth | Wider audience reach, lower friction signup | — Pending |

---
*Last updated: 2026-03-03 after initialization*
