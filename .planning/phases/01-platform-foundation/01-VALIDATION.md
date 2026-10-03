---
phase: 1
slug: platform-foundation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-03
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source: `01-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x (unit), Playwright 1.63.0 (e2e), bash + curl (live) |
| **Config file** | none — Wave 0 installs `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && npx playwright test && bash scripts/verify-live.sh <base-url>` |
| **Estimated runtime** | ~60 seconds (excluding live) |

---

## Sampling Rate

- **After every task commit:** the task's fast command — `npx vitest run <file>` once vitest exists (01-04 on); before that (01-01, 01-02) `npx tsc --noEmit -p . && npx next build`
- **After every plan wave:** full vitest + Playwright against `opennextjs-cloudflare preview` (local workerd), run once in the last task of the wave's plan (never per task)
- **Before `/gsd:verify-work`:** full suite green + `verify-live.sh` on production and one branch preview
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

Filled by the planner per task; requirement-level map:

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| PLAT-01 | Guard refuses wrong `account_id`, wrong HOME, foreign accounts | unit | `npx vitest run tests/cf-guard.test.ts` | ❌ W0 | ⬜ pending |
| PLAT-01 | EN/AR/FR holding page (lang, `dir=rtl`, wa.me, mailto) per signed sketch C | e2e | `npx playwright test e2e/holding.spec.ts` | ❌ W0 | ⬜ pending |
| PLAT-01 | Live page 200 on workers.dev | live | `bash scripts/verify-live.sh <url>` | ❌ W0 | ⬜ pending |
| PLAT-02 | Range → 206/416/304/200 | unit (real R2 in Miniflare) | `npx vitest run --project workers tests/workers/media.test.ts` | ❌ W0 | ⬜ pending |
| PLAT-02 | Live 206 first + repeat request (Koss's "cold and cached" decision 2026-10-03: both from the Worker, no Workers Cache in Phase 1); poster loads in WebGL | live + manual | `verify-live.sh` (`PASS cold-and-cached: first 206, repeat 206`); signed Media lab page in UAT | ❌ W0 | ⬜ pending |
| PLAT-03 | Same tables in local / preview / prod; preview bindings ≠ prod | unit + read-back | `npx vitest run tests/wrangler-config.test.ts`; `scripts/wr.sh d1 migrations list` per DB | ❌ W0 | ⬜ pending |
| PLAT-04 | CPU per request recorded under Free limit | manual | Workers metrics, 50 req/route, p50/p99 into SUMMARY | — | ⬜ pending |
| PLAT-05 | JWT gate refuses no/forged/wrong-aud/wrong-iss/expired/alg-none; accepts valid | unit | `npx vitest run tests/access.test.ts` | ❌ W0 | ⬜ pending |
| PLAT-05 | Live `/admin` → Access; `/api/admin/ping` never 200 without login (prod + preview) | live | `verify-live.sh` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

### Per-task map (planner, revised 2026-10-03, iteration 2: 01-09 split into 01-09 + 01-10; ship 2 is now 01-11, UAT 01-12; 01-04 moved after 01-02)

| Task | Wave | Requirement | Automated command (per task = fast; wave sample marked W) | Wave 0 file created in |
|------|------|-------------|-------------------|------------------------|
| 01-01 T1 | 1 | PLAT-01 | pinned-version `node -e` check `&&` `grep account_id wrangler.jsonc` | 01-01 T1 |
| 01-01 T2 | 1 | PLAT-01, PLAT-04 | `npx tsc --noEmit -p . && npx next build` | — |
| 01-01 T3 | 1 | PLAT-01, PLAT-04 | W: `npx playwright test e2e/root.spec.ts --project=desktop` (webServer ready-check on `/logo-plum.png`, 200) | 01-01 T3 (playwright.config.ts, e2e/root.spec.ts) |
| 01-02 T1 | 2 | PLAT-01, PLAT-04 | `npx tsc --noEmit -p . && npx next build` (SSG rows for /en /ar /fr) | 01-02 T1 (e2e/holding.spec.ts, e2e/__signed__/*.png) |
| 01-02 T2 | 2 | PLAT-01 | W: `npx playwright test e2e/holding.spec.ts e2e/root.spec.ts` (3 projects; screenshots unmasked, `reducedMotion: "reduce"` + `animations: "disabled"`) | — |
| 01-02 T3 | 2 | PLAT-01 | `npx playwright test e2e/holding.spec.ts --project=desktop` (green, or Koss's recorded OK on the shown diff); `grep -c 'mask:' e2e/holding.spec.ts` = 0 | — |
| 01-03 T1-T3 | 1 | PLAT-01, PLAT-03 | human gates (vitest check, subdomain, GitHub app) — no code | — |
| 01-04 T1 | 3 | PLAT-01 | `npx vitest run tests/cf-guard.test.ts && bash scripts/wr.sh whoami` | 01-04 T1 (vitest.config.ts, tests/cf-guard.test.ts) |
| 01-04 T2 | 3 | PLAT-03 | `npx vitest run tests/wrangler-config.test.ts` | 01-04 T2 |
| 01-04 T3 | 3 | PLAT-03 | `npx vitest run` (node + workers: tests/workers/d1.test.ts); `scripts/wr.sh d1 …` preview read-back | 01-04 T3 (tests/workers/d1.test.ts) |
| 01-05 T1 | 4 | PLAT-02 | `npx vitest run --project workers tests/workers/media.test.ts` | 01-05 T1 (tests/workers/media.test.ts) |
| 01-05 T2 | 4 | PLAT-02 | `node scripts/check-faststart.mjs .probe/test-9x16.mp4 && scripts/wr.sh r2 object get …/env.txt` | 01-05 T2 (scripts/make-probe-media.sh, e2e/media.spec.ts) |
| 01-05 T3 | 4 | PLAT-02, PLAT-05 | W: `npx playwright test e2e/media.spec.ts --project=desktop`; `bash scripts/verify-live.sh http://localhost:8791 public media admin --env local`; `bash scripts/prepush-check.sh` | 01-05 T3 (scripts/verify-live.sh, scripts/prepush-check.sh) |
| 01-06 T1-T3 | 5 | PLAT-01, PLAT-03 | ship gate: full suite + clean clone in `/tmp/mm-ship-1` (`npm ci`, `npx opennextjs-cloudflare build`, `npx vitest run`, Node version recorded); `scripts/wr.sh d1 migrations list mansourimedia-db --remote`; tags `pre-phase-01-ship-1` / `phase-01-ship-1` on origin (re-ship: `-fix<N>`) | — |
| 01-07 T2 | 6 | PLAT-01, PLAT-02, PLAT-04 | `verify-live.sh $SITE_URL public media admin --env production`; `BASE_URL=$SITE_URL npx playwright test e2e/holding.spec.ts` (same unmasked spec); `node scripts/cpu-report.mjs` | 01-07 T2 (scripts/cpu-report.mjs, scripts/tail-capture.sh) |
| 01-07 T3 | 6 | PLAT-03 (D-10) | `verify-live.sh $PREVIEW_URL … --env preview` | — |
| 01-08 T1 | 7 | PLAT-05 | `curl …/cdn-cgi/access/certs` contains `"keys"` | — |
| 01-08 T3 | 7 | PLAT-05 | `verify-live.sh … admin --team $TEAM` on production + preview | — |
| 01-09 T1 | 8 | PLAT-05 | `npx vitest run tests/access.test.ts tests/wrangler-config.test.ts` | 01-09 T1 (tests/access.test.ts, e2e/admin.spec.ts) |
| 01-09 T2 | 8 | PLAT-03, PLAT-05 | `npx vitest run --project workers tests/workers/checks.test.ts && npx vitest run tests/admin-format.test.ts`; W: `npx vitest run && npx playwright test e2e/admin.spec.ts e2e/root.spec.ts --project=desktop`; local verify-live | 01-09 T2 (tests/workers/checks.test.ts, tests/admin-format.test.ts) |
| 01-10 T1 | 9 | PLAT-03, PLAT-05 | `npx tsc --noEmit -p . && npx next build` (/admin dynamic, locales SSG) | — |
| 01-10 T2 | 9 | PLAT-02, PLAT-05 | W: `npx vitest run && npx playwright test` (all specs, admin.spec 403 everywhere); local verify-live | — |
| 01-11 T1-T3 | 10 | PLAT-05, PLAT-01, PLAT-04 | ship gate: full suite + clean clone in `/tmp/mm-ship-2` (Node version recorded); `verify-live.sh … admin --team $TEAM` production + preview; tags `pre-phase-01-ship-2` / `phase-01-ship-2` (re-ship: `-fix<N>`); dashboard fallback if no check run | — |
| 01-12 T1-T3 | 11 | all | Koss UAT (signed admin pages); Koss's Q3 decision; `scripts/wr.sh d1 execute … SELECT … FROM checks` read-back; `cpu-report.mjs` | — |

Note: Phase 1 uses vitest 4.1.11 + @cloudflare/vitest-pool-workers 0.22.0 (two projects: `node`, `workers`); vitest is installed only after Koss's npm check (01-03 T1, slopcheck [SUS] name-similarity flag).


---

## Wave 0 Requirements

- [ ] `vitest.config.ts` (projects `node` + `workers`), `tests/cf-guard.test.ts`, `tests/wrangler-config.test.ts`, `tests/access.test.ts`, `tests/admin-format.test.ts`
- [ ] `tests/workers/d1.test.ts`, `tests/workers/media.test.ts`, `tests/workers/checks.test.ts` (real D1/R2 in Miniflare)
- [ ] `playwright.config.ts` (desktop + Pixel 7 + iPhone 15), `e2e/root.spec.ts`, `e2e/holding.spec.ts`, `e2e/media.spec.ts`, `e2e/admin.spec.ts`
- [ ] `scripts/verify-live.sh` (exits non-zero on any mismatch)
- [ ] `scripts/make-probe-media.sh` (ffmpeg test pattern, faststart MP4 + WebP poster)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Access path app on workers.dev works | PLAT-05 | Needs Koss's Zero Trust login | Open `/admin` logged out → Access email-code page; log in → signed "System check" page, "Run check" writes and reads back (01-12 T1) |
| Build log prints guard OK naming "Houssam Portfolio" | PLAT-01 | Workers Builds log in dashboard | Read the build log of the first deploy |
| CPU per request | PLAT-04 | Dashboard metrics | 50 requests per route, read CPU p50/p99 |
| Poster in WebGL + video seek on live | PLAT-02 | Real browser behind Access | Signed "Media lab" page: poster check ✓, "Jump to 0:06", seek 206 and repeat 206 ✓ (01-12 T1 steps 9-10) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify — every code-producing task has its own command. The only runs of tasks with an `echo` verify are human gates that change no code (01-03 T1-T3; 01-11 T2 → 01-12 T1 → 01-12 T2), so no code goes unsampled; each run is followed by an automated task (01-04 T1, 01-12 T3)
- [x] Wave 0 covers all MISSING references — every file in "Wave 0 Requirements" is created by a named task in the per-task map (01-01 T3, 01-02 T1, 01-04 T1-T3, 01-05 T1-T3, 01-09 T1-T2)
- [x] No watch-mode flags — every command is `vitest run` / `playwright test` without `--ui` or watch (checked by grep across all 12 plans)
- [ ] Feedback latency < 60s — open on purpose: the fast unit commands are under 60 s, but build-bound checks are not (`npx next build` in 01-01 T2, 01-02 T1, 01-10 T1; the wave samples, whose Playwright webServer runs `opennextjs-cloudflare build`; the clean-clone checks in 01-06/01-11). Their output is the build itself, so there is no faster equivalent; they run once per task or wave, never in a loop
- [x] `nyquist_compliant: true` set in frontmatter — consistent with the ticked sampling-continuity and Wave 0 boxes; the open latency box is a speed limit, not a sampling gap

**Approval:** pending — Koss signs the plan (GSD plan gate)
