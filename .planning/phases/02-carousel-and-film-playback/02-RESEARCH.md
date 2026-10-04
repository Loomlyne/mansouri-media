# Phase 2: Carousel and Film Playback - Research

**Researched:** 2026-10-04
**Domain:** three.js liquid-glass carousel (ported from the MIT reference), DOM video focus player, mobile/low-GPU tiers, accessibility, inside Next.js 16 + OpenNext on Cloudflare Workers (Free plan)
**Confidence:** HIGH for the code facts (reference engine, three r186 source, Next 16.3.8 source and the Playwright browsers were read or run in this session). MEDIUM for the mobile behaviour (iOS gesture rules and Low Power Mode come from official or multiple sources, but they still have to be checked on real phones). LOW only where marked.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Films and content
- **D-01:** Real films come later. Koss: "lets put placeholders now for now". Build and test on **generated test films** (test-pattern clips in every shape: 9:16, 4:5, 1:1, 16:9, with posters), on the dev machine and preview only.
- **D-02:** **No test film ever reaches the live site.** The live home keeps the phase-1 holding page until Houssem's real films are loaded; switching the live home to the carousel is a separate Ship decision for Koss (no placeholders in public — standing rule).
- **D-03:** First version shows **everything Houssem has** (public Vimeo showcases plus the private clinics / products / ads folders) once he provides the files. Source of files still OPEN (Koss did not choose: Houssem export vs Vimeo download) — the engine and seed format must not depend on it.

#### Home screen layout
- **D-04:** Centred-film text = **client (line 1) + film title (line 2)**, counter `01/17` at the bottom, as in the reference.
- **D-05:** Industry filters = **bottom bar of chips** (All · Fashion · Beauty & clinics · Real estate · Products · Ads · Content), near the counter, thumb-reachable on phones; chips with zero films are hidden (CARO-04).
- **D-06:** Header = **plum logo left; language switch and menu right**. In phase 2 the menu shows only pages that exist — none yet — so the menu is not rendered until phase 4 (no dead links). Language switch shows EN only until phase 4 delivers AR/FR on the carousel page (or keeps the holding page's three if the page already supports them — planner checks). "Start your project" / WhatsApp come in phase 5.

#### Watching a film
- **D-07:** **Sound on** when a film opens (the tap is the user gesture; `play()` called synchronously in the tap handler). Mute button always visible. If the browser blocks unmuted playback, start muted and show a large play/sound button (PLAY-02).
- **D-08:** Next/previous: **phone = reels-style** (swipe up = next, swipe down = previous, swipe down on the first film = close); **desktop = ← → arrows and keys**, Esc closes. Back button closes (history entry per opened film).
- **D-09:** Around the playing film: **client + title at the top, thin gold progress bar, mute, Close**. Nothing else in phase 2 (booking button joins in phase 5).

#### Arabic
- **D-10:** In Arabic the carousel **mirrors**: first film on the right, "next" goes left, ←/→ keys swap; drag/swipe still follows the finger 1:1. One `dir` flag in the engine. (Arabic UI itself arrives in phase 4; the engine flag and a test land here.)

#### Carried forward (project level)
- White canvas, plum `#251B26` text, gold `#C48C3C` glass ring (was `#009dff`); Host Grotesk / IBM Plex Sans Arabic.
- Panels keep natural aspect; a filter with 2–3 films still fills the row (computed repeats).
- Poster stills in the ring (ring-sized posters ~600×1066 desktop, ~400×712 mobile); focus view plays a DOM `<video playsinline>` over the canvas, not a WebGL video texture.
- Mobile tier: DPR ≤1.5, 8 dispersion samples, no rim blur, idle render stop; low tier / no WebGL / reduced motion → CSS poster grid with the same films and actions.
- Context loss handled; `forceContextLoss()` on destroy; server-rendered `<ul>` of films for SEO / screen readers; keyboard + `aria-live`.
- Keep Yousuf Soomro's MIT notice for ported engine code.

### Claude's Discretion
- Engine API shape, seed JSON schema (must match the phase-3 `WorkItem` contract from ARCHITECTURE research), tier thresholds, test-film generation, exact chip styling within the signed sketches.

### Deferred Ideas (OUT OF SCOPE)
- Film source decision (Houssem export vs Vimeo download) — open, needed before real content.
- Switching the live home from the holding page to the carousel — Ship decision after real films exist.
- Booking button in focus view — phase 5. `/work/<slug>` share pages — phase 4.

### Signed design (`.planning/sketches/02-carousel/DECISION.md`, signed by Koss 2026-10-04, as is)
s1 desktop home · s2 phone home (panels ~360 px tall, chips scroll sideways) · s3 desktop film (white backdrop, client + title top centre, Close top right, ← → round buttons, film at full height `100% − 120px`, gold progress bar + round mute on the film) · s4 phone film (full screen, white client/title/Close at top, progress + mute at the bottom) · s5 blocked autoplay (dimmed poster, large white round ▶) · s6 no-3D grid (two columns, posters in their shapes, client + title under each, chip bar fixed at the bottom) · s7 Arabic mirrored. The hint texts in the sketch are notes, not UI copy.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CARO-01 | Liquid-glass carousel, white canvas, plum text, gold ring | Engine port §1 (uniform `uBlueColor` → gold, data-driven items); signed s1/s2; Pattern 1 |
| CARO-02 | Natural shape per panel; a 2–3 film row still fills the screen | Port §1 edits E5–E7 (panel height from the viewport, computed `REPEATS`, pool rebuild); unit tests in `geometry.test.ts` |
| CARO-03 | Wheel, drag, flick, swipe; settles; counter and text follow | Reference input system kept as is (invariants); `step()`/`goTo()` for keys; `onActiveChange`/`onSettle` callbacks |
| CARO-04 | Industry filters; empty industries hidden | `setItems()` (E8), texture cache, `visibleIndustries()` pure function; seed covers an empty industry |
| CARO-05 | Touch carousel at a lighter quality; a vertical swipe scrolls the page | `touch-action: pan-y` + `pointercancel` (MDN); mobile tier table; idle render stop (E14) |
| CARO-06 | Poster grid when there is no WebGL2, the GPU is weak, or reduced motion is on | `detectTier()` + FPS probe; three r186 needs **WebGL2**; one `<FilmList>` with two styles |
| CARO-07 | Keyboard, screen reader announcement, real HTML list that is indexed | Server-rendered `<ul>`, roving keys on the carousel region, debounced `aria-live` |
| CARO-08 | Recovers from a dropped context; frees the GPU on leave | three r186 handles lost/restored itself; engine stops rAF and resumes; `dispose()` + `forceContextLoss()` (E15–E16); e2e with `WEBGL_lose_context` |
| PLAY-01 | Tap opens focus, the film plays at once, vertical films at full height | `play()` synchronously inside the click (HTML activation rules), one persistent `<video>`, `onOpen` fired synchronously by the engine (E11), focus rect callback (E12) |
| PLAY-02 | Blocked playback → a working play button | Handle the `play()` promise; `NotAllowedError` → s5 state; `AbortError` ignored; e2e stubs `play()` |
| PLAY-03 | Sound on/off, next/prev, close by Close/Esc/swipe down/Back | `pushState` without a URL (Next 16.3.8 copies `__NA`, verified in its source), `replaceState` on next/prev, `touchend` swipe, keys |
</phase_requirements>

## Project Constraints (from CLAUDE.md / CLAUDE.local.md)

- Hosting is Cloudflare Workers + R2 + D1 in **Houssem's account `1c850e50…`** only. Every wrangler call goes through `scripts/wr.sh` (with `HOME=/Users/koss/.mansouri-cloudflare` and `cf-guard`). Never use the default Vamos login.
- **Workers Free plan.** Pages are static (prerendered) and handlers stay tiny. Measured CPU today: /en p99 5 ms (01-07). The carousel page must stay static.
- **No `proxy.ts`/`middleware.ts`, no `runtime = "edge"`, no `next/image`, no `next/font`.** Bindings are read only in `lib/cf/env.ts` (`getCloudflareContext`) or in `worker.ts`.
- Pinned stack: Next 16.3.8, React 19.3.0, OpenNext 1.20.8, wrangler 4.147.0, TS 6.0.3, Tailwind 4.3.3, Playwright 1.63.0, vitest **4.1.11** (not 5.x; the installed version). three **0.186.1 exact (no caret)**, GSAP 3.15.0. `engine.js` stays plain JS (`allowJs`); anything touching auth, money or the DB is TS.
- Keep the MIT notice (Yousuf Soomro). No Behance images, no Lay Grotesk. `prepush-check.sh` requires `_reference/liquid-glass-carousel/LICENSE` to be tracked.
- No invented numbers, testimonials, prices or legal copy. No placeholders in public. **No fake controls, no dead links.**
- EN / AR (RTL) / FR. Claude drafts AR/FR and Houssem checks them.
- GSD: Koss signs discuss, plan, UAT and ship. Only the control session commits on `main`, deploys and writes to production R2/D1. Work sessions use `.claude/worktrees/<name>`.
- Never pattern-kill processes. Kill by port only (`lsof -nP -iTCP:8791 -sTCP:LISTEN -t | xargs kill`).
- The reference `AGENTS.md` invariants apply to the ported engine (see Pattern 1).

## Summary

The reference engine (`_reference/liquid-glass-carousel/lib/carousel/engine.js`, 1,255 lines) is a well-built desktop demo. Five things tie it to its demo, and the port must remove them:
- The image list is a hard-coded import (`PROJECTS`, L16/L50).
- Panel height (`CONFIG.PANEL_H` = 450) and `REPEATS = 4` (L144) are fixed.
- The focus scale is a fixed 1.18 (L916).
- Focus opens either inside the click or after a glide in the rAF loop (L839–848, L1171–1177).
- The canvas owns every touch gesture (`touch-action: none`, L608).

Everything else carries over: the scroll/snap/drag physics, the "GSAP tweens numbers, `layout()` reads them" rule, and the two-pass lens. The port is a list of about 17 targeted edits (§ Engine port plan), plus a small pure `geometry.js` module so the maths can be unit-tested without WebGL.

Three findings from this session change the plan:
1. **three r186 needs WebGL2.** It throws "WebGL 1 is not supported since r163". So the no-3D test is `getContext('webgl2')`, not `webgl`.
2. **three already handles `webglcontextlost`/`restored`.** It calls `preventDefault`, flags the loss and re-initialises GL state on restore. The engine only has to stop and restart its own loop, and call `dispose()` then `forceContextLoss()` on destroy.
3. **Next 16.3.8 patches `history.pushState`** to copy its `__NA` marker. A plain `history.pushState({ mmFilm: id }, "")` with no URL is therefore safe for "Back closes the film". Without the patch, Next's popstate handler would hard-reload the page.

Playback must start inside the tap. The HTML spec's activation-triggering events are `keydown` (not Esc), `mousedown`, mouse `pointerdown`, non-mouse `pointerup` and `touchend`. The `click` that follows them is inside the activation. WebKit's leftover "unlock" window is time-limited and shrinks under Low Power Mode, so it must not be relied on. The design is therefore:
- **One persistent `<video>` element**, always mounted.
- The engine fires `onOpen(index)` **synchronously** from its click/key handler, for centred *and* off-centre panels. Off-centre panels glide to the centre as part of the focus animation, not before it.
- The host calls `video.play()` right there, through a ref, never through React state plus an effect.
- The same rule applies to next/prev (`touchend`, `click`, `keydown`) and to the s5 play button.

D-02 has a cheap, fail-closed answer. The carousel lives at **`/[locale]/carousel`** (static, prerendered). `worker.ts` returns 404 for that path unless a var `CAROUSEL_LAB === "on"` is set. The var is set in the `previews` block and passed locally with `--var CAROUSEL_LAB:on`; production never gets it. Seed media goes to the local and preview R2 buckets only. Prerendered page payloads sit under `/cdn-cgi/_next_cache/…`, and the live edge refuses those paths with **error 1042** (checked against the live Worker today). The gated page's data is therefore reachable only through the Worker path that the gate guards.

**Primary recommendation:** Port the engine into `lib/carousel/` as data-driven JS with a typed `engine.d.ts`. Host it in one `'use client'` component that decides the tier and then `import()`s the engine. Play film through one persistent `<video>` started synchronously in the gesture. Ship it behind the `/[locale]/carousel` + `CAROUSEL_LAB` gate on seed JSON whose `WorkItem` type is the shared contract with phase 3.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Carousel rendering, scroll physics, lens, focus geometry | Browser (engine.js, WebGL2) | — | Per-frame GPU work; framework-free by invariant |
| Tier decision (desktop / mobile / grid), FPS probe, reduced-motion live switch | Browser (host component) | — | Needs `matchMedia`, WebGL probe, rAF timing |
| Film playback, mute, progress, next/prev, history | Browser (FocusPlayer, DOM `<video>`) | CDN/Worker `/media/*` (Range 206) | Hardware decode + user-gesture rules live in the DOM |
| Film list `<ul>` (SEO, screen readers, grid fallback) | Frontend server (prerendered RSC/HTML at build) | Browser (styling per tier) | Must exist in page source without JS |
| Page shell, header, chips labels (messages) | Frontend server (static prerender per locale) | — | Free plan: no per-request rendering |
| Seed works list (phase 2) → D1 works (phase 3) | Frontend server (server-only module) | Database (D1, phase 3) | Keeps titles out of `/_next/static` client chunks |
| D-02 gate (no carousel/test films on production) | API/Worker (`worker.ts` before OpenNext) | Storage (seed media only in local/preview R2) | Fail-closed at the edge entry, independent of the build |
| Posters + films bytes | Storage (R2) served by Worker `/media/*` | Browser cache (`immutable`) | Decided in phase 1 (D-04): no r2.dev, no custom media domain yet |

## Standard Stack

### Core (new in this phase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `three` | **0.186.1** (exact, no caret) | WebGL2 renderer, FBO, ShaderMaterial for the lens | The reference engine is built on it. Latest is 0.186.1 (registry, modified 2026-09-24). WebGL2 only since r163 [VERIFIED: three source `src/renderers/WebGLRenderer.js` L61/L102] |
| `gsap` | **3.15.0** | Focus/entry timelines that tween plain numbers | The reference engine's tweener. "Standard 'no charge' license" [VERIFIED: npm registry `license` field] |

### Already in the repo (reused)
| Library | Version | Use in phase 2 |
|---------|---------|----------------|
| next / react | 16.3.8 / 19.3.0 | `'use client'` host, `next/dynamic`/`import()` for lazy engine |
| next-intl | 4.14.9 | `Carousel` messages namespace (chips, "View", Close, aria strings) |
| @playwright/test | 1.63.0 | e2e on desktop (Chromium/SwiftShader), pixel7 (Chromium), iphone15 (WebKit/Apple GPU) |
| vitest | 4.1.11 | `node` project for pure carousel modules (`tests/*.test.ts`) |
| ffmpeg 9.0.2 + ImageMagick 7.1.2 | system | Test films and WebP posters (ffmpeg has **no libwebp and no drawtext**) |

### Supporting (dev only, optional)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lil-gui` | 0.21.0 | Lens tuning panel (port of reference `gui.js`) | Only `import()`ed under `?gui` when `process.env.NODE_ENV !== "production"`. Skip it if the gold tuning is done by editing config values |

**Not needed:** `@types/three` (the engine stays JS; the host types it through a hand-written `lib/carousel/engine.d.ts`), `zod` (seed validated by a small test), `@axe-core/playwright` (optional, not required by any criterion).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DOM `<video>` over canvas | `THREE.VideoTexture` | Rejected in project decisions: per-frame upload, gesture/CORS issues |
| Same-origin `/media/*` via Worker | R2 custom domain | Phase 1 D-03/D-04: no domain yet. Each poster is one Worker invocation (see Pitfall 10) |
| Separate gated route | Home `/[locale]` switching by env var | Needs a dynamic page or a rewrite. The gated route keeps the home static and untouched |

**Installation:**
```bash
npm install --save-exact three@0.186.1 gsap@3.15.0
npm install --save-dev --save-exact lil-gui@0.21.0   # optional, dev-only tuning
```

**Version verification (this session):** `npm view three version` → 0.186.1; `npm view gsap version` → 3.15.0; `npm view lil-gui version` → 0.21.0; `npm view @types/three version` → 0.186.0 (not used).

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| three | npm | since 2012-12 | 24.0M/wk | github.com/mrdoob/three.js | [OK] | Approved |
| gsap | npm | since 2014-08 | 7.0M/wk | github.com/greensock/GSAP | [OK] | Approved |
| lil-gui (dev, optional) | npm | 0.21.0 modified 2025-10-12 | 315k/wk | github.com/georgealways/lil-gui | [OK] | Approved |

No `postinstall` scripts on any of the three (`npm view <pkg> scripts.postinstall` empty). Note: slopcheck ran `npm install` in `/tmp/p2probe` as part of its check. Nothing was installed in the repo.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 build time (next build / opennextjs-cloudflare build)
   content/seed/works.json ──► lib/content/seed.ts (server-only) ──► WorkItem[] + per-locale text
                                                                        │
   app/[locale]/carousel/page.tsx (static, generateStaticParams en/ar/fr) ◄┘
     ├─ <SiteHeader>  logo + language links (to /xx/carousel)
     ├─ <FilmList>    <ul> of films (text only in SSR HTML)   ← SEO / screen readers / grid
     └─ <CarouselHost items labels dir>  ('use client')
                                                                        
 request time
   GET /en/carousel ─► worker.ts ──[CAROUSEL_LAB !== "on"]──► 404   (production)
                          │ on (preview / local --var)
                          ▼
                     OpenNext static-assets cache ─► prerendered HTML

 browser
   CarouselHost mounts
     └─ detectTier(): ?tier override → reduced motion? → webgl2 (failIfMajorPerformanceCaveat)? → coarse/width
          ├─ "grid"  → reveal <FilmList> as 2-col poster grid (+chips) ───────────────┐
          └─ "desktop"/"mobile" → import("lib/carousel/engine") (three+gsap, ~156 KB gz)│
                createCarousel(mount, {items, tier, dir, callbacks})                    │
                  ├─ TextureLoader GET /media/<ring poster>  (Worker → R2, immutable)   │
                  ├─ onActiveChange/onSettle → client/title/counter + aria-live         │
                  ├─ FPS probe (onPerf) → setTier(low) or host switches to grid ───────►┤
                  ├─ chips → engine.setItems(filtered)                                  │
                  └─ tap/Enter on panel → onOpen(i) (synchronous, inside the gesture)   │
                                               ▼                                        ▼
                                FocusPlayer.start(item)  ── video.src=/media/<film>.mp4; play()  (same tap)
                                  ├─ play() resolves → playing, sound on
                                  ├─ rejects NotAllowedError → s5 ▶ (tap → play())
                                  ├─ onFocusRect(rect) per frame → video box follows the panel
                                  ├─ history.pushState({mmFilm}) ; next/prev → replaceState
                                  └─ Close / Esc / swipe-down-on-first / popstate → close → engine.closeFocus()
                                         GET /media/<film> Range → 206 (Worker → R2)
```

### Recommended Project Structure
```
lib/carousel/
├── engine.js         # ported engine (MIT header kept), data-driven, framework-free
├── engine.d.ts       # typed handle + options for the TS host
├── config.js         # CONFIG/INTERACT/LENS/FOCUS/ENTRY (gold), no PROJECTS
├── tiers.js          # TIERS {desktop, mobile, low} knob tables + detectTier() + fpsVerdict()
├── geometry.js       # pure: panelHeight, computeRepeats, focusRect, toScreenX, wrapDelta
├── gui.js            # dev-only lil-gui (optional)
├── LICENSE           # copy of the reference MIT LICENSE (Yousuf Soomro)
└── CHANGES.md        # divergences from upstream @6d770c9
lib/content/
├── work-item.ts      # WorkItem type + INDUSTRIES enum (shared contract with phase 3)
└── seed.ts           # import "server-only"; reads content/seed/works.json; validates
content/seed/works.json
components/carousel/
├── CarouselHost.tsx  # 'use client': tier, engine lifecycle, overlay text, chips, a11y
├── FocusPlayer.tsx   # 'use client': persistent <video>, imperative start()/close()
├── FilmList.tsx      # server: <ul> (sr-only in GL mode, grid in grid mode)
├── FilterChips.tsx
└── SiteHeader.tsx
app/[locale]/carousel/page.tsx
scripts/make-seed-media.sh   # extends make-probe-media.sh to every shape
scripts/upload-seed.sh       # local | preview only (production refused, no override)
tests/carousel-geometry.test.ts  tests/carousel-tiers.test.ts  tests/seed.test.ts
e2e/carousel.spec.ts  e2e/focus-player.spec.ts  e2e/carousel-fallback.spec.ts  e2e/carousel-a11y.spec.ts
```

### Pattern 1: Keep the reference invariants (from `_reference/.../AGENTS.md`)
- The engine talks to the host only through callbacks and the returned handle. No React import, ever.
- GSAP tweens plain numbers (`drop[]`, `pEntry[]`, `growArr[]`, `focusScale`, `lensFx`); `layout()` derives the meshes.
- One easing system. Input moves only `target`; `scroll` only lerps. **New APIs (`step`, `goTo`, keyboard) also move `target` only.**
- Snap is triggered by idle time (`SNAP_IDLE_MS`).
- `updateCursor()` is the only cursor writer.
- The drag→`suppressClick` handshake stays.
- The FBO is sized in device pixels.
- Mipmaps stay.
- 1 unit = 1 px.
- Unbounded panel indices.
- `onFocusChange(false)` fires at the *start* of close, while `focusState.active` stays true until the timeline ends.

### Engine port plan (exact edits; line numbers are the reference `engine.js` / `config.js`)

| # | Where (reference) | Edit |
|---|---|---|
| E1 | engine L1–12 header | Keep the original comment. Prepend `// Based on liquid-glass-carousel by Yousuf Soomro (MIT), upstream 6d770c9 — see lib/carousel/LICENSE. Changes: lib/carousel/CHANGES.md`. Same for `config.js`/`gui.js`. Copy `_reference/liquid-glass-carousel/LICENSE` to `lib/carousel/LICENSE` and add it to `prepush-check.sh`'s licence list |
| E2 | L14–16 imports | `import * as THREE` → named imports (`WebGLRenderer, Scene, OrthographicCamera, TextureLoader, LinearMipmapLinearFilter, LinearFilter, SRGBColorSpace, Mesh, PlaneGeometry, MeshBasicMaterial, WebGLRenderTarget, ShaderMaterial, Vector2, Vector3, Color`). Drop `PROJECTS`. Deep-copy `CONFIG/INTERACT/LENS/FOCUS/ENTRY` per instance (`structuredClone`): `setInteraction` (L855–869) mutates the module-level `INTERACT` today, which leaks across StrictMode remounts |
| E3 | L18–25 signature | `createCarousel(mount, { items, tier, dir = "ltr", startIndex = 0, playEntry = true, cursorElement, onActiveChange, onSettle, onOpen, onFocusChange, onFocusRect, onFocusSettled, onEntryDone, onContextLost, onContextRestored, onPerf })`. `items` = `[{ id, aspect, src }]` (src = ring poster URL for this tier) |
| E4 | L31–35 renderer | `antialias: false` (the scene renders into a non-MSAA FBO), `alpha: false`, `powerPreference: tier.name === "desktop" ? "high-performance" : "default"`, `setPixelRatio(Math.min(devicePixelRatio, tier.dprCap))`. Wrap in `try/catch`; on failure throw `CarouselInitError` so the host falls back to the grid (three throws without WebGL2) |
| E5 | L49–75 sources | Build from `items`: `aspect = item.aspect` (from stored width/height), `locked: true`. Load through a **module-level `Map<url, Promise<Texture>>`** so `setItems` and remounts never re-download. Anisotropy `Math.min(tier.aniso, renderer.capabilities.getMaxAnisotropy())` (L62). three's `Loader.crossOrigin` already defaults to `'anonymous'` (verified source L32); `/media` is same-origin anyway |
| E6 | L78–80, L454, L480, L533–535 | Replace every `CONFIG.PANEL_H` with a variable `panelH = geometry.panelHeight(W, H, tier)`. Recommended: desktop `clamp(320, round(0.5·H), 620)` (= 450 at 900 px, as in s1); mobile `clamp(260, round(0.43·H), 420)` (≈ 360 at 844, as in s2). Recompute on resize |
| E7 | L144–157 pool | `REPEATS = geometry.computeRepeats(totalWidth, W, buffer)` = `max(3, ceil((W + 2·buffer) / totalWidth) + 1)`. Wrap in `rebuildPool()`. Use **one shared `PlaneGeometry(1,1)`** and **one material per source** (copies share it), and re-allocate `drop/pEntry/growArr/lastCenterX` (L419–431) to `REPEATS·N`. Placeholder colour `0xdddddd` → a light brand neutral (e.g. `#efeaef`, discretion) |
| E8 | new | `setItems(items, { index })`: kill tweens, rebuild sources/offsets/pool, reset `p.bound`, keep the centred film if it is in the new list (else index 0), set `scroll = target = centerForIndex(idx)`. Filter transition: 150 ms canvas fade or a short rise-only entry (feel-check) |
| E9 | L208 `uBlueColor`, config L93 | `LENS.blueColor = "#C48C3C"` (rename the key to `ringColor`, keeping a `uBlueColor` alias for the GUI). On a white canvas the white nova (`whiteGlow`) and white rim line (`rimLine`) only show over panels: tune `glow`, `blueRing`, `rimLine` against s1/s2 in one timeboxed session (lil-gui) |
| E10 | L213 `uSamples`, shader L259–339 | Remove `uSamples`/`MAX_SAMPLES`. `ShaderMaterial({ defines: { SAMPLES: tier.samples, USE_BLUR: tier.blur ? 1 : 0 } })`. Loop `for (int i = 0; i < SAMPLES; i++)`. Precompute the three Gaussian weights per sample on the CPU into `uniform vec3 uW[SAMPLES]`, replacing the `exp(pow())` at L331–335. Wrap the blur block (L341–356) in `#if USE_BLUR`. A tier change sets `lensMat.defines` + `needsUpdate = true` (one recompile) |
| E11 | L828–850 onClick, L872–936 openFocus | `openFocus(hit)` focuses **any** visible panel. It sets `focusState.poolIdx = hit.poolIdx`, `target = centerForIndex(nearestIndex(scroll + hit.centerX))` (the glide is part of the focus timeline), and ranks the drop wave by distance from `hit`. **Call `onOpen(srcIndex)` synchronously before returning**, so the host plays inside the click. Remove `pendingFocus` for clicks (L839–848, L1170–1178). Remove the `!src.tex` guard (L875): a tap before the poster loads must still open (the `<video poster>` covers it). Add `open()` (centred panel), used by the host on Enter/Space |
| E12 | L497–502, L916 | Focus scale computed: `centerScale = geometry.focusRect(aspect, W, H, tier).h / panelH` (desktop: height `H − 120`, width capped at `W − 2·96` for the arrow gutters; mobile: contain-fit in the viewport). Each tick while focus is opening/closing/open, emit `onFocusRect({x, y, w, h})` in CSS px (screen coords, after the `dir` flip). Emit `onFocusSettled(open)` from the timeline `onComplete` |
| E13 | L463–466, L571–585, L765, L726 | **RTL `dir` flag**, applied only at the screen boundary: `sgn = dir === "rtl" ? -1 : 1`; mesh `x = sgn·finalX`; `panelRects` built from `sgn·centerX`; drag `target -= dx·sens·sgn` (the finger is still followed 1:1); wheel: `deltaY` unchanged (logical next), `deltaX·sgn`; normalise `deltaMode === 1` (lines ×16). `nearestIndex`/`centerForIndex` stay logical. Keys are mapped in the host (`ArrowLeft` = next in RTL) |
| E14 | L1113–1200 tick | **Render on demand.** `active = dragging ∥ |target−scroll| > 0.05 ∥ velocity ≠ 0 ∥ scrollEnergy > 0.001 ∥ entryAnim/focusState.anim isActive() ∥ (tier.continuous && !focusSettled)`. When not active: render one last frame, set `raf = 0`, stop. Every input handler, `setItems`, `resize`, `goTo/step/open` calls `kick()`. Mobile tier `continuous: false` (the shimmer freezes when idle); desktop `continuous: true`. Always stop when the focus is settled (the video covers the panel), on `visibilitychange` hidden, and when an IntersectionObserver reports the canvas off-screen |
| E15 | new listeners | `webglcontextlost`: stop rAF, `onContextLost()`. `webglcontextrestored`: three re-inits GL state itself (`onContextRestore` → `initGLContext`, verified source L1123–1145); textures and the render target re-upload lazily on the next render because the property maps are fresh. Then `kick()` + `onContextRestored()`. The host adds a safety net: still lost 1.5 s after `visibilitychange` → visible, then re-create the engine; if that fails, show the grid |
| E16 | L1219–1245 destroy | Order: `destroyed = true` → cancel rAF → remove listeners, ResizeObserver, IO → kill tweens → dispose geometries/materials/rt/lens → dispose textures in the cache → `renderer.dispose()` → **`renderer.forceContextLoss()`** → remove canvas. Callbacks are no-ops after `destroyed` (forceContextLoss fires `webglcontextlost`). Same order as the sister project (Koussay-Portfolio `Carousel.jsx` L1971) |
| E17 | L174, L1205–1217 resize | `dpr` becomes a variable. Use a `ResizeObserver` on `mount`. Mount height `100svh` (stable while the iOS URL bar moves). On resize: recompute `panelH`, `recomputeTotal()`, `rebuildPool()` if `REPEATS` changed, `rt.setSize(W·dpr·tier.fboScale, H·dpr·tier.fboScale)`, re-centre `scroll = target = centerForIndex(currentIdx)`, update the focus rect if focused |
| E18 | L1002–1101 entry | The entry walk (L511–569, L1050–1064) assumes **one visible copy per source** and hides other reps (L528–532). With 1–3 films it leaves gaps. Rewrite the walk over unbounded indices around the centre (`idx = c + k`, pool slot `mod(floor(idx/N), REPEATS)·N + mod(idx, N)`), or (simpler) run the entry only when `N ≥ 6`. The entry is about 4.5 s (rise 1.0 + grow 2.15 + bloom 1.4): shorten it on mobile and skip it on a revisit (sessionStorage); feel-check with Koss |
| E19 | handle L1247–1254 | Return `{ setItems, step(n), goTo(index), open(), focusIndex(index), closeFocus, setTier(tier), getCentredRect(), pause(), resume(), destroy, lensUniforms }`. `step`/`goTo` set `target` only (invariant). `focusIndex(i)` swaps the focused pool slot instantly (the others stay dropped) for next/prev while focused |

### Pattern 2: Tier decision, once in the host
```js
// lib/carousel/tiers.js — pure; unit-tested with injected signals
export const TIERS = {
  desktop: { name: "desktop", dprCap: 2,    fboScale: 1,    samples: 16, blur: true,  aniso: 16, continuous: true,  ring: "1280" },
  mobile:  { name: "mobile",  dprCap: 1.5,  fboScale: 1,    samples: 8,  blur: false, aniso: 4,  continuous: false, ring: "720" },
  low:     { name: "low",     dprCap: 1.25, fboScale: 0.75, samples: 6,  blur: false, aniso: 2,  continuous: false, ring: "720" },
};
export function detectTier({ override, reducedMotion, saveData, webgl2, coarse, width }) {
  if (override && (override in TIERS || override === "grid")) return override;
  if (reducedMotion || saveData || !webgl2) return "grid";
  return coarse || width < 1025 ? "mobile" : "desktop";
}
// p50 frame delta over ~90 active frames after the entry starts
export function fpsVerdict(tierName, p50ms) {
  if (p50ms > 50) return "grid";                       // < 20 fps: genuinely too weak
  if (p50ms > 36 && tierName !== "low") return "low";  // < ~28 fps; 30 fps (33.3 ms) LPM cap stays
  return tierName;
}
```
- `webgl2` probe: `document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true })`, then immediately `getExtension("WEBGL_lose_context")?.loseContext()` to free the probe context.
- **iOS Low Power Mode caps rAF at 30 fps** (WebKit bug 173434, several reports). A threshold of "< 45 fps → downgrade" would push every LPM iPhone to low/grid. The thresholds above treat a steady 30 fps as fine. The numbers are a starting point for the real-device day.
- `?tier=desktop|mobile|low|grid` and `?probe=off` overrides are harmless and needed by Playwright. Desktop Chromium renders through **SwiftShader** (software), so its FPS would trip the probe.
- `matchMedia("(prefers-reduced-motion: reduce)")` gets a `change` listener: a live switch destroys the engine and shows the grid (and the reverse).

### Pattern 3: One persistent video, started inside the gesture
- The host keeps `<video playsInline preload="none" disablePictureInPicture>` **always mounted** (hidden). Its parent is fixed and its box is moved with `transform`.
- `FocusPlayer` exposes an imperative ref API `start(item)`, `close()`, `next()`, `prev()`. React state only drives the chrome (title, mute icon, s5 overlay), never the `play()` call.
- `start(item)`:
  - `video.src = "/media/" + item.filmKey; video.poster = "/media/" + item.posterKeys.full; video.muted = false; video.preload = "auto"; const p = video.play();`
  - `p.catch(e => e.name === "NotAllowedError" ? showBlocked() : e.name === "AbortError" ? null : showError())`.
- Blocked (s5): dimmed poster + large ▶. Its `onClick` calls `video.play()` (unmuted). If that rejects too, set `muted = true` and `play()`, and show the mute button in the "sound off" state.
- Close: `video.pause(); video.removeAttribute("src"); video.load();` releases the decoder (iOS limits decoders).
- Progress: a rAF loop while `!video.paused` sets `bar.style.transform = scaleX(currentTime/duration)`. It is display-only (`aria-hidden`); no seek, because a seek is not in D-09 and a fake control is not allowed.
- `loop = true` (reels behaviour, discretion).
- Layout:
  - Desktop: the video box tracks `onFocusRect` while the engine animates. Settled: centred, height `H − 120`, `object-fit: contain`.
  - Phone: settled = full screen (`position: fixed; inset: 0; height: 100dvh`) on black. `object-fit: cover` only when the film is vertical (aspect ≤ 0.6) and the crop is ≤ 20 %; otherwise `contain`. Panels never crop (CARO-02); this is the reels convention for the player only. **Confirm with Koss at UAT.**

### Pattern 4: History and close paths
```ts
// open
history.pushState({ mmFilm: item.id }, "");          // no URL: Next copies __NA, router untouched
// next / prev while open
history.replaceState({ mmFilm: next.id }, "");       // Back still closes, not "previous film"
// close by UI (Close, Esc, swipe down on first)
closingByUi = true; history.back();                   // consume our entry
addEventListener("popstate", () => { if (isOpen) closePlayer(); closingByUi = false; });
```
Verified in `node_modules/next/dist/client/components/app-router.js`:
- The pushState/replaceState patch calls `copyNextJsInternalHistoryState`, which adds `__NA` and the tree.
- `onPopState` reloads the page only when `!event.state.__NA`.

Phase 4 adds the `/work/<slug>` URL to the same calls.

### Pattern 5: Accessibility without a second UI
- `<FilmList>` is server-rendered: `<ul>` › `<li>` › `<button data-index>` with client, title and industry text. **No `<a>` until `/work/<slug>` exists (phase 4): no dead links.**
  - GL mode: the list is `sr-only` and its buttons are `tabIndex={-1}` (screen readers can still activate them; Tab does not walk invisible buttons).
  - Grid mode: the same list is shown as the s6 two-column grid, with `<img>` (poster @720, `loading="lazy"`, width/height set) rendered **client-side only in grid mode**. Images in the hidden SSR list would download every poster twice, because a 1 px clipped box counts as in the viewport.
- Carousel stage:
  - `role="region" aria-roledescription="carousel" aria-label={t("films")} tabIndex={0}`.
  - Keys: ←/→ (logical, swapped in RTL) → `engine.step(±1)`; Home/End → `goTo`; Enter/Space → `player.start(item)` + `engine.open()`.
  - A visible focus ring is a DOM outline on `engine.getCentredRect()`.
- `aria-live="polite"`: "5 of 17: Ooredoo, Social media ad", set from `onSettle` (debounced). Do not set it from `onActiveChange`, which fires during a fling.
- The counter is wrapped in `<bdi dir="ltr">` so it never reads "17/05" in Arabic.
- Player: `role="dialog" aria-modal="true" aria-label="{client} — {title}"`. Focus moves to Close on open and returns to the stage on close. `inert` is set on the stage while it is open.
- `noscript`: `<noscript><style>` shows the list as a text list.

### Pattern 6: D-02 gate (proposal; Koss decides at plan signature)
| Option | How | Verdict |
|---|---|---|
| **A (recommended)** separate route + Worker var gate | `app/[locale]/carousel/page.tsx` static. In `worker.ts` before OpenNext: `if (/^\/(en|ar|fr)\/carousel(\/|$)/.test(url.pathname) && env.CAROUSEL_LAB !== "on") return 404`. Set `"CAROUSEL_LAB": "on"` in `wrangler.jsonc` **`previews.vars` only** (previews do not inherit vars). Locally: `preview-local.sh` adds `--var CAROUSEL_LAB:on` (OpenNext `preview [args..]` passes wrangler args through, verified source `commands/preview.js` L28; `wrangler dev --var` exists). Production has no var → fail-closed | Static, no CPU change, independent of the build; RSC `?_rsc` requests share the path, so they are gated too |
| B | Home `/[locale]` renders carousel or holding by env var | Needs a dynamic page (CPU on Free) or a rewrite; it touches the live home now |
| C | Build-time flag (`NEXT_PUBLIC_…`) | Preview and production deploy the same build, so it cannot tell them apart |

Second lock: **seed media only in local and preview R2.** `upload-seed.sh` refuses `production` with no override (unlike `upload-probe.sh`, which accepts `SHIP_APPROVED=1`).

Third: seed titles are imported in a **server-only** module, so they land in the prerendered payload (served only through the gated Worker path; `/cdn-cgi/_next_cache/*` answers Cloudflare error 1042 on the live Worker, checked today). They do not land in `/_next/static` chunks (public assets served without the Worker). The plan verifies this with `grep -r "<a seed title>" .open-next/assets/_next/static` → no match.

Fourth: `verify-live.sh` gains a `lab` mode: production `/en/carousel` → 404, preview → 200.

The later live switch (a separate Ship) moves `<CarouselPage>` into `app/[locale]/page.tsx` and deletes the gate.

### Seed data: `WorkItem` contract (shared with phase 3)
```ts
// lib/content/work-item.ts — the ONLY shape pages and the engine host see.
export const INDUSTRIES = ["fashion", "beauty_clinics", "real_estate", "products", "ads", "content"] as const;
export type Industry = (typeof INDUSTRIES)[number];
export type WorkItem = {
  id: string;            // phase 3: ulid (D1 works.id); seed: "seed-01"…
  slug: string;          // unique, url-safe (phase 4 /work/<slug>)
  kind: "video" | "photo";
  industry: Industry;
  client: string;        // display name (phase 3: brands.name via client_brand_id)
  title: string;         // already resolved for the page locale (phase 3: work_text, EN fallback)
  width: number; height: number;   // measured at upload; aspect = width/height
  durationS: number | null;
  filmKey: string | null;          // R2 key, served at /media/<key>; null for photos
  posterKeys: { "720": string; "1280": string; full: string };  // heights: 720 (mobile ring), 1280 (desktop ring), full = film frame size
  order: number;
};
```
- Seed file `content/seed/works.json` stores `title` per locale (`{ "en": …, "ar": …, "fr": … }`). `getSeedWorks(locale)` resolves it, so the page receives `WorkItem[]` exactly as phase 3's `getPublishedWorks(locale)` will.
- **Coordinate with phase 3:** ARCHITECTURE's D1 sketch has one `ring_key`. This contract has `720`/`1280` ring renditions plus `full`. Land `work-item.ts` in phase 2's first wave so phase 3 builds against it.
- GPU budget: a 405×720 texture is about 1.5 MB with mipmaps, and a 720×1280 one about 4.9 MB. That fits the "< ~4 MB/poster mobile, < ~120 MB total" budget at 17–30 films.
- Recommended seed (17 films, mirroring the Vimeo inventory shapes):
  - fashion 7, content 5, beauty_clinics 2, products 2, ads 1, **real_estate 0** (proves the hidden chip).
  - Shapes: 13× 9:16 (1080×1920), 2× 4:5 (1080×1350), 1× 1:1 (1080×1080), 1× 16:9 (1920×1080).
  - That covers a 1-film row (ads), 2-film rows (beauty, products) and mixed shapes.
- **Labels: neutral test text** ("Test client A", "9:16 film 01"), not real client names. The repo is public and preview URLs are public (01 D-10), so real brand names over test patterns would read as invented work. Realistic names from VIMEO-INVENTORY could live in a gitignored `content/seed/works.local.json` for Koss's design review only (Koss decides).

### Test films (`scripts/make-seed-media.sh`, extends `make-probe-media.sh`)
- Per seed item, ffmpeg makes: `testsrc2=size=WxH:rate=30:duration=6` with a per-film `hue=h=<n·21>` shift, plus a per-film tone `sine=frequency=<220+n·40>` (you can hear which film plays). Encoding: `-c:v libx264 -profile:v high -pix_fmt yuv420p -b:v 2M -c:a aac -b:a 96k -shortest -movflags +faststart` (about 1.5 MB each).
- **This ffmpeg has no `drawtext`.** To burn the number and shape into the frame, render a label PNG with `magick -size 600x120 xc:none -fill white -pointsize 64 label:"07 · 9:16"` and `overlay` it.
- Posters: frame 0 → PNG → `magick` WebP at the full height, 1280 and 720 (no libwebp in ffmpeg; `cwebp` is absent; the magick path already works in phase 1).
- Gate each film with `node scripts/check-faststart.mjs`. Write to `.probe/seed/` (gitignored).
- Upload keys `seed/<id>/film.mp4`, `seed/<id>/poster-720.webp`, `seed/<id>/poster-1280.webp`, `seed/<id>/poster-full.webp`, all with `Cache-Control: public, max-age=31536000, immutable`, through `scripts/wr.sh r2 object put … --local|--remote`. Allowed targets: local and preview only. Local R2 state is per checkout (01-06 note): a worktree must run the upload before e2e.

### Next.js integration
- `page.tsx` (server) → `getSeedWorks(locale)` + `getTranslations("Carousel")` → props. It inherits `generateStaticParams` and `dynamicParams = false` from `app/[locale]/layout.tsx`, so it is prerendered (●). Call `setRequestLocale(locale)` in the page as the holding page does.
- `CarouselHost.tsx` (`'use client'`) SSRs only the overlay chrome (header text placeholders, chips, counter). In `useEffect` it runs `detectTier()`, then `const { createCarousel } = await import("@/lib/carousel/engine")` with a `cancelled` guard (StrictMode double-mount in dev). The grid tier never downloads three/GSAP.
- Measured: three + GSAP with the named imports above = **588 KiB minified / 156 KiB gzip** (esbuild, this session). It is loaded lazily on GL tiers only.
- Worker size: the limit is 64 MiB uncompressed on both plans with no compressed limit [CITED: developers.cloudflare.com/workers/platform/limits, fetched today]. `.open-next/server-functions` is 22 MB today. Record `opennextjs-cloudflare build` output size before/after. No CPU change is expected (static page).
- Do not use `next/dynamic(..., { ssr: false })` from a server component: Next 16 errors on it [CITED: node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md]. `import()` inside `useEffect` in the client host is the simplest correct choice.
- Layout CSS: the stage is `height: 100svh` with the canvas absolutely filling it. Header, meta text, counter and chips are absolutely positioned per s1/s2 (`top: 15%` / `13%`, bottom `9%` / `7%`). Chips use `overflow-x: auto; scrollbar-width: none`. Use logical properties only (`ms-/me-/start-/end-`). The meta text is plain plum/muted per the sketch (the reference's `mix-blend-exclusion` white text is dropped).

### Anti-Patterns to Avoid
- **`setState(open)` → `useEffect` → `video.play()`:** the play leaves the gesture, and iOS rejects it with sound. Call `play()` inside the handler through a ref.
- **Opening focus from the rAF loop after a glide** (reference `pendingFocus`, L1171–1177): same gesture loss.
- **Conditionally rendering `<video>` on open:** the element must already exist at tap time; a remount also loses the WebKit unlock.
- **Tweening `scroll` for keyboard steps:** it breaks the single-lerp invariant. Move `target`.
- **Sign flips scattered for RTL:** one `sgn` at the screen boundary only.
- **`touch-action: none` on the canvas** (reference L608): blocks the page's vertical scroll (CARO-05).
- **Images in the hidden SSR list:** double downloads (Pattern 5).
- **Seed JSON imported into a client component:** titles ship in public `/_next/static` chunks, bypassing the D-02 gate.
- **Treating `AbortError` as "blocked":** it fires whenever `src` changes during a pending play (fast next/prev). Ignore it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Context-loss restore of GL state | Manual re-creation of programs/textures | three r186's built-in `onContextLost/onContextRestore` + resume loop; host re-create only as a safety net | three already re-inits and re-uploads lazily |
| Tweening/easing | Custom easing curves | GSAP timelines on plain numbers (reference pattern) | Invariant; the feel is already tuned |
| Range/seek for video | JS byte fetching, MSE | Native `<video>` + existing `serveMedia` 206 | Done and verified in phase 1 |
| Faststart check | New parser | `scripts/check-faststart.mjs` | Exists |
| Back-button handling | Custom router state | `history.pushState/replaceState` (Next-patched) + `popstate` | Next copies `__NA` |
| Media key validation | New regex | `lib/media/serve.ts` `KEY_RE` + traversal checks | Exists; `seed/<id>/…` keys pass it |
| Wrangler / R2 writes | Raw `wrangler` | `scripts/wr.sh` (cf-guard) | Account safety |

**Key insight:** almost everything hard here (physics, lens, Range, history) already exists in the reference, three, Next or phase 1. The phase's real work is wiring: synchronous playback, data-driven pools, tiers, and the gate.

## Common Pitfalls

### Pitfall 1: Playback started outside the tap
**What goes wrong:** the film opens silently or not at all on iPhone; `NotAllowedError`.
**Why:** `play()` is called after a GSAP timeline, a rAF glide, or a React effect. WebKit's post-gesture unlock is time-limited and shorter under battery saver or thermal pressure [CITED: remotion.dev/docs/player/autoplay].
**Avoid:** E11 + Pattern 3. Next/prev handlers run on `touchend` (swipe), `click` (arrows) or `keydown` (keys). These are activation-triggering per the HTML spec; `Escape` is not, but Esc only closes.
**Warning signs:** an unhandled rejection in the Safari console; a film that works on desktop Chrome only (Chrome's sticky activation hides the bug).

### Pitfall 2: Playwright hides autoplay failures
**What goes wrong:** e2e passes but phones fail.
**Why:** verified this session: both Playwright Chromium (headless shell) and WebKit play **unmuted video with no gesture**.
**Avoid:** PLAY-02 is tested by an init script that stubs `HTMLMediaElement.prototype.play` to reject once with `new DOMException("", "NotAllowedError")`. The real gesture rule is a manual real-device check.

### Pitfall 3: SwiftShader trips the FPS probe in tests
**What goes wrong:** desktop e2e lands on the grid or the low tier at random.
**Why:** headless Chromium's WebGL2 renderer is "ANGLE … SwiftShader" (software), verified this session. `failIfMajorPerformanceCaveat: true` still returns a context there, so only the FPS probe would demote it.
**Avoid:** tests use `?probe=off` (and `?tier=…` where a tier is the subject). The iphone15 project (WebKit, "Apple GPU") is a real-GPU check.

### Pitfall 4: WebGL1-only devices
**What goes wrong:** a blank stage.
**Why:** three r163+ throws without WebGL2.
**Avoid:** probe `webgl2`; wrap `createCarousel` in try/catch → grid.

### Pitfall 5: Vertical page scroll vs. horizontal drag
**What goes wrong:** the page cannot be scrolled on phones, or the row jitters during a vertical scroll.
**Why:** reference L608 `touch-action: none`.
**Avoid:** `touch-action: pan-y` on the canvas. The browser then owns vertical pans and sends `pointercancel` [CITED: MDN touch-action], which the engine already routes to `onPointerUp` (L1107). Desktop wheel: `onWheel` calls `preventDefault()` always (L722), so the mouse wheel never scrolls the page over the stage. That is fine while the stage is the whole page in phase 2. **Phase 4 (sections below) must decide wheel hand-off** (open question 3).

### Pitfall 6: Few films leave gaps; the entry shows holes
**Why:** fixed `REPEATS = 4` (L144); the entry walk shows one copy per source (L528–532).
**Avoid:** E7 and E18. Unit-test `computeRepeats` for N = 1, 2, 3 at W = 2560 and 390. Use an e2e pixel probe on the canvas's left and right edge columns for the 2-film filter.

### Pitfall 7: Context leaks on remount
**Why:** StrictMode double mount in dev, the reduced-motion live switch, filter remounts.
**Avoid:** E16 (`dispose()` then `forceContextLoss()`). The host never re-creates the engine for filter changes (`setItems`). e2e: listen for `webglcontextlost` on the old canvas during a live reduced-motion switch.

### Pitfall 8: Resize storms on iOS
**Why:** the URL bar show/hide fires `resize` and changes `innerHeight`, and `panelH` jumps.
**Avoid:** stage `100svh` + ResizeObserver on the mount (E17). Recompute `panelH` only when the height changes by more than 120 px or on orientation change.

### Pitfall 9: Mixed-direction text in Arabic
**What goes wrong:** the counter reads `17/05`; Latin client names reorder.
**Avoid:** `<bdi dir="ltr">` on the counter; `<bdi>` around client names; no `letter-spacing`/`uppercase` under `html[lang=ar]` (already a global rule in `globals.css`).

### Pitfall 10: Worker invocations per view
**What goes wrong:** the Free plan allows 100,000 requests a day. Each poster and each film Range chunk through `/media/*` is one invocation, so a 17-film view costs about 17 poster requests plus the film ranges.
**Avoid in phase 2:** posters are `immutable` (browser cache), ring textures load only for the current filter, and other films stay `preload="none"`. Record the count per view in the plan's evidence. Phase 6 revisits it (Workers Cache API or the media domain) once the domain exists.

### Pitfall 11: Seed titles in public chunks
See Pattern 6, third lock. Check after the build with `grep`.

### Pitfall 12: History state confusion
**What goes wrong:** closing by Close leaves a dangling entry, so the next Back press does nothing visible.
**Avoid:** closing via UI calls `history.back()` and lets `popstate` perform the close (Pattern 4). Next/prev uses `replaceState`.

## Code Examples

### Synchronous open from the engine's click (E11)
```js
// lib/carousel/engine.js (inside onClick, after the suppressClick / inputLocked checks)
const hit = panelAtPointer(e.clientX, e.clientY);
if (!hit) return;
openFocus(hit);                 // starts the glide+scale timeline
onOpen(hit.srcIndex);           // synchronous: host calls video.play() inside this click
```

### Host side: play inside the same call stack
```tsx
// components/carousel/CarouselHost.tsx
const playerRef = useRef<FocusPlayerHandle>(null);
const onOpen = useCallback((i: number) => {
  playerRef.current!.start(itemsRef.current[i]);  // sets src, muted=false, video.play() — no setState before it
  history.pushState({ mmFilm: itemsRef.current[i].id }, "");
}, []);
```

### Lens samples as a compile-time define (E10)
```js
const lensMat = new ShaderMaterial({
  defines: { SAMPLES: tier.samples, USE_BLUR: tier.blur ? 1 : 0 },
  uniforms: { ...lensUniforms, uW: { value: gaussWeights(tier.samples) } }, // Vector3[]
  fragmentShader: /* glsl */ `
    uniform vec3 uW[SAMPLES];
    ...
    for (int i = 0; i < SAMPLES; i++) {
      float t = float(i) / float(SAMPLES - 1);
      vec3 s = texture2D(uTex, baseUV + dispDir * (t - 0.5)).rgb;
      col += s * uW[i]; caW += uW[i];
    }
    #if USE_BLUR
      /* reference L341-356 */
    #endif`,
});
// gaussWeights(n): for t=i/(n-1): [exp(-((t-0)/.38)^2), exp(-((t-.5)/.38)^2), exp(-((t-1)/.38)^2)]
```
three's ShaderMaterial (GLSL1 mode on WebGL2) injects `#define texture2D texture` and `#define gl_FragColor pc_fragColor` [VERIFIED: three `WebGLProgram.js` L814–829], so the reference shader compiles unchanged.

### Context loss test (no app hook needed)
```ts
// e2e/carousel.spec.ts
await page.evaluate(() => {
  const gl = document.querySelector("canvas")!.getContext("webgl2")!; // returns the existing context
  const ext = gl.getExtension("WEBGL_lose_context")!;
  ext.loseContext(); setTimeout(() => ext.restoreContext(), 300);
});
// then wait 1 s, screenshot the stage centre and assert non-white pixels (panel drawn again)
```

### Blocked autoplay stub (PLAY-02)
```ts
await page.addInitScript(() => {
  const orig = HTMLMediaElement.prototype.play; let n = 0;
  HTMLMediaElement.prototype.play = function () {
    if (n++ === 0) return Promise.reject(new DOMException("blocked", "NotAllowedError"));
    return orig.call(this);
  };
});
```

### Worker gate (D-02, option A)
```ts
// worker.ts, before the OpenNext fall-through
const LAB = /^\/(en|ar|fr)\/carousel(?:\/|$)/;
if (LAB.test(url.pathname) && (env as { CAROUSEL_LAB?: string }).CAROUSEL_LAB !== "on") {
  return withSecurityHeaders(new Response("Not found", { status: 404 }));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| three WebGL1 fallback | WebGL2 only | r163 | No-3D detection must test `webgl2` |
| Fixed DPR 2 everywhere | Tiered DPR caps + render on demand | standard mobile practice | Mobile tier table |
| Next `middleware.ts` locale routing | No proxy; `worker.ts` entry handles `/` and gates | Next 16 + OpenNext (phase 1) | The gate lives in `worker.ts` |
| History hacks in the App Router | Native `pushState/replaceState` integrated with the router | Next 14.1+, present in 16.3.8 | Safe "Back closes" |
| OpenNext 3/10 MiB bundle limit | 64 MiB uncompressed, no compressed limit | Cloudflare limits page (current) | three adds no size risk |

**Deprecated/outdated:**
- Phase 1 summary (01-05) says "Playwright Chromium does not decode H.264". **Not true for this installation:** `chromium_headless_shell-1243` reported `canPlayType('video/mp4; codecs="avc1.640028"') = "probably"` and played an H.264/AAC faststart MP4 (verified this session). Playback e2e is possible on the desktop and pixel7 projects.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | three's lazy re-upload after `webglcontextrestored` brings textures and the FBO back without engine help | E15 | Blank canvas after iOS backgrounding; mitigated by the host re-create safety net + e2e lose/restore test |
| A2 | FPS thresholds (36 ms → low, 50 ms → grid) suit mid-range Android and LPM iPhones | Pattern 2 | Wrong tier; tune on the real-device day |
| A3 | Panel height fractions 0.5·H desktop / 0.43·H mobile match the signed s1/s2 at other viewports | E6 | Visual drift; check against sketches at 1280×720, 1920×1080, 360×740 |
| A4 | Phone player `cover` for vertical films (≤ 20 % crop) is acceptable | Pattern 3 | Koss may want `contain` everywhere; one CSS line |
| A5 | `loop = true` in the player (reels) rather than auto-next | Pattern 3 | UX preference; trivial change |
| A6 | Ring poster renditions 720/1280 + full | Seed contract | Phase 3 must produce them; agree the contract early |
| A7 | Neutral seed labels rather than real client names | Seed | Koss may prefer realistic names for design review (gitignored local file offered) |
| A8 | `server-only` import works without installing the package (Next ships `dist/compiled/server-only`) | Structure | Build error; fix by `npm i server-only` or skip the import and rely on the server-file convention |
| A9 | Shortened/skip-on-revisit entry animation is acceptable | E18 | Feel decision for Koss at UAT |
| A10 | Desktop `continuous: true` render (shimmer always alive) is acceptable for power | E14 | Laptop fans; can switch to idle-stop with a slow shimmer |

## Open Questions

1. **D-02 gate shape.** What we know: option A is static and fail-closed, and the cache paths are unreachable (1042). What is unclear: Koss has not chosen. Recommendation: put option A in the plan for his signature.
2. **Real-device coverage.** What we know: Koss has an iPhone (Hermes/UAT history). What is unclear: whether a mid-range Android (Mali/Adreno 6xx class) is available. Recommendation: ask Koss. Without one, the Android tier thresholds stay MEDIUM until launch UAT (phase 6).
3. **Wheel hand-off when sections exist below (phase 4).** Phase 2's stage fills the page, so there is no conflict now. Record it as a phase 4 design item, not phase 2 work.
4. **Language links on the lab page.** D-06 allows three if the page supports them. Recommendation: render `/en|ar|fr/carousel`, with chips and aria strings in all three message files (AR chips from sketch s7; FR drafted by Claude; both pending Houssem's review as in phase 1 D-07). All links resolve, so there are no dead links.
5. **Who runs preview deploys for phone UAT.** 01-07 shows `wr.sh preview --name …` works from a worktree and touches no production data. Whether a work session may run it, or only the control session, is a control-rule question for Koss/plan.
6. **Entry animation length and filter transition feel.** Discretion, but it is a visible-feel item: show Koss at UAT.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build/tests | ✓ | v26.7.0 (Workers Builds would use 24 from `.node-version`; deploys are local) | — |
| ffmpeg | seed films | ✓ | 9.0.2 (libx264, aac; **no drawtext, no libwebp**) | magick for labels and WebP |
| ffprobe | seed checks | ✓ | /opt/homebrew/bin/ffprobe | `check-faststart.mjs` |
| ImageMagick | WebP posters, labels | ✓ | 7.1.2-32 | — |
| Playwright browsers | e2e | ✓ | chromium-1243 + headless shell, webkit-2359 | — |
| H.264 playback in Playwright | PLAY e2e | ✓ | Chromium headless shell + WebKit both play MP4 (verified) | — |
| WebGL2 in Playwright | CARO e2e | ✓ | Chromium: SwiftShader; WebKit: Apple GPU; `WEBGL_lose_context` in both | — |
| Google Chrome (stable) | — | ✗ | — | not needed |
| wrangler login (Houssem) | upload seed to local/preview, preview deploy | ✓ | `/Users/koss/.mansouri-cloudflare` via `scripts/wr.sh` | — |
| Preview R2 bucket `mansourimedia-media-preview` | seed on preview | ✓ (exists) | — | — |
| Real iPhone / mid-range Android | CARO-05, PLAY-01/02 manual | iPhone likely; Android unknown | — | Ask Koss (Open Q2) |

**Missing dependencies with no fallback:** none for building. The real Android device is a coverage gap, not a blocker.
**Missing dependencies with fallback:** drawtext → ImageMagick label overlay.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.11 (`node` project) + @playwright/test 1.63.0 (projects desktop / pixel7 / iphone15) |
| Config file | `vitest.config.ts` (node project includes `tests/*.test.ts`), `playwright.config.ts` (webServer = `scripts/preview-local.sh`, port 8791) |
| Quick run command | `npx vitest run --project node` (< 10 s) |
| Targeted e2e | `npx playwright test e2e/carousel.spec.ts --project=desktop` (builds the Worker first, ~1–3 min) |
| Full suite command | `npx vitest run && npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CARO-01 | Canvas is WebGL2, page bg white, meta text plum, ring colour config = `#C48C3C` | unit + e2e | `npx vitest run tests/carousel-geometry.test.ts`; `npx playwright test e2e/carousel.spec.ts -g "brand" --project=desktop` | ❌ Wave 0 |
| CARO-02 | Panel width = aspect·panelH; `computeRepeats` covers W for N = 1, 2, 3; 2-film filter has non-white edge columns | unit + e2e pixel probe | `npx vitest run tests/carousel-geometry.test.ts`; `… -g "fills row"` | ❌ Wave 0 |
| CARO-03 | Wheel/drag/keys change the counter, settle (`data-settled`), text follows; touch drag on pixel7 via CDP `Input.dispatchTouchEvent` | e2e | `npx playwright test e2e/carousel.spec.ts -g "browse"` | ❌ Wave 0 |
| CARO-04 | `visibleIndustries()`; Real estate chip absent; "Beauty & clinics" → `01/02` | unit + e2e | `… tests/carousel-geometry.test.ts`; `… -g "filters"` | ❌ Wave 0 |
| CARO-05 | `data-tier="mobile"` on pixel7/iphone15; canvas `touch-action: pan-y`; vertical CDP swipe scrolls an injected spacer, counter unchanged | e2e (+ manual) | `npx playwright test e2e/carousel.spec.ts -g "mobile" --project=pixel7` | ❌ Wave 0 |
| CARO-06 | `detectTier`/`fpsVerdict` table (incl. 33 ms LPM stays); no-webgl2 init script → grid with all items; `emulateMedia({reducedMotion})` live → grid | unit + e2e | `npx vitest run tests/carousel-tiers.test.ts`; `npx playwright test e2e/carousel-fallback.spec.ts` | ❌ Wave 0 |
| CARO-07 | `request.get('/en/carousel')` HTML contains `<ul` and every seed title (no JS); Tab → stage, → → `02/17`, Enter opens dialog; `aria-live` text after settle; `/ar` ArrowLeft → `02` | e2e | `npx playwright test e2e/carousel-a11y.spec.ts` | ❌ Wave 0 |
| CARO-08 | lose/restore context → panel pixels return; live reduced-motion switch fires `webglcontextlost` on the old canvas and removes it | e2e | `… e2e/carousel.spec.ts -g "context"` | ❌ Wave 0 |
| PLAY-01 | Click centred and off-centre panel → `video.paused === false`, `muted === false`, `currentTime > 0` within 3 s; desktop box height ≈ H−120; phone ≈ viewport height for 9:16 | e2e | `npx playwright test e2e/focus-player.spec.ts -g "opens"` | ❌ Wave 0 |
| PLAY-02 | Stubbed `NotAllowedError` → big ▶ visible → click → playing | e2e | `… -g "blocked"` | ❌ Wave 0 |
| PLAY-03 | Mute toggles `muted`; →/← and arrow buttons change title; Esc, Close, `page.goBack()` close (URL unchanged, page not reloaded: a `window.__marker` survives); pixel7 CDP swipe up/down = next/prev; swipe down on first closes | e2e | `… -g "controls"` | ❌ Wave 0 |
| D-02 | Local/preview `/en/carousel` 200; production 404; no seed title in `.open-next/assets/_next/static` | script + e2e | `bash scripts/verify-live.sh <url> lab --env production`; `grep -r "Test client A" .open-next/assets/_next/static` (expect no match) | ❌ Wave 0 |
| Seed | Every seed item validates against `WorkItem`, keys match `KEY_RE`, ≥ 1 industry empty, all 4 shapes present; films are faststart | unit + script | `npx vitest run tests/seed.test.ts`; `bash scripts/make-seed-media.sh` (runs check-faststart) | ❌ Wave 0 |

**Manual-only (real devices; cannot be automated):** each check is a numbered step plus the expected result for Koss's UAT, run on a preview URL.
1. iPhone Safari: browse 60 s. Smooth, the phone is not hot.
2. iPhone: tap a panel. The film plays **with sound** at once.
3. iPhone with Low Power Mode on: tap. It plays, or ▶ appears and a tap on it plays with sound. The carousel stays 3D (not the grid).
4. iPhone: open WhatsApp/Instagram for 1 min, return. The carousel still draws.
5. iPhone: open the preview link from an Instagram DM (in-app browser). Steps 2–3 behave the same.
6. iPhone: swipe-back gesture / Android hardware Back while a film plays. The film closes and you stay on the page.
7. Phone, film open: swipe up → next, swipe down → previous, swipe down on the first → close.
8. Mid-range Android Chrome: 60 s browsing. No stutter; tier shown via `?debug=fps` is mobile or low.
9. Settings → Reduce Motion on: the page shows the poster grid, and a tap plays the film.
10. `/ar/carousel`: the first film is on the right, swipe follows the finger, ← moves to the next.
11. Desktop Safari + Firefox: wheel, drag, keys, film with sound, Esc.
12. Visual: the gold lens and the layout vs signed s1–s7 (Koss's eye; canvas pixels cannot be diffed against the CSS-drawn sketch).

### Sampling Rate
- **Per task commit:** `npx vitest run --project node` + the one e2e spec the task touches (`--project=desktop`).
- **Per wave merge:** `npx vitest run && npx playwright test` (all three projects).
- **Phase gate:** full suite green + `verify-live.sh <preview> public media lab --env preview` + production `lab` 404 check, then Koss's manual list on a preview URL before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `tests/carousel-geometry.test.ts`: panelHeight, computeRepeats, focusRect, toScreenX, wrapDelta, visibleIndustries
- [ ] `tests/carousel-tiers.test.ts`: detectTier, fpsVerdict
- [ ] `tests/seed.test.ts`: seed JSON vs `WorkItem`, keys, shapes, empty industry
- [ ] `e2e/carousel.spec.ts`, `e2e/focus-player.spec.ts`, `e2e/carousel-fallback.spec.ts`, `e2e/carousel-a11y.spec.ts`
- [ ] `scripts/make-seed-media.sh` + `scripts/upload-seed.sh` (local/preview), run before e2e in each checkout (local R2 is per checkout)
- [ ] `scripts/preview-local.sh` adds `--var CAROUSEL_LAB:on`; `tests/wrangler-config.test.ts` asserts `previews.vars.CAROUSEL_LAB === "on"` and that the top-level `vars` lacks it
- [ ] `scripts/verify-live.sh` gains a `lab` mode
- [ ] Host exposes `data-tier`, `data-entry`, `data-settled`, `data-focus` on the stage for tests (no global test hooks)

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (no admin in this phase) |
| V3 Session Management | no | — |
| V4 Access Control | yes | Fail-closed `CAROUSEL_LAB` gate in `worker.ts`; seed media never in production R2 (`upload-seed.sh` refuses production) |
| V5 Input Validation | yes | Seed JSON validated by `tests/seed.test.ts`; media keys through the existing `KEY_RE` + traversal checks; `?tier`/`?probe` values allow-listed |
| V6 Cryptography | no | — |
| V12 Files/Resources | yes | Media served read-only via `serveMedia` (GET/HEAD only, 405 otherwise; already tested) |
| V14 Configuration | yes | The var lives in `wrangler.jsonc previews.vars` (not a secret); no secrets added; `X-Frame-Options: DENY`, nosniff already on OpenNext responses |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Test films or invented work shown on the live site | Spoofing/Repudiation (public misrepresentation) | Gate + no production upload + neutral labels + `verify-live lab` check |
| Seed titles leaked through public static chunks | Information disclosure | Server-only seed import; post-build grep of `.open-next/assets/_next/static` |
| XSS through titles/client names | Tampering | React text rendering only; no `dangerouslySetInnerHTML`; `aria-label` built from text |
| History state injection | Tampering | `pushState` with no URL and an id-only state; ids looked up in the server-provided items, never trusted from `history.state` |
| Worker invocation exhaustion (Free 100k/day) via poster/film requests | Denial of service | `immutable` caching, per-filter texture loading, `preload="none"`; revisit in phase 6 |
| WebGL canvas taint | Tampering | Same-origin `/media`, `crossOrigin='anonymous'` default, ACAO `*` already set |

## Sources

### Primary (HIGH confidence)
- Reference code: `_reference/liquid-glass-carousel/lib/carousel/engine.js` (all line refs), `config.js`, `Components/CarouselSection.jsx`, `HOW-IT-WORKS.md`, `AGENTS.md`, `LICENSE`, `UPSTREAM.txt` (read in full)
- three 0.186.1 tarball source: `src/renderers/WebGLRenderer.js` (WebGL2-only L61/L102, context lost/restore L1113–1145, `forceContextLoss` L607, `dispose` L1088), `src/renderers/webgl/WebGLProgram.js` (GLSL1 defines L814–829), `src/loaders/Loader.js` (crossOrigin default L32)
- Next 16.3.8 installed source: `dist/client/components/app-router.js` (pushState/replaceState patch, `copyNextJsInternalHistoryState`, popstate reload rule); bundled docs `dist/docs/01-app/02-guides/lazy-loading.md`
- OpenNext 1.20.8 installed source: `dist/cli/commands/preview.js` (wrangler passthrough); `wrangler dev --help` (`--var`)
- Cloudflare Workers limits (64 MiB uncompressed, no compressed limit; Free 10 ms CPU): https://developers.cloudflare.com/workers/platform/limits/
- HTML spec, activation-triggering input events: https://html.spec.whatwg.org/multipage/interaction.html#activation-triggering-input-event
- WebKit, New video policies for iOS (gesture, muted, playsinline, promise rejection): https://webkit.org/blog/6784/new-video-policies-for-ios/
- MDN `touch-action` (pan-y, pointercancel): https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
- Session probes: Playwright Chromium/WebKit H.264 playback, unmuted no-gesture play, WebGL2 renderer strings, `failIfMajorPerformanceCaveat`, `WEBGL_lose_context`; live Worker `/cdn-cgi/_next_cache/...` → error 1042; esbuild size of three+gsap
- npm registry: versions, downloads, repos, scripts; slopcheck [OK] ×3

### Secondary (MEDIUM confidence)
- iOS Low Power Mode caps rAF at 30 fps: https://popmotion.io/blog/20180104-when-ios-throttles-requestanimationframe/, https://bugs.webkit.org/show_bug.cgi?id=173434, https://github.com/pixijs/pixijs/discussions/7079
- WebKit post-gesture unlock is time-limited and battery/thermal dependent: https://www.remotion.dev/docs/player/autoplay
- Project research: `.planning/research/ARCHITECTURE.md`, `PITFALLS.md`, `STACK.md` §9, `VIMEO-INVENTORY.md`; sister project `Koussay-Portfolio/components/Carousel.jsx` (dispose + forceContextLoss order)

### Tertiary (LOW confidence)
- None relied on for decisions.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Two well-known packages, versions and legitimacy checked; sizes measured.
- Architecture / engine port: HIGH for the edit list (read line by line), MEDIUM for the feel of the changed entry and filter transitions (needs a hand check).
- Pitfalls: HIGH for gesture/history/WebGL2/SwiftShader (verified), MEDIUM for real-device thresholds.

**Research date:** 2026-10-04
**Valid until:** 2026-11-03 (stable libraries pinned exactly; re-check if three or Next is bumped)

## RESEARCH COMPLETE
