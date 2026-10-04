---
phase: 01-platform-foundation
plan: 02
subsystem: ui
tags: [holding-page, next-intl, rtl, self-hosted-fonts, playwright, visual-match]
requires: ["01-01"]
provides:
  - Signed variant C holding page at /en, /ar, /fr, prerendered (SSG)
  - Self-hosted Host Grotesk and IBM Plex Sans Arabic with OFL files
  - public/_headers immutable caching for fonts and static assets
  - e2e/holding.spec.ts with visual match against the signed screenshots
affects: [01-04, 01-05, 01-09]
key-files:
  created: ["app/[locale]/page.tsx", e2e/holding.spec.ts, e2e/__signed__/C-en-desktop.png, e2e/__signed__/C-ar-desktop.png, e2e/__signed__/C-fr-phone.png, public/_headers, public/fonts/host-grotesk/*, public/fonts/ibm-plex-sans-arabic/*]
  modified: ["app/[locale]/layout.tsx", app/globals.css, messages/en.json, messages/ar.json, messages/fr.json]
key-decisions:
  - ".holding main uses display:contents so stage, buttons and footer lay out as the sketch's flex items while keeping a main landmark"
requirements-completed: [PLAT-01, PLAT-04]
duration: 20min
completed: 2026-10-04
---

# Phase 1 Plan 02: Holding page Summary

**Signed variant C (turning gold ring, plum logo, WhatsApp and Email buttons) built in EN/AR(RTL)/FR as static HTML with self-hosted fonts, matching Koss's three signed screenshots within 0.03.**

## Tasks

| Task | Commit |
|---|---|
| 1 Spec, signed baselines, page, copy | 68a388f |
| 2 Styles, fonts, OFL, headers, smoke | f3dbc59 |
| 3 Visual-match checkpoint | not needed (see below) |

## Verified

- `tsc --noEmit` clean; `next build` exits 0.
- `npx playwright test e2e/holding.spec.ts e2e/root.spec.ts`: 30 passed, 24 skipped (root and visual specs run on desktop only). Functional holding cases (lang/dir, slogan, exact wa.me and mailto hrefs, target/rel, logo, language nav and aria-current, fonts loaded, no Google Fonts requests, woff2 from /fonts/, no console errors, ring animation none under reduced motion) pass on desktop, pixel7 and iphone15.
- Visual check: all three signed screenshots (C-en-desktop, C-ar-desktop, C-fr-phone) match within 0.03; no checkpoint needed. Signed baselines untouched (`git diff --stat e2e/__signed__` empty, `cmp` identical to sketch shots). No `mask:`, no `--update-snapshots`.
- Port 8791 free after the run.
- No ttf/otf in public/fonts; OFL.txt beside both font families.

## Next route table

```
┌ ○ /_not-found
├   /[locale]
│ ├ ● /en
│ ├ ● /ar
│ └ ● /fr
└ ƒ /[locale]/[...rest]
```

## .open-next/cache entries

`route-cache/APP_PAGE/2825bf9e.../$/en.cache`, `ar.cache`, `fr.cache` (also copied under `.open-next/assets/cdn-cgi/_next_cache/...`), plus `_global-error.cache` and `_not-found.cache`.

## Not verified

- `npm run lint` not run. Nothing deployed, no cloud calls.
- Actual measured pixel-diff ratios were not printed (tests passed at the 0.03 ceiling).
- Fonts file names unchanged from fontsource, so `files_modified` matches the plan.

## Deviations from Plan

None. The worktree started at an older base and was reset to 62dc5c2 as the start-up check requires.

## Known Stubs

None.

AR/FR copy pending Houssem's review (D-07).

## Self-Check: PASSED
