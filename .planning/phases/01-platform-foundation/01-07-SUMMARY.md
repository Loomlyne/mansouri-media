---
phase: 01-platform-foundation
plan: 07
status: partial
---

# 01-07 — first production deploy (partial)

## Decision change (Koss, 2026-10-04)
Workers Builds import not done: Koss did not know the GitHub app state and answered "i dont know but build", then chose **"You deploy now from here"** in the question form. D-09 amended in 01-CONTEXT.md: the control session deploys after Koss's Ship. GitHub auto-build stays off.

## Deploy (16:08:58 +0400)
- Built from local main (code identical to tag `phase-01-ship-1` = 12ad51c; `git diff --name-only 12ad51c HEAD -- . ':(exclude).planning'` empty). `opennextjs-cloudflare build` exit 0.
- `cf-guard OK: Houssam Portfolio (1c850e50f5cbd5777f020315ccc72718) via OAuth Token`, then `opennextjs-cloudflare deploy` exit 0: 23 assets, Worker `mansourimedia`, Version ID 2532da00-0a86-4c26-b190-0bff85facf01.
- URL: https://mansourimedia.mansourimedia.workers.dev

## Live checks
- `/` → 307 `/en`; `/en`, `/ar`, `/fr` → 200; `/ar` has `<html lang="ar" dir="rtl">`; wa.me/971505085753 and mailto:houssemansouri96@gmail.com present.
- `/admin`, `/api/admin/ping` → 404 (no admin code yet).
- Media: Range 206 first + repeat ("cold-and-cached" per Koss's definition), env marker `production`.
- `verify-live.sh <url> public media --env production`: 35 PASS, 1 FAIL — `media traversal` got 400 (Cloudflare edge rejects `..%2F` before the Worker) vs expected 404. Request is refused either way; fix the check to accept 400|404 in the next code change.
- Screenshots of live EN/AR/FR-phone match signed variant C.

## Still to do in 01-07
- Task 2 CPU per request measurement (wrangler tail).
- Task 3 preview isolation proof — previews no longer come from Workers Builds; needs `wrangler preview` from the control session.
