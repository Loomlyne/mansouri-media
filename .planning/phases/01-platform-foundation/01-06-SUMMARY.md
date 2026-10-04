---
phase: 01-platform-foundation
plan: 06
status: complete
---

# 01-06 Ship 1 — brief (planning note)

Prepared 2026-10-04 15:11 +0400 by the control session (main checkout, branch main).

## What happens on Ship
a. Migration `0000_init.sql` (table `checks`) applied to production D1 `mansourimedia-db` (82b76166…), read back and compared with local + preview.
b. Generated probe film (10 s, 9:16, faststart), poster (720×1280 WebP) and env marker uploaded to production R2 `mansourimedia-media` under `_probe/` (unlinked, no client content).
c. Rollback tag `pre-phase-01-ship-1` on origin/main `177cbd0` pushed first, then migration, then `git push origin main` (29 commits) to public `Loomlyne/mansouri-media`, then tag `phase-01-ship-1` on the new tip.
d. No deploy yet: the first production deploy happens when Koss imports the repo into Workers Builds (plan 01-07), from this SHA.

## Checks (control session, 15:11)
- vitest: 43/43 passed. tsc clean.
- Playwright all projects: 34 passed, 32 skipped (desktop-only signed screenshots and media cases), 0 failed — after loading probe media into this checkout's local R2 (first run failed 4 media cases only because local R2 state lives per checkout).
- prepush-check: exit 0 (repo PUBLIC; no _source/, secrets or .dev.vars tracked; OFL + MIT licences tracked).
- Clean clone `/tmp/mm-ship-1`: npm ci, `opennextjs-cloudflare build` exit 0, vitest 43/43; folder removed. Ran on Node v26.7.0 / npm 11.19.0 (no Node 24 version manager installed); Workers Builds builds on Node 24 from `.node-version`.
- Live: `wrangler deployments list` → Worker `mansourimedia` does not exist yet (code 10007), as expected.

## Readings
- main: aa2d448 (+ this brief commit); origin/main: 177cbd0 = ORIGIN_MAIN_BEFORE.
- Tags: PRE_TAG=pre-phase-01-ship-1, SHIP_TAG=phase-01-ship-1 (none exist on origin).

## Open from 01-03 (not blocking Ship 1; blocking 01-07)
- workers.dev subdomain — pending Koss.
- GitHub app installations for Loomlyne — pending Koss.

## Koss's answer
Koss: "Ship" (question form, 2026-10-04 15:40 +0400).

## Ship record (2026-10-04, +0400)
- 15:40:13 tag `pre-phase-01-ship-1` → 177cbd0 (ORIGIN_MAIN_BEFORE) pushed to origin, before anything else moved.
- 15:40:25 production D1 `mansourimedia-db`: `0000_init.sql` applied (2 commands); `migrations list` → no pending.
- Tables, side by side: production `_cf_KV, checks, d1_migrations, sqlite_sequence` · preview `_cf_KV, checks, d1_migrations, sqlite_sequence` · local `_cf_METADATA, checks, d1_migrations, sqlite_sequence` (local internal table name differs; app tables identical).
- 15:41:25 probe film/poster/env uploaded to production `mansourimedia-media/_probe/`; `env.txt` reads back `production`.
- 15:41:40 prepush-check exit 0, `git push origin main` → 12ad51c; tag `phase-01-ship-1` → 12ad51c pushed. main = origin/main = tag.
- No deploy: Worker `mansourimedia` does not exist until Workers Builds import (01-07).

## Follow-up found at push
GitHub Dependabot: 30 alerts. `npm audit --omit=dev` = 0 (nothing in the shipped Worker). Sources: 25 in `_reference/liquid-glass-carousel/package-lock.json` (upstream reference lockfile, never installed or built) and 5 in dev-only tooling (undici via wrangler/miniflare, eslint, drizzle-kit esbuild). Proposed fix in the next code change: drop the reference lockfile from git; dev tooling follows upstream releases.
