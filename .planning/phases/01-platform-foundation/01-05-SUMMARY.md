---
phase: 01-platform-foundation
plan: 05
subsystem: media
tags: [r2, range, workers, playwright, ffmpeg, ship-gate-scripts]
requires: ["01-02", "01-04"]
provides:
  - "serveMedia: R2 to Response with 206/416/304/405/404, wired ahead of OpenNext at /media/*"
  - "Probe film, poster and env marker in the local and preview buckets"
  - "scripts/verify-live.sh (public | media | admin) and scripts/prepush-check.sh"
affects: ["01-06", "01-07", "01-09", "01-11", "01-12"]
tech-stack:
  added: []
  patterns: ["R2 body streamed untouched into Response", "SHIP_APPROVED=1 gate for production writes"]
key-files:
  created:
    - lib/media/serve.ts
    - tests/workers/media.test.ts
    - scripts/make-probe-media.sh
    - scripts/check-faststart.mjs
    - scripts/upload-probe.sh
    - scripts/verify-live.sh
    - scripts/prepush-check.sh
    - e2e/media.spec.ts
  modified:
    - worker.ts
key-decisions:
  - "Cold and cached: first and repeat Range request both 206 from the Worker, no Workers Cache in Phase 1 (Koss, 2026-10-03)"
  - "If-Range present: Range is ignored and the full 200 is returned"
requirements-completed: [PLAT-02, PLAT-04]
duration: ~25 min
completed: 2026-10-04
---

# Phase 1 Plan 05: Media from R2 and ship-gate scripts Summary

A generated 1080x1920 faststart film and a 720x1280 WebP poster are served from the R2 binding by the Worker with correct Range, conditional and traversal behaviour; `verify-live.sh` and `prepush-check.sh` are ready for the ship gates.

## Commits

- ce57d13 media handler (TDD, 17 tests on Miniflare R2)
- 00171b7 probe generation, faststart check, guarded upload, media e2e
- 336a5e5 verify-live.sh, prepush-check.sh, e2e typing fix

## Verified

- `npx vitest run`: 43 passed (4 files), `tsc --noEmit` clean.
- `npx playwright test e2e/media.spec.ts --project=desktop`: 4 passed (206 first and repeat, 416, 304, poster, env marker "local", traversal 404, WebGL texture ok with `crossOrigin=anonymous`, glError 0).
- Probe files: `test-9x16.mp4` 7,762,584 bytes, duration 10.000000 s; `poster.webp` 28,570 bytes, 720x1280.
- Atom order: `ftyp@0(32) moov@32(11580) free@11612(8) mdat@11620(7750964)`, moov before mdat.
- Preview bucket: `_probe/env.txt` reads back `preview`. Local bucket uploaded.
- `upload-probe.sh production` without SHIP_APPROVED prints a refusal and exits 1 (nothing uploaded to production).
- `verify-live.sh http://localhost:8791 public media admin --env local`: all PASS, exit 0 (output below).
- `prepush-check.sh` exits 0 on the real tree; with a force-tracked `.dev.vars` it exits 1 (reverted, untracked again).
- Port 8791 has no listener at the end (killed by port).

verify-live output (condensed, every line was PASS): public /en /ar /fr status, content-type, wa.me and mailto links, /ar rtl; `/` 307 to /ar, /fr, /en; /en/does-not-exist 404; nosniff; x-frame-options; OFL 200; media film size 7762584, first range 206, content-range, accept-ranges, content-length 2, 2 bytes returned, `PASS cold-and-cached: first 206, repeat 206`, open-end 206, past-end 416, if-none-match 304, CORS `*`, poster 200 image/webp, env marker local, POST 405, traversal 404; admin eight paths, plain and with forged JWT, all not 200 (404 or 308); final line `all checks passed`.

prepush-check output: `PASS no forbidden tracked paths`, `PASS no secret-like content`, three `PASS licence tracked ...`, `INFO repo visibility: PUBLIC`.

## Not verified

- Preview and production URLs (no deploy here; production bucket not touched).
- Real in-browser video seeking: Playwright Chromium does not decode H.264, so seeking is proven at the HTTP Range level and by the 10 s faststart file, not by a playing `<video>`. The signed Media lab (plan 01-09) should be the playback check in a real browser.
- Content-Length 206/200 headers on the deployed runtime: explicit Content-Length worked on local workerd (assumption A5 holds locally).

## Deviations from Plan

1. **[Rule 1 - Bug] Key regex rejected the plan's own probe keys.** RESEARCH's regex `^[a-z0-9]...` refuses `_probe/...`. Now `^[a-z0-9_][a-z0-9._/-]{0,199}$` (case-insensitive); `..`, `.` and empty segments still rejected. Commit ce57d13.
2. **[Rule 1 - Bug] Miniflare R2 answers `Range: bytes=2000000-` with the whole object** (range offset 0, length size) instead of throwing, so the 416 case returned 206. The handler now also reads the requested start from the Range header and returns 416 with `bytes */size` when it is at or past the object size. Same code also covers a thrown error. Commit ce57d13.
3. **[Rule 3 - Blocking] No libwebp in ffmpeg and no `cwebp`.** The poster is encoded with ImageMagick (`magick`, libwebp 1.6.0) as a real WebP; the script tries ffmpeg libwebp, then cwebp, then magick, else stops.
4. **`prepush-check.sh` secret patterns narrowed.** The plan's literal patterns (`sk_live_`, `whsec_`, `CLOUDFLARE_API_TOKEN=`) matched the tracked planning docs that name them. Patterns now require a value: `(sk|rk)_live_` or `whsec_` plus 10+ alphanumerics, `CLOUDFLARE_API_TOKEN=` followed by a non-space, non-quote, non-`$` character, and any PEM private-key header. The script file itself is excluded. Not weakened for real secrets.
5. **e2e desktop skip** uses `test.beforeEach` with `testInfo` because the `test.skip(callback)` form failed `next build` type-checking (e2e is in the tsconfig include).
6. **Worktree base:** the worktree started at 177cbd0 and was reset to bdc24ec as the startup check prescribes (no work lost).
7. Sandbox refused compound shell commands (`;`, heredocs, `&&` chains near git); they were split into single commands. No check weakened. The RED run of Task 1 was folded into the first run (8 of 17 failed before the two fixes above).

## Known Stubs

None.

## Threat Flags

None. T-01-14 to T-01-16 mitigated in `serveMedia` (decode, allow-list, `..` rejection, 405, 416, no JS byte handling); T-01-18 by `prepush-check.sh`; T-01-19 by the SHIP_APPROVED gate. Note for 01-06: repo visibility is PUBLIC.

## Self-Check: PASSED

Files and commits ce57d13, 00171b7, 336a5e5 present.
