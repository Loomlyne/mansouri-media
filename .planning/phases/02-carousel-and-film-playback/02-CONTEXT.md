# Phase 2: Carousel and Film Playback - Context

**Gathered:** 2026-10-04
**Status:** Ready for sketches, then planning

<domain>
## Phase Boundary

A visitor on a phone or desktop browses Houssem's films in the liquid-glass carousel (ported from `_reference/liquid-glass-carousel`) and watches any of them full height. Covers CARO-01..08 and PLAY-01..03. Runs on seed JSON (phase 3 brings the D1 content model and /admin). Languages (phase 4), booking/WhatsApp (phase 5) and `/work/<slug>` pages (PLAY-04, phase 4) are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Films and content
- **D-01:** Real films come later. Koss: "lets put placeholders now for now". Build and test on **generated test films** (test-pattern clips in every shape: 9:16, 4:5, 1:1, 16:9, with posters), on the dev machine and preview only.
- **D-02:** **No test film ever reaches the live site.** The live home keeps the phase-1 holding page until Houssem's real films are loaded; switching the live home to the carousel is a separate Ship decision for Koss (no placeholders in public — standing rule).
- **D-03:** First version shows **everything Houssem has** (public Vimeo showcases plus the private clinics / products / ads folders) once he provides the files. Source of files still OPEN (Koss did not choose: Houssem export vs Vimeo download) — the engine and seed format must not depend on it.

### Home screen layout
- **D-04:** Centred-film text = **client (line 1) + film title (line 2)**, counter `01/17` at the bottom, as in the reference.
- **D-05:** Industry filters = **bottom bar of chips** (All · Fashion · Beauty & clinics · Real estate · Products · Ads · Content), near the counter, thumb-reachable on phones; chips with zero films are hidden (CARO-04).
- **D-06:** Header = **plum logo left; language switch and menu right**. In phase 2 the menu shows only pages that exist — none yet — so the menu is not rendered until phase 4 (no dead links). Language switch shows EN only until phase 4 delivers AR/FR on the carousel page (or keeps the holding page's three if the page already supports them — planner checks). "Start your project" / WhatsApp come in phase 5.

### Watching a film
- **D-07:** **Sound on** when a film opens (the tap is the user gesture; `play()` called synchronously in the tap handler). Mute button always visible. If the browser blocks unmuted playback, start muted and show a large play/sound button (PLAY-02).
- **D-08:** Next/previous: **phone = reels-style** (swipe up = next, swipe down = previous, swipe down on the first film = close); **desktop = ← → arrows and keys**, Esc closes. Back button closes (history entry per opened film).
- **D-09:** Around the playing film: **client + title at the top, thin gold progress bar, mute, Close**. Nothing else in phase 2 (booking button joins in phase 5).

### Arabic
- **D-10:** In Arabic the carousel **mirrors**: first film on the right, "next" goes left, ←/→ keys swap; drag/swipe still follows the finger 1:1. One `dir` flag in the engine. (Arabic UI itself arrives in phase 4; the engine flag and a test land here.)

### Carried forward (project level)
- White canvas, plum `#251B26` text, gold `#C48C3C` glass ring (was `#009dff`); Host Grotesk / IBM Plex Sans Arabic.
- Panels keep natural aspect; a filter with 2–3 films still fills the row (computed repeats).
- Poster stills in the ring (ring-sized posters ~600×1066 desktop, ~400×712 mobile); focus view plays a DOM `<video playsinline>` over the canvas, not a WebGL video texture.
- Mobile tier: DPR ≤1.5, 8 dispersion samples, no rim blur, idle render stop; low tier / no WebGL / reduced motion → CSS poster grid with the same films and actions.
- Context loss handled; `forceContextLoss()` on destroy; server-rendered `<ul>` of films for SEO / screen readers; keyboard + `aria-live`.
- Keep Yousuf Soomro's MIT notice for ported engine code.

### Claude's Discretion
- Engine API shape, seed JSON schema (must match the phase-3 `WorkItem` contract from ARCHITECTURE research), tier thresholds, test-film generation, exact chip styling within the signed sketches.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md` (CARO-01..08, PLAY-01..03), `.planning/ROADMAP.md` §Phase 2
- `BRIEF.md` — brand colours, design inventory of the reference (CONFIG / LENS / FOCUS / ENTRY values)
- `.planning/research/ARCHITECTURE.md` — engine contract `createCarousel(mount, { items, tier, callbacks })`, FocusPlayer, tiers
- `.planning/research/PITFALLS.md` — mobile GPU, iOS autoplay, context loss, SEO of canvas, RTL
- `.planning/research/STACK.md` §9 — mobile WebGL tier table
- `.planning/research/VIMEO-INVENTORY.md` — film shapes and titles (for realistic test data)

### Reference code
- `_reference/liquid-glass-carousel/lib/carousel/engine.js`, `config.js`, `gui.js`, `Components/CarouselSection.jsx`, `HOW-IT-WORKS.md`, `AGENTS.md`

### Phase 1 (built)
- `.planning/phases/01-platform-foundation/01-CONTEXT.md` (D-04 media via Worker, D-10 previews)
- `.planning/phases/01-platform-foundation/01-05-SUMMARY.md` (media handler, Range 206, probe media scripts)
- `.planning/sketches/01-holding/` (brand assets, logo-plum.png)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `worker.ts` (locale redirect, `/media/*` from R2 with Range), `lib/media/*`, `lib/cf/env.ts`, `lib/i18n/*`, `app/[locale]/*` (holding page), `scripts/make-probe-media.sh` (ffmpeg test film + WebP poster — extend for all shapes), `scripts/upload-probe.sh` (local/preview/production guarded).
- Playwright harness (`scripts/preview-local.sh`, port 8791, desktop/pixel7/iphone15 projects).

### Established Patterns
- Everything Cloudflare through `scripts/wr.sh`; previews via `wrangler preview` with the `previews` block; production deploys only by the control session after Ship.
- Signed sketches in `.planning/sketches/<phase>-<name>/` with DECISION.md; Playwright compares against signed screenshots.

### Integration Points
- Home route `app/[locale]/page` currently renders the holding page; the carousel page must not replace it on live before D-02's Ship.

</code_context>

<specifics>
## Specific Ideas

- Reels-style vertical swiping in the mobile focus view, like Instagram.
- Arabic mirrored like reading direction.

</specifics>

<deferred>
## Deferred Ideas

- Film source decision (Houssem export vs Vimeo download) — open, needed before real content.
- Switching the live home from the holding page to the carousel — Ship decision after real films exist.
- Booking button in focus view — phase 5. `/work/<slug>` share pages — phase 4.

</deferred>

---

*Phase: 02-carousel-and-film-playback*
*Context gathered: 2026-10-04*

## Decisions after research (Koss, 2026-10-04)
- **D-11:** Live safety = **hidden test route**: carousel at `/[locale]/carousel`; `worker.ts` returns 404 there unless `CAROUSEL_LAB=on`; only local + preview set it. Live home stays the holding page. Seed list server-only.
- **D-12:** Real-device UAT on **Koss's iPhone (incl. Low Power Mode), a mid-range Android, and Houssem's phone**.
- **D-13:** Phone film view: vertical films **fill the screen** (cover; thin edge crop on taller phones allowed).
- **D-14:** Test route shows **EN · العربية · FR** links; Arabic mirrors the row; AR/FR copy pending Houssem's review.
- **D-15:** Preview deploys for phone testing are run by the control session only.
- Deferred: wheel → page-scroll handover when sections are added below the carousel (phase 4).
