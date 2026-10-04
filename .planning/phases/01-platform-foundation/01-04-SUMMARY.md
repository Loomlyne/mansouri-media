---
phase: 01-platform-foundation
plan: 04
status: complete
subsystem: infra
tags: [cloudflare, d1, drizzle, vitest, cf-guard]
requirements-completed: [PLAT-01, PLAT-03]
---

# Phase 1 Plan 04: Account guard, D1, R2, migration 0000

Guard, wrapper, both D1 databases, both R2 buckets, previews isolation and migration 0000 are done. R2 was first blocked (code 10042) until Koss enabled it; the buckets were then created through scripts/wr.sh.

## Tasks

| Task | Commit | State |
|---|---|---|
| 1 Guard and wr.sh (TDD) | 30c2e64 | done |
| 2 D1 + R2, isolated bindings | 77aad48 | done (R2 buckets created after Koss enabled R2) |
| 3 Migration 0000, drizzle, workers tests | bc7bac2 | done (local + preview, not production) |

## Resources (Houssam Portfolio 1c850e50f5cbd5777f020315ccc72718, via scripts/wr.sh only)

- mansourimedia-db: 82b76166-bcd3-4f51-a913-e58937d73a97
- mansourimedia-db-preview: c099e4a8-0d11-41e7-a7c4-d16e54c5ae57
- R2 mansourimedia-media and mansourimedia-media-preview: created, both listed by `r2 bucket list`

## Table lists (migration 0000_init applied)

- Local (`d1 execute --local`): `_cf_METADATA`, `checks`, `d1_migrations`, `sqlite_sequence`
- Preview (schema export, remote): `d1_migrations`, `checks` (sqlite_sequence is internal)
- `d1 migrations list` for both: "No migrations to apply".
- Production migration pending Ship (01-06). Production DB is empty.

## Verified

- `r2 bucket list` shows mansourimedia-media and mansourimedia-media-preview; `d1 list` shows both databases.
- `npx vitest run`: 26 passed (node: cf-guard 15, wrangler-config 8; workers: d1 3).
- `tsc --noEmit` clean.
- `bash scripts/wr.sh whoami` prints `cf-guard OK: Houssam Portfolio (1c850e50f5cbd5777f020315ccc72718) via OAuth Token`.
- grep gates: no `versions upload`/`preview-alias`; no `getCloudflareContext` outside lib/cf/env.ts; `DB: D1Database` and `MEDIA: R2Bucket` in cloudflare-env.d.ts.

## Not verified / remaining

- Production migration pending Ship (01-06).
- `HOME=/Users/koss node scripts/cf-guard.mjs` exit-1 live check not run (tool refused the HOME override); covered by the unit test "HOME must be ...".

## Deviations

- [Rule 3] `wrangler.test.jsonc` compat date is 2026-08-22, not 2026-10-03: the pool's bundled workerd rejects newer dates.
- [Rule 3] vitest.config.ts imports the ESM-only pool via dynamic `import()` (package is CommonJS-typed).
- [Rule 3] `declare global { interface CloudflareEnv extends Cloudflare.Env {} }` added in lib/cf/env.ts so OpenNext's env type carries the generated bindings; `tests/workers/env.d.ts` added for `cloudflare:test` types.
- Remote preview table list obtained by `d1 export --no-data` because the sandbox refused `d1 execute --command`; `--file` runs but prints no rows remotely.
- `wrangler types` suggests dropping @cloudflare/workers-types; left as is (out of scope).

## Known Stubs

None.

## Self-Check: PASSED (commits 30c2e64, 77aad48, bc7bac2 exist)
