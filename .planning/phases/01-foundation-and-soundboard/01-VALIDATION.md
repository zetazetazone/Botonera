---
phase: 1
slug: foundation-and-soundboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x with jest-expo preset |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx jest --testPathPattern=src/ --passWithNoTests` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=src/ --passWithNoTests`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | SND-04 | unit | `npx jest src/store/soundboardStore.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | SND-05 | unit | `npx jest src/store/soundboardStore.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | SND-07 | unit | `npx jest src/store/soundboardStore.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | AUD-06 | unit | `npx jest src/store/soundboardStore.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | SND-02 | unit | `npx jest src/services/AudioPlayerService.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | SND-03 | unit | `npx jest src/services/AudioPlayerService.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | AUD-04 | unit | `npx jest src/services/FileCacheService.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | AUD-01 | unit | `npx jest src/utils/fileUtils.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 2 | SND-01 | manual | n/a — UI visual verification | n/a | ⬜ pending |
| 01-03-03 | 03 | 2 | AUD-02 | manual | n/a — modal UI flow | n/a | ⬜ pending |
| 01-03-04 | 03 | 2 | AUD-03 | manual | n/a — sticker attach flow | n/a | ⬜ pending |
| 01-03-05 | 03 | 2 | AUD-05 | manual | n/a — edit modal UI | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jest.config.js` — configure `jest-expo` preset; install with `npx expo install jest-expo jest @types/jest`
- [ ] `src/store/soundboardStore.test.ts` — stubs for SND-04, SND-05, SND-07, AUD-06
- [ ] `src/services/AudioPlayerService.test.ts` — stubs for SND-02, SND-03 (mock expo-audio)
- [ ] `src/services/FileCacheService.test.ts` — stubs for AUD-04 (mock expo-file-system)
- [ ] `src/utils/fileUtils.test.ts` — stubs for AUD-01 (pure function, no mocks)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Grid layout with thumbnails and styled titles | SND-01 | Visual rendering on device | Import 3+ sounds with and without thumbnails; verify grid layout, gradient overlay, centered title |
| Thumbnail/sticker pick from gallery/camera | AUD-02, AUD-03 | Requires device gallery/camera | Use image picker to attach thumbnail and sticker; verify images persist after app restart |
| Edit modal updates name/thumbnail/sticker | AUD-05 | UI interaction flow | Long-press a button, change name/thumbnail, verify changes persist |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
