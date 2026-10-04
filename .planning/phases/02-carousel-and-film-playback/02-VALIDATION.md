---
phase: 2
slug: carousel-and-film-playback
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-04
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source: 02-RESEARCH.md "Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 (`node` project, `tests/*.test.ts`) + @playwright/test 1.63.0 (projects desktop / pixel7 / iphone15) |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` (webServer = `scripts/preview-local.sh`, port 8791, `--var CAROUSEL_LAB:on` from plan 02-01) |
| **Quick run command** | `npx vitest run --project node` |
| **Targeted e2e** | `npx playwright test e2e/<spec>.ts --project=desktop` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | quick < 10 s; targeted e2e 1–3 min (Worker build); full ~6–10 min |

Precondition in every checkout (local R2 is per checkout): `bash scripts/make-seed-media.sh && bash scripts/upload-seed.sh local` before any e2e that loads posters or films. Every carousel e2e URL on every project uses `?probe=off&entry=off` (Chromium WebGL is SwiftShader, Pitfall 3); only the 02-08 "probe verdict" case omits `probe=off`.

---

## Sampling Rate

- **After every task commit:** `npx vitest run --project node` + only the e2e spec the task touches, `--project=desktop` (plus `--project=pixel7` in the same invocation only when the task adds phone-only cases)
- **After every plan wave:** `npx vitest run && npx playwright test` (all three projects); each plan's last task names its wave sample
- **Before `/gsd-verify-work`:** signed-screen comparisons (02-10) + full suite green + gate-off local run + asset scan + evidence map (02-11 Task 1) + `verify-live.sh <preview> public media lab --env preview` + `verify-live.sh <production> public lab --env production` with BUILD_ID (02-11 Task 2), then Koss's numbered device list (02-11 Task 3)
- **Max feedback latency:** 10 s (unit), 180 s (one e2e spec)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | CARO-01 (D-11) | T-02-01, T-02-02 | lab paths 404 unless flag exactly "on"; path tricks normalised | unit | `npx vitest run tests/lab-gate.test.ts` | ❌ W0 (created in task) | ⬜ pending |
| 02-01-02 | 01 | 1 | CARO-01 (D-11) | T-02-03, T-02-04 | production config never sets CAROUSEL_LAB; lab mode checks prerendered cache paths, missing BUILD_ID = FAIL | unit + script | `npx vitest run --project node && bash -n scripts/verify-live.sh` | ✅ (extended) | ⬜ pending |
| 02-02-01 | 02 | 1 | CARO-02, CARO-07 | T-02-06, T-02-10 | neutral seed; keys pass KEY_RE | unit | `npx vitest run tests/seed.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | CARO-02 (D-01, D-02) | T-02-07 | production upload refused, no override; films faststart | unit + script | `bash scripts/make-seed-media.sh && npx vitest run tests/upload-seed-guard.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | CARO-07 (D-14) | T-02-08, T-02-11 | SSR `<ul>` with every title; noindex; seed not in `_next/static` | e2e | `npx playwright test e2e/carousel-lab.spec.ts --project=desktop` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 1 | CARO-02, CARO-05, CARO-06 | T-02-12 | overrides allow-listed; LPM 33 ms stays mobile | unit | `npx vitest run tests/carousel-geometry.test.ts tests/carousel-tiers.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 1 | CARO-01, CARO-08 | T-02-SC, T-02-13, T-02-16 | exact deps; destroy → forceContextLoss; MIT kept | static | `npx tsc --noEmit && npx eslint lib/carousel && bash scripts/prepush-check.sh` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | CARO-01, CARO-02, CARO-03, CARO-08 | T-02-15, T-02-13b | items as server props only; one canvas | e2e | `npx playwright test e2e/carousel.spec.ts --project=desktop` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 2 | CARO-05 | — | — | e2e (wave sample) | `npx playwright test e2e/carousel.spec.ts e2e/carousel-lab.spec.ts` (all projects) | ✅ | ⬜ pending |
| 02-05-01 | 05 | 2 | PLAY-01 | T-02-18 | play() inside the click; React text only | e2e | `npx playwright test e2e/focus-player.spec.ts -g "opens\|desktop size\|phone fit" --project=desktop --project=pixel7` | ❌ W0 | ⬜ pending |
| 02-05-02 | 05 | 2 | PLAY-02, PLAY-03 | T-02-17, T-02-19 | id-only history state; decoder released on close | e2e | `npx playwright test e2e/focus-player.spec.ts --project=desktop --project=pixel7` | ✅ (task 1) | ⬜ pending |
| 02-06-01 | 06 | 3 | PLAY-01 | T-02-21 | synchronous onOpen; no pendingFocus | static + e2e (RED) | `npx tsc --noEmit && grep -q "onOpen(hit.srcIndex)" lib/carousel/engine.js` | ✅ | ⬜ pending |
| 02-06-02 | 06 | 3 | PLAY-01, PLAY-03, CARO-03 | T-02-23 | — | e2e | `npx playwright test e2e/focus-player.spec.ts --project=desktop --project=pixel7` | ✅ | ⬜ pending |
| 02-07-01 | 07 | 4 | CARO-04 | T-02-26 | chips from data, nothing hard-coded | unit + e2e | `npx vitest run tests/carousel-filters.test.ts && npx playwright test e2e/carousel.spec.ts -g "chips" --project=desktop` | ❌ W0 (filters test) | ⬜ pending |
| 02-07-02 | 07 | 4 | CARO-04, CARO-02 | T-02-24 | posters only, ≤ 17 /media requests per view | e2e | `npx playwright test e2e/carousel.spec.ts --project=desktop` | ✅ | ⬜ pending |
| 02-07-03 | 07 | 4 | CARO-05 | T-02-25 | idle render stop | e2e | `npx playwright test e2e/carousel.spec.ts --project=desktop --project=pixel7` | ✅ | ⬜ pending |
| 02-08-01 | 08 | 5 | CARO-06 | T-02-27, T-02-29 | live switch frees GPU; images only in grid | e2e | `npx playwright test e2e/carousel-fallback.spec.ts -g "no webgl2\|reduced motion\|live switch\|overrides" --project=desktop` | ❌ W0 | ⬜ pending |
| 02-08-02 | 08 | 5 | CARO-08, CARO-06 | T-02-28 | context lost → redraw; pagehide destroy; probe=off on every non-probe case | e2e | `npx playwright test e2e/carousel-fallback.spec.ts --project=desktop` | ✅ | ⬜ pending |
| 02-09-01 | 09 | 6 | CARO-07, CARO-03 | T-02-31, T-02-32 | no keyboard trap; live text as text node | e2e | `npx playwright test e2e/carousel-a11y.spec.ts --project=desktop` | ❌ W0 | ⬜ pending |
| 02-09-02 | 09 | 6 | CARO-07 (D-10) | — | — | e2e | `npx playwright test e2e/carousel-a11y.spec.ts --project=desktop --project=pixel7` | ✅ | ⬜ pending |
| 02-10-01 | 10 | 7 | CARO-01, CARO-06, PLAY-01–03 | T-02-41, T-02-42 | signed baselines byte-identical; canvas-only mask rule | visual e2e | `bash scripts/derive-signed-phone.sh && npx playwright test e2e/signed-screens.spec.ts --project=desktop` | ❌ W0 | ⬜ pending |
| 02-10-02 | 10 | 7 | same | T-02-41 | tolerance raised only on Koss's recorded answer | manual checkpoint (conditional) | Koss accepts or asks for changes per screen | n/a | ⬜ pending |
| 02-11-01 | 11 | 8 | all | T-02-35 | gate closed in a real build with flag off; nothing in public assets outside cdn-cgi; evidence map | full + script | `npx vitest run && npx playwright test && test -z "$(find .open-next/assets -path '*carousel*' -not -path '*/cdn-cgi/*')"` | ✅ | ⬜ pending |
| 02-11-02 | 11 | 8 | all (D-15) | T-02-33, T-02-34, T-02-04 | preview on preview bindings; production unchanged | live script (control session) | `bash scripts/verify-live.sh <preview> public media lab --env preview && BUILD_ID=<live> bash scripts/verify-live.sh <prod> public lab --env production` | ✅ | ⬜ pending |
| 02-11-03 | 11 | 8 | all (D-12) | — | — | manual | Koss's numbered device steps 1–13 | n/a | ⬜ pending |
| 02-12-01 | 12 | 9 | all | T-02-37, T-02-45 | Ship only on Koss's own answer; phase-1 precondition | manual | question form | n/a | ⬜ pending |
| 02-12-02 | 12 | 9 | all | T-02-38, T-02-39, T-02-40, T-02-44 | one squash commit = checked tree; lab, seed media and cache paths not served | live script (control session) | `bash scripts/verify-live.sh <prod> public media lab --env production` (+ `admin --team` if phase-1 code ships along) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Requirement coverage: CARO-01 (02-01, 02-03, 02-04, 02-10), CARO-02 (02-02, 02-03, 02-04, 02-07), CARO-03 (02-04, 02-06, 02-09), CARO-04 (02-07), CARO-05 (02-03, 02-04, 02-07), CARO-06 (02-03, 02-08, 02-10), CARO-07 (02-02, 02-09), CARO-08 (02-03, 02-04, 02-08), PLAY-01 (02-05, 02-06, 02-10), PLAY-02 (02-05, 02-10), PLAY-03 (02-05, 02-06, 02-10); all again in 02-11 (UAT + evidence map) and 02-12 (ship).

---

## Wave 0 Requirements

Created inside the first task that needs them (MVP order: failing test first, then the slice):

- [ ] `tests/lab-gate.test.ts` — 02-01 Task 1
- [ ] `tests/seed.test.ts`, `tests/upload-seed-guard.test.ts` — 02-02 Tasks 1–2
- [ ] `e2e/carousel-lab.spec.ts` — 02-02 Task 3
- [ ] `tests/carousel-geometry.test.ts`, `tests/carousel-tiers.test.ts` — 02-03 Task 1
- [ ] `e2e/carousel.spec.ts`, `e2e/helpers/pixels.ts` — 02-04 Task 1
- [ ] `e2e/focus-player.spec.ts` — 02-05 Task 1
- [ ] `tests/carousel-filters.test.ts` — 02-07 Task 1
- [ ] `e2e/carousel-fallback.spec.ts` — 02-08 Task 1
- [ ] `e2e/carousel-a11y.spec.ts` — 02-09 Task 1
- [ ] `e2e/signed-screens.spec.ts`, `scripts/derive-signed-phone.sh`, `e2e/__signed__/02-s3..s6.png` + derived phone baselines — 02-10 Task 1
- [ ] `scripts/make-seed-media.sh` + `scripts/upload-seed.sh` — 02-02 Task 2
- [ ] `scripts/preview-local.sh` `--var CAROUSEL_LAB`, `scripts/verify-live.sh` `lab` mode, wrangler-config assertions — 02-01 Task 2
- [ ] Stage test hooks `data-tier`, `data-entry`, `data-settled`, `data-active`, `data-centred-rect`, `data-focus`, `data-context`; canvas `data-rendering` — 02-04 / 02-06 / 02-07 / 02-08

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Smooth browsing, no heat on iPhone | CARO-05 | real GPU and thermal behaviour | 02-11 Task 3 step 1 |
| Tap plays with sound on iPhone | PLAY-01 | Playwright browsers play unmuted without a gesture (Pitfall 2) | step 2 |
| Low Power Mode → plays or ▶ works; stays 3D | PLAY-02, CARO-06 | LPM cannot be emulated | step 3 |
| Return after backgrounding still draws | CARO-08 | real iOS context loss | step 4 |
| Instagram in-app browser | PLAY-01, PLAY-02 | in-app WebView | step 5 |
| Swipe-back / Android Back closes | PLAY-03 | OS gestures | step 6 |
| Reels swipes on a real phone | PLAY-03 | real touch | step 7 |
| Mid-range Android tier and fps | CARO-05, CARO-06 | real GPU; thresholds A2 | step 8 (`?debug=fps`) |
| iOS Reduce Motion → grid, tap plays | CARO-06 | OS setting | step 9 |
| Arabic mirror on a phone | D-10 | real touch | step 10 |
| Safari + Firefox desktop | CARO-03, PLAY-03 | engines not in the Playwright set | step 11 |
| Gold lens and layout vs s1, s2, s7; feel items A4, A5, A9, A10 | CARO-01 | canvas pixels cannot be diffed against the CSS sketch (s3–s6 DOM screens are compared automatically in 02-10) | step 12 |
| Houssem's phone | PLAY-01, CARO-05 | his device | step 13 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are explicit checkpoints
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (each created by the first task that needs it)
- [x] No watch-mode flags
- [x] Feedback latency < 10 s for unit runs
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (Koss signs the plan)
