---
phase: 1
slug: platform-foundation
status: draft
nyquist_compliant: false
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

- **After every task commit:** `npx vitest run`
- **After every plan wave:** vitest + Playwright against `opennextjs-cloudflare preview` (local workerd)
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
| PLAT-02 | Range → 206/416/304/200 | unit | `npx vitest run tests/media.test.ts` | ❌ W0 | ⬜ pending |
| PLAT-02 | Live 206 first + repeat request; poster loads in WebGL | live + manual | `verify-live.sh`; manual WebGL check | ❌ W0 | ⬜ pending |
| PLAT-03 | Same tables in local / preview / prod; preview bindings ≠ prod | unit + read-back | `npx vitest run tests/wrangler-config.test.ts`; `scripts/wr.sh d1 migrations list` per DB | ❌ W0 | ⬜ pending |
| PLAT-04 | CPU per request recorded under Free limit | manual | Workers metrics, 50 req/route, p50/p99 into SUMMARY | — | ⬜ pending |
| PLAT-05 | JWT gate refuses no/forged/wrong-aud/wrong-iss/expired/alg-none; accepts valid | unit | `npx vitest run tests/access.test.ts` | ❌ W0 | ⬜ pending |
| PLAT-05 | Live `/admin` → Access; `/api/admin/ping` never 200 without login (prod + preview) | live | `verify-live.sh` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts`, `tests/access.test.ts`, `tests/media.test.ts`, `tests/cf-guard.test.ts`, `tests/wrangler-config.test.ts`
- [ ] `playwright.config.ts` (desktop + Pixel 7 + iPhone 15), `e2e/holding.spec.ts`
- [ ] `scripts/verify-live.sh` (exits non-zero on any mismatch)
- [ ] `scripts/make-probe-media.sh` (ffmpeg test pattern, faststart MP4 + WebP poster)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Access path app on workers.dev works | PLAT-05 | Needs Koss's Zero Trust login | Open `/admin` logged out → Access email-code page; log in → admin ping page |
| Build log prints guard OK naming "Houssam Portfolio" | PLAT-01 | Workers Builds log in dashboard | Read the build log of the first deploy |
| CPU per request | PLAT-04 | Dashboard metrics | 50 requests per route, read CPU p50/p99 |
| Poster in WebGL + video seek on live | PLAT-02 | Real browser | Open probe page, seek the video, check console has no CORS error |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
