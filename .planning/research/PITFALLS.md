# Pitfalls Research

**Domain:** WebGL (three.js lens shader + GSAP) video-portfolio home, trilingual EN/AR/FR site, D1 booking, Stripe Connect deposits, R2 video, Cloudflare Access admin. Next.js 16 on Cloudflare Workers, in the client's own Cloudflare account. Two-week first version (by ~2026-10-17).
**Researched:** 2026-10-03
**Confidence:** HIGH for Stripe UAE Connect rules, Cloudflare limits and the Access JWT steps (read from official docs today), and for findings read from the reference code. MEDIUM for iOS/WebGL behaviour (several community reports agree). LOW where marked.

The roadmap does not exist yet, so the phase names below are suggestions:
- **P0 Accounts & infra**: Houssem's Cloudflare account, domain, wrangler HOME, Resend domain, and the Stripe application.
- **P1 Carousel port**: brand, mobile, a11y and reduced motion.
- **P2 Video pipeline**: R2, encodes, focus playback.
- **P3 i18n/RTL**
- **P4 Content sections**: logos, influencers, services.
- **P5 Booking**: D1, Resend, Turnstile.
- **P6 Admin**: Access, uploads, blocked time.
- **P7 Deposits**: Stripe Connect.
- **P8 Launch hardening**: SEO, perf, smoke tests, UAT.

Facts read from the reference code (`_reference/liquid-glass-carousel/lib/carousel/engine.js`):
- No `webglcontextlost` / `webglcontextrestored` handler.
- `destroy()` calls `renderer.dispose()` but not `forceContextLoss()`.
- DPR is capped at 2 for every device.
- `antialias: true` is set on a renderer that draws into a non-MSAA FBO.
- The lens has a fixed 16-sample dispersion loop (`MAX_SAMPLES = 16`).
- Textures get full mipmaps and max anisotropy.
- No `prefers-reduced-motion`, no keyboard input, no ARIA beyond "Close".
- `CarouselSection.jsx` gates out every viewport under 1025px.

Every item in this list is a known gap. None of it is a bug in the upstream code, which was built as a desktop demo.

---

## Critical Pitfalls

### Pitfall 1: Stripe Connect in the UAE is not self-serve, and needs trade licences on both sides

**What goes wrong:**
The plan is "Koss's Stripe = platform, Houssem = Express connected account, commission = application fee". Stripe's own docs, read 2026-10-03, say:
- *"platform users in [the UAE] can't self-serve Express connected accounts. To begin onboarding for Express connected accounts in these countries, contact us"* (sales).
- UAE platforms can only use **UAE-based** connected accounts.
- Only two charge types are allowed: **destination charges** and **separate charges and transfers**.
- *"Destination charges using the on_behalf_of attribute aren't yet supported for UAE platforms."*
- Stripe's UAE Connect page: connected accounts must be a sole establishment, free-zone establishment or LLC. They need *"a valid trade license issued within the UAE"*, so *"individuals without licenses cannot open connected accounts."*

Houssem is employed (Senior Videographer at DMT via Kizmet). Mansouri Media may have no trade licence. If it has none, Houssem cannot be onboarded at all.

Separately, Stripe now marks Express/Standard/Custom as "legacy" for **new** platforms. It points new platforms at Accounts v2 or v1 with controller properties. Code copied from older Express tutorials is the deprecated path.

**Why it happens:**
Connect is assumed to be global and self-serve, as it is from the US, UK or EU.

**Consequences:**
- The deposit feature cannot go live inside two weeks: sales contact, platform review and the licence check all take time.
- Building the full Connect flow first risks a feature that is never switched on. That breaks the standing rule "a shown control must be live".

**How to avoid:**
1. Day 1 (P0), as human steps: Koss confirms his Stripe account is a UAE business with a licence and contacts Stripe sales about Connect for a UAE platform. Houssem confirms whether Mansouri Media holds a UAE trade licence (and which emirate or free zone).
2. Build v1 so the deposit option is **hidden behind a server flag**. It turns on only when `charges_enabled` is true on Houssem's account. Do not show a greyed-out "Pay deposit" button. Free call and shoot request ship without Stripe.
3. Use **destination charges without `on_behalf_of`** (the only UAE-allowed path). Consequence: **Koss's platform is the business of record**. Koss's name and statement descriptor appear on the card statement. The platform balance is debited for Stripe fees, refunds and chargebacks (official docs). Koss carries Houssem's disputes. That changes the commercial deal and has to be part of the pricing talk (OPEN item 1). It is not a code decision.
4. Use the Accounts v2 / controller-properties onboarding that Stripe currently recommends. Check it in the Stripe docs (Context7 or docs.stripe.com) at P7 start. Do not copy `type=express` samples blindly.

**Warning signs:**
- Creating the account in the Dashboard or through the API gives a "contact sales" error.
- Onboarding asks for a trade licence that Houssem doesn't have.
- The statement shows "KOSS…" instead of Mansouri Media. That is expected; say so in the deposit copy.

**Phase to address:** P0 (human track, day 1). P7 code is gated on the answers. Deposits are likely **post-v1**, so the roadmap should say so explicitly.

---

### Pitfall 2: Taking a deposit before a price exists

**What goes wrong:**
The shoot request is "service + date + location → he quotes", but a "paid deposit" option sits next to it. A visitor can then pay money before any price or scope is agreed. Refund and dispute exposure sits with the platform (Pitfall 1). Consumer-protection and refund wording would also be needed, and the honesty rule forbids inventing it.

**How to avoid:**
- Make the deposit a **second step after a quote**. Houssem accepts a request in /admin and enters the amount (or picks a fixed amount Koss has priced). The system then emails a one-time Stripe Checkout link tied to that booking id. No anonymous "pay AED X now" on the public site until Koss sets fixed deposit amounts.
- The refund, cancellation and reschedule policy is legal copy: Koss provides it. Until it exists, deposits stay off (same flag as Pitfall 1).
- Refunds go through admin with `reverse_transfer=true`. Decide `refund_application_fee` per the agreed deal. By default the platform **keeps** its fee on a refund and **absorbs** the refund if the transfer is not reversed (official docs).

**Warning signs:** A Checkout session is created from a public page with a client-supplied amount. The deposit has no linked booking row.

**Phase to address:** P7 (design and signature first). Pricing discussion with Koss happens before P7 planning.

---

### Pitfall 3: Deploying to the wrong Cloudflare account

**What goes wrong:**
The default `wrangler` login on this Mac is the **Vamos** account (`e64b47de…`), and Vamos configs pin no `account_id`. A plain `npx wrangler deploy`, `d1 create` or `r2 bucket create` in this repo puts Mansouri Media's Worker, database and bucket inside Vamos. ALMAR already solved this with `HOME=/Users/koss/.almar-cloudflare`.

**How to avoid:**
1. Create a dedicated HOME, e.g. `/Users/koss/.mansouri-cloudflare`. Houssem (or Koss as a member of Houssem's account) logs in there once, as a numbered human step. Secrets stay in his terminal.
2. Pin `account_id` in `wrangler.jsonc` (Houssem's id). A wrong-account login then fails loudly instead of deploying.
3. Wrap every wrangler call in an npm script: `"cf": "HOME=/Users/koss/.mansouri-cloudflare wrangler"`, plus a preflight that runs `wrangler whoami` and aborts if the account id differs.
4. Never run `wrangler login` in the default HOME for this project.

**Warning signs:** `wrangler whoami` shows the Vamos email. The D1 `database_id` is not found. The Worker appears on vamostaxi's dashboard.

**Phase to address:** P0, before the first `d1 create`.

---

### Pitfall 4: The canvas home is invisible to search engines, screen readers and keyboards

**What goes wrong:**
The reference home is one `<canvas>` plus a heading. There is no list of works in the DOM, no links, no keyboard path, and focus is not trapped in focus view. Google indexes nothing about the films. A screen-reader user hears "Close". Keyboard users cannot reach a film. The sister project needed a whole phase for this (Koussay-Portfolio Phase 6, "Ring accessibility and reduced motion").

**How to avoid:**
- Server-render a real `<ul>` of works: title, client, industry, a link to `/work/<slug>` per film, and a poster `<img>`. Keep it visually hidden but focusable, or as a visible index, beside the canvas. Each film gets its own SSR'd page with a `VideoObject` JSON-LD block (poster, duration, upload date) and `<video>`. This is the SEO surface and also the WebGL-failure fallback.
- Keyboard:
  - Left/Right (logical, see Pitfall 9) moves `target` by one panel. Use the engine's existing `centerForIndex`; do not tween `scroll`, which is an AGENTS.md invariant.
  - Enter opens focus view.
  - Escape closes it.
  - Focus moves into the focus view and back to the panel on close.
  - An `aria-live="polite"` region announces "3 of 12, Ooredoo ad, Ads".
- Detect a failed WebGL context (`renderer` creation throws, or `getContext` returns null) and render the DOM grid instead of a blank white page.
- Expose the engine changes only through the handle/callbacks. The engine stays React-free (AGENTS.md invariant).

**Warning signs:**
- Lighthouse SEO "Document doesn't have crawlable links".
- Tab from page load reaches nothing.
- `curl https://mansourimedia.com/ | grep -c '<a '` returns about 2.

**Phase to address:** P1 (DOM list + keyboard + WebGL fallback land with the port, not at the end). Per-film pages + JSON-LD + hreflang in P8.

---

### Pitfall 5: The lens shader at DPR 2 melts mid-range phones; poster textures exhaust iOS GPU memory

**What goes wrong:**
- **Fill cost:** two full-screen passes per frame. The lens pass does up to 16 dispersion taps per pixel plus nova, shimmer and rim. On a 6.1" iPhone at DPR 2 that is about 786×1704 ≈ 1.34 M px × 16 ≈ 21 M texture fetches per frame at 60 fps. Mid-range Android throttles within a minute; the phone heats and the battery drains. Most visitors arrive from Instagram on phones.
- **Never idle:** shimmer and the rim wave animate continuously, so the rAF loop never rests even when nothing moves.
- **Texture memory:** a 1080×1920 RGBA poster is 8.3 MB, and about 11 MB with mipmaps. At 30 films that is about 330 MB of GPU memory. iOS Safari kills the context (or the tab) well before that.
- **Context leaks:** `destroy()` without `forceContextLoss()` leaks contexts on Next soft navigation, StrictMode double mount and HMR. Browsers cap live contexts (~16), and the page goes blank. This is a sister-project lesson, and Koussay-Portfolio keeps `forceContextLoss` deliberately.
- **No context-loss recovery:** iOS drops WebGL contexts when Safari is backgrounded (documented for iOS 16.6–17.0; still reported). The reference has no handler, so returning from WhatsApp or Instagram shows a white or frozen canvas.

**How to avoid:**
- Mobile profile in `config.js`:
  - DPR `min(devicePixelRatio, 1.5)` on coarse pointers (2 on desktop).
  - Lens FBO at 0.75× on mobile.
  - `MAX_SAMPLES` as a compile-time `#define` (8 on mobile, 16 desktop).
  - `antialias: false` (the scene renders into a non-MSAA FBO anyway).
  - `powerPreference: "high-performance"` only on desktop.
- Pause the loop on `visibilitychange`, when the canvas is off-screen (IntersectionObserver), and while the focus-view `<video>` plays. Throttle shimmer to 30 fps on mobile.
- Posters are pre-sized at upload (P6), with no runtime `sharp` (see Pitfall 11):
  - Desktop: ~600×1066 WebP/JPEG for the ring.
  - Mobile: ~400×712.
  - A full-size still only in the DOM focus view.
  - Budget: under ~4 MB GPU per poster and under ~120 MB total.
  - The infinite row's `REPEATS` copies must keep sharing one texture per source. The reference does today; don't break it.
- Add `forceContextLoss()` to `destroy()`. Add `webglcontextlost` (call `preventDefault`, stop rAF) and `webglcontextrestored` (rebuild FBO, materials and textures, or simply re-create the engine through the handle).
- Test on a real mid-range Android and an iPhone with Low Power Mode on, not only the Mac.

**Warning signs:**
- Chrome DevTools Performance on a 4× CPU throttle shows frames over 16 ms.
- `renderer.info.memory.textures` grows after navigating away and back.
- The console shows "WebGL: CONTEXT_LOST_WEBGL".
- Safari Web Inspector → Graphics shows more than one context.

**Phase to address:** P1 (mobile profile, context handling, destroy). P6 (poster sizes at upload). P8 (real-device check).

---

### Pitfall 6: iOS video rules: playback started after the animation loses the user gesture, Low Power Mode, poster flash

**What goes wrong:**
- **Lost gesture:** clicking a panel starts a 0.9 s GSAP focus timeline. If `video.play()` (with sound) is called in the timeline's `onComplete`, it is no longer inside the user gesture. iOS rejects it with `NotAllowedError` and the film doesn't play.
- **Low Power Mode:** iOS blocks even `muted playsinline autoplay`, so `play()` rejects (confirmed by several reports and Apple forum threads). Any ambient or autoplay preview fails silently.
- **Missing `playsinline`:** iPhone goes native fullscreen, which breaks the 9:16-in-page focus view.
- **Poster flash:** a white or black frame between the poster texture fading and the first decoded frame. The worst case is a `<video>` with no `poster`, or a poster still that doesn't match the film's first frame.
- **Video as a WebGL texture:** a cross-origin `VideoTexture` without `crossOrigin="anonymous"` plus R2 CORS taints the canvas (`SecurityError` in `texImage2D`, sister Pitfall 1). Per-frame uploads of a 1080×1920 video also cost a lot on iOS.

**How to avoid:**
- Play the film in a **DOM `<video>` overlaid on the focus panel**, not as a WebGL texture. No CORS taint and no per-frame texture upload, and native controls, captions and fullscreen come for free.
- Inside the click/tap handler, synchronously call `video.play()`. Start it muted and unmute on the same gesture if sound is wanted. Keep it `opacity:0` until the focus animation ends, then fade it in on the `playing` event (or the first `requestVideoFrameCallback`).
- Always handle the `play()` promise. On rejection, show the poster plus a big gold play button that calls `play()` from its own tap.
- `poster` = the same still as the ring texture (one file, same URL). Export the poster from frame 0, or choose frame 0 to match.
- Only one `<video>` with `src` at a time. All others get `preload="none"` and no `src`. Release with `removeAttribute('src'); load()` on close: iOS limits concurrent decoders and memory.
- Captions: brand ads often have voice-over. A `<track>` is nice-to-have, not v1, but leave room in the schema (`captions_vtt_key`).

**Warning signs:**
- An unhandled promise rejection `NotAllowedError` in the Safari console.
- The film opens fullscreen on iPhone.
- A one-frame flash is visible in a 240 fps screen recording.

**Phase to address:** P2.

---

### Pitfall 7: R2 video delivery: no faststart, wrong range handling, files too large, wrong delivery path

**What goes wrong:**
- **No faststart:** an MP4 with the `moov` atom at the end makes Safari range-fetch the tail before it can start. Exports from Premiere and Vimeo downloads often lack faststart.
- **Range handling:** Safari *requires* `206 Partial Content` for `<video>`. Community reports (MEDIUM/LOW, 2022–2025) show public R2 or proxied responses returning 200 for range requests, Cloudflare cache serving a cached 200 to a range request, or `Accept-Ranges` being stripped. Result: video won't play or won't seek on iPhone.
- **Streaming through the Worker:** media served with `env.BUCKET.get(key)` without passing the `Range` header returns the whole file. That burns Worker CPU and time, and breaks seeking.
- **Size:** 1080×1920 H.264 at 8–12 Mbps is 60–90 MB per minute, too heavy on Gulf mobile data for a first impression.
- **Upload path:** a Worker request body is capped at **100 MB** on Free/Pro plans (official limits page). An admin upload of a long 1080p film through the Worker fails at 100 MB.
- **`r2.dev` URLs:** rate-limited and "not for production". They get no cache, no Transform Rules and no WAF.

**How to avoid:**
- Serve media from an **R2 custom domain** (`media.mansourimedia.com`) on Houssem's zone, with a long immutable cache and content-hashed keys (`films/<slug>/<sha8>-720.mp4`). Do not stream video through the Next Worker.
- Encode ladder at ingest:
  - **720×1280, H.264 High, CRF ~23, ~2.5–4 Mbps, `-movflags +faststart`, AAC 128k, `yuv420p`** as the default (mobile).
  - Optional 1080×1920 for desktop via `<source media>` or a JS choice.
  - Poster WebP.
  - `ffprobe`-check every file: codec, pixel format, faststart, duration. This is a sister-project lesson.
- Admin upload goes **browser → R2 directly** through a presigned PUT (S3 API, multipart for large files), minted by the Worker after the Access check. R2 bucket CORS: `PUT` from `https://mansourimedia.com` only; `GET/HEAD` with `Access-Control-Allow-Origin: *`.
- Verify on the live domain before UAT: `curl -sI -H 'Range: bytes=0-1' https://media…/x.mp4` → expect `206`, `Content-Range`, `Accept-Ranges: bytes`. Test twice (cold, then cached).
- Encoding: Houssem "exports web-ready", but he will hand over 4K ProRes or 1080p 20 Mbps. Add a local `ffmpeg` script on Koss's Mac (or Houssem's) as the single path. Workers cannot transcode.

**Warning signs:**
- The video plays in Chrome but not in iOS Safari.
- Seeking restarts from 0.
- Network tab shows a 200 with the full size for a `Range` request.
- Upload fails at about 100 MB with a 413.

**Phase to address:** P2 (domain, encode script, range check). P6 (presigned upload).

---

### Pitfall 8: Double bookings and time-zone errors in D1

**What goes wrong:**
- **Race:** a read-then-insert ("is the slot free? → insert") from two concurrent requests can both succeed. The sister project had this exact bug: an in-memory `pendingStarts` Set on serverless, from Koussay-Portfolio CONCERNS. D1 doesn't expose interactive `BEGIN…COMMIT` across awaits from a Worker. `batch()` is atomic, but it doesn't make a SELECT-then-INSERT safe on its own.
- **Read replication:** if D1 read replication or the Sessions API is enabled with `first-unconstrained`, the availability check can read a stale replica.
- **Time zones:**
  - Dubai is UTC+4 with **no DST**, but French visitors are on CET/CEST. Europe leaves summer time on **Sunday 25 Oct 2026**, eight days after launch. Any code storing "local wall time" or adding a fixed offset shifts French visitors' slots by an hour that week.
  - `Date` parsing of `"2026-10-20T10:00"` without an offset is the device's local time, which differs per visitor.
- **Arabic locale formatting:**
  - Some `ar-*` locales default to the Islamic calendar: `ar-SA` renders Hijri dates.
  - Arabic-Indic digits ٠١٢ show up where Houssem expects Latin.
- **Blocked time:** blocks stored as dates only (no time) or as inclusive end times create off-by-one gaps. The email to Houssem shows the visitor's zone and confuses him.

**How to avoid:**
- Schema:
  - Store `start_utc` and `end_utc` as INTEGER epoch ms.
  - Add a `slot_key` (`start_utc` rounded to the slot grid).
  - Add `CREATE UNIQUE INDEX ux_active_slot ON bookings(slot_key) WHERE status IN ('pending','confirmed')`, a SQLite partial index.
  - The INSERT is the claim. A constraint violation means "slot just taken", and the UI offers the next slot.
  - Pending deposit holds carry `expires_at`; a cron trigger, or a check at read time, releases them.
- Blocked time: `[start_utc, end_utc)` half-open intervals. The availability query rejects overlap with `start < :end AND end > :start` for both bookings and blocks, on the primary (no read replication, or Sessions `first-primary`).
- One time module. The business zone is the constant `Asia/Dubai`. Visitors see slots in GST, labelled "Dubai time (GST, UTC+4)", plus their own local time in parentheses when it differs. Format with `Intl.DateTimeFormat(locale, { timeZone, calendar: 'gregory', numberingSystem: 'latn' })` for `ar`, unless Houssem wants Arabic digits.
- The owner email is always in Dubai time. The visitor email is in both zones. Include an `.ics` with UTC `DTSTART`.
- Unit tests for the time module: a Paris visitor across 25 Oct 2026, midnight roll-over, a block spanning midnight, and a concurrent insert, using two parallel requests against local D1 (`wrangler dev`).

**Warning signs:** a slot list differs between a Paris VPN and Dubai. Two rows have the same start. `ar` dates show "١٤٤٨ هـ".

**Phase to address:** P5. Admin blocked time is in P6 and reuses the same module.

---

### Pitfall 9: RTL breaks the carousel, the overlay and the type

**What goes wrong:**
- **Mirroring the scroll logic:**
  - `dir="rtl"` on `<html>` does nothing to the canvas.
  - If someone "mirrors" by negating the scroll sign, drag feels inverted. Drag must stay physical: content follows the finger in both directions.
  - Wheel `deltaY` → forward should advance to the "next" item in reading order. In RTL, "next" lies to the left.
  - Arrow keys must map logically (ArrowLeft = next in RTL).
- **Overlay:**
  - GSAP tweens with hard-coded `x: 80` or `left` slide the wrong way.
  - The "View" cursor label, the `01/12` counter, the "Close" button (top-right → top-left) and `mix-blend-exclusion` text need logical CSS (`inset-inline-end`, `ms-*`/`me-*` in Tailwind 4).
  - The counter needs `dir="ltr"` or `<bdi>` so "01/12" doesn't render "12/01".
- **Fonts:** the brief's candidates (Host Grotesk, Inter Tight, Geist) **don't cover Arabic**. Geist is confirmed Latin/Cyrillic only; the others are LOW confidence, verify in the font files. A missing Arabic face falls back to the system font: Geeza Pro on iOS, varying on Android. The page then looks unbranded.
- **Logo styling:** letter-spaced caps ("MEDIA" style) applied to Arabic break cursive joining. Arabic has no uppercase, and `tracking-widest` on Arabic text disconnects the letters.
- **Mixed text:** Latin brand names inside Arabic sentences (L'Oréal, MBRGI) and phone numbers (+971…) reorder badly without `<bdi>` / `dir="ltr"` spans.
- **Line height:** Arabic needs more line-height. Text sized for Latin `text-sm` with tight leading clips diacritics.

**How to avoid:**
- Pair the Latin grotesk with an OFL Arabic sans of similar weight and x-height: IBM Plex Sans Arabic, Noto Kufi Arabic or Readex Pro. Verify licence files. Use a per-locale `font-family` stack, and subset by `unicode-range` only from official WOFF2 files (no self-conversion, licence lesson from the sister project). Check that French accents and œ, « » exist in the Latin face.
- Decide the carousel direction once (design + Koss's signature):
  - Recommended: in AR the row's "next" is leftward, and the entry animation's stagger order is reversed.
  - Implement as one `dir` flag in the engine config, read by `nearestIndex`/wheel mapping. Not scattered sign flips.
- Disable `letter-spacing` and `text-transform` under `:lang(ar)`. Raise line-height for `:lang(ar)`.
- UAT the AR home and booking on an iPhone, not only Chrome's devtools.

**Warning signs:** Arabic renders in Geeza Pro. The counter reads backwards. "Close" overlaps the logo in AR.

**Phase to address:** P3. The engine `dir` flag is designed in P1 so P3 doesn't reopen the engine.

---

### Pitfall 10: Cloudflare Access protects the hostname, but the Worker is reachable elsewhere

**What goes wrong:**
- **Other routes:** Access guards `mansourimedia.com/admin*`, but the same Worker also answers on `*.workers.dev`, on preview URLs, and on any API route outside the Access path (`/api/admin/*` if only `/admin` is listed). Those routes run admin code unauthenticated.
- **Cookie trust:** code that trusts the `CF_Authorization` **cookie** is weaker. Cloudflare recommends validating the `Cf-Access-Jwt-Assertion` **header**, because the cookie is not guaranteed to be passed. Code that just checks the header *exists* is also weak, since any client can send one on an unprotected route.

**How to avoid:**
- Set `workers_dev = false` and disable preview URLs in `wrangler.jsonc`. Put both `/admin*` and `/api/admin*` in the Access application, or put the admin API under `/admin/api/*`.
- In the Worker, on **every** admin route and server action, verify the JWT with `jose`:
  - `createRemoteJWKSet('https://<team>.cloudflareaccess.com/cdn-cgi/access/certs')`
  - `jwtVerify(token, jwks, { issuer: 'https://<team>.cloudflareaccess.com', audience: <AUD tag> })`
  - Check `email` against an allow-list (Houssem's Gmail, Koss).
  - 403 otherwise.
  - Use `public_certs` by `kid` (jose does this), never `public_cert`.
- Policy: email one-time PIN, include only those addresses, short session (e.g. 24 h).

**Warning signs:** `curl https://<name>.<sub>.workers.dev/api/admin/bookings` returns data. The admin works without a login on a preview URL.

**Phase to address:** P6 (and P0 to set `workers_dev=false` from the start).

---

### Pitfall 11: Next.js on Workers: CPU, image optimization, Node APIs, and stale adapter docs

**What goes wrong:**
- **CPU:** the Workers Free plan allows **10 ms CPU per request** (official). Next.js SSR of a three-locale page plus RSC regularly exceeds that, and the result is intermittent 1102/Exceeded CPU errors. The paid plan ($5/mo) allows up to 5 min. It is a cost in Houssem's account, so it goes to Koss's pricing talk (do not decide it in code).
- **Size limit, sources disagree:**
  - OpenNext's docs still say 3 MiB (Free) / 10 MiB (Paid) compressed.
  - Cloudflare's limits page, read today, says **64 MiB uncompressed, no compressed limit**, for both plans.
  - Trust Cloudflare, but measure at the first deploy (MEDIUM).
- **`next/image`:** default optimization needs the Cloudflare Images binding (billable beyond the free tier) or fails. The sister project hit runtime `sharp` and had to remove it.
- **Next 16 `proxy.ts`** (formerly middleware) runs on Node. OpenNext added Node-middleware support recently. Bundling has open bugs (e.g. failure when `@opentelemetry/api` is installed, issue #1400). Locale routing in `proxy.ts` is the usual place this bites.
- **Node APIs:** packages that need `fs`, native modules (`sharp`, `@napi-rs/canvas`) or long-lived DB clients fail. You also get "Cannot perform I/O on behalf of a different request" if a client is created globally.
- **vinext** (Cloudflare's Vite re-implementation of Next) is explicitly experimental, "not yet a drop-in replacement for every … production workload". It is not for a two-week client launch.
- **AGENTS.md warning:** the reference AGENTS.md says "This is NOT the Next.js you know". Next 16 has breaking changes, so read `node_modules/next/dist/docs/` before writing routes.

**How to avoid:**
- Use OpenNext (`@opennextjs/cloudflare`, latest) with `nodejs_compat` and a recent `compatibility_date`.
- Make every marketing page static (SSG per locale with `generateStaticParams`). Only `/api/*`, `/booking` actions and `/admin` are dynamic.
- Set `images: { unoptimized: true }`, or a custom loader pointing at pre-sized R2 renditions made at ingest. No runtime image work.
- Do locale detection with a tiny `proxy.ts` that only redirects `/` → `/en|/ar|/fr` (Accept-Language + cookie). If OpenNext bundling of `proxy.ts` fails, use static `/` with a client redirect plus `<link rel=alternate hreflang>`.
- Create the D1 / R2 / Stripe clients inside the request (`getCloudflareContext()`).
- Deploy a hello-world of the final stack to Houssem's account on day 2–3. Check CPU in Workers Observability on the booking POST.

**Warning signs:** Error 1102 in Workers logs. `next build` is fine but `opennextjs-cloudflare build` fails. Images 500 in production only.

**Phase to address:** P0 (skeleton deploy), P1 (static rendering), P8 (CPU check).

---

### Pitfall 12: Licensing and implied endorsement: logos, celebrity photos, employer work

**What goes wrong (risks noted; Koss's decision to use the Drive photos stands):**
- **MIT notice:** "Copyright (c) 2026 Yousuf Soomro" must stay in `LICENSE` and ship with the code. A rewrite to "© Mansouri Media" drops it (sister Pitfall 12). Keep a credit line in the README and in `/credits` or the footer source comment.
- **Lay Grotesk and the Behance images:**
  - Confirm `_reference/…/public/` holds neither. Any copy step from the upstream git history would bring them back.
  - Do not `git clone` upstream into the app. Copy from `_reference/` only.
- **Celebrity photos (Mbappé, Pogba, Hakimi…):**
  1. The photographer owns the copyright (already noted by Koss).
  2. A footballer's image next to "Mansouri Media" implies endorsement. Clubs and agents send takedowns.
  3. UAE Cybercrime Law (Federal Decree-Law 34/2021, Art. 44) covers publishing a person's image without consent, with fines reported at AED 150k–500k. It is mostly applied to private-life images. LOW confidence on how it applies to press-style portfolio photos.

  Mitigation that keeps Koss's call:
  - Caption each photo with what Houssem actually did ("Filmed for <brand> campaign, 2024").
  - Never caption one as a testimonial or "partner".
  - Keep the photos in admin-controlled R2 so one can be removed in a minute without a deploy.
- **Brand logos:** showing Lexus, L'Oréal or Universal implies a client relationship. Many of these were probably clients of **his employers** (DMT, Visioneers, Alfan Group), not of Mansouri Media. Under the honesty rule, the section heading should be accurate, e.g. "Brands I've filmed for". It should not read "Our clients". Some employer contracts and NDAs also restrict portfolio use of client work (e.g. the Minions premiere for Universal). Houssem confirms per brand.
- **Low-res logos:** stretched or recoloured logos breach most brands' guidelines. Use monochrome plum or white versions sourced from official press kits (OPEN item 6).

**Warning signs:** a heading that says "clients" or "partners". A logo without a matching film or a confirmed job. A celebrity photo with no caption.

**Phase to address:** P4 (copy + Houssem per-item confirmation as a UAT item). P1 (LICENSE kept).

---

### Pitfall 13: Two-week scope creep

**What goes wrong:**
The v1 list is large for 14 days:
- a WebGL port with a new mobile profile, three locales with RTL, and two exploratory sketch sections;
- booking with three modes, Stripe Connect, an admin with R2 uploads, Access, D1 and Resend;
- on a new Cloudflare account and a new domain.

The usual failure is spending days on shader feel and lens tuning (the most fun part) while booking, i18n and the account and DNS steps slip. Stripe Connect alone has an external dependency of unknown length (Pitfall 1). Content blockers (OPEN 5–7: films, logos, bio) sit with Houssem, not Koss.

**How to avoid:**
- Cut line, decided at roadmap time:
  - **v1 must:** carousel home (desktop + mobile), film focus playback, logos + creators sections, services, EN + AR + FR, free-call + shoot-request booking in D1 with Resend, WhatsApp CTA, admin upload + bookings list + blocked time behind Access.
  - **v1.1:** deposits (gated by Stripe and the licence), results numbers (gated by proof), per-film captions, Cloudflare Images.
- Human-track list on day 1: Cloudflare account, domain purchase, Resend DNS, Stripe sales contact, film picks + exports, logo SVGs, AR/FR review. Each is a numbered step for Houssem or Koss, tracked on the board.
- Timebox shader tuning (brand recolour + mobile profile = about one day). Every `LENS` key stays in `config.js`/`gui.js`, so tuning can continue after launch without code risk.
- Ship placeholder-free: if a section's content is missing at launch, the section is **absent**, not "Coming soon" (standing rule).

**Warning signs:** day 5 and no deploy in Houssem's account yet. Lens tweaks in more than one commit per day. Stripe still "waiting on sales" on day 7 while deposit UI is being built.

**Phase to address:** Roadmap structure itself; P0 day 1.

---

## Moderate Pitfalls

### Booking endpoints become a spam relay (sister lesson)
Koussay-Portfolio's CONCERNS: unauthenticated booking and draft endpoints let a script flood the owner's inbox and send "You're booked" emails to arbitrary addresses through Resend.
- Put **Turnstile** on every public POST.
- Rate-limit by IP (Workers Rate Limiting binding).
- Send the visitor confirmation only after a valid Turnstile.
- Never `replyTo` an unverified address in owner alerts without a marker.
- Cap the field lengths.

**Phase:** P5.

### Resend domain not verified on a fresh domain
`mansourimedia.com` is bought on day 1–2. Until SPF/DKIM (and ideally DMARC) records are added in Houssem's zone and verified in Resend, mail fails or lands in Gmail spam. Houssem's own address is Gmail, and Gmail is strict on new domains. Decide which Resend account holds the domain (Houssem's, or Koss's with a domain-scoped key).
- Add the records in P0.
- Send from `bookings@mansourimedia.com`.
- Make the Reply-To the visitor's address on owner mail.

**Phase:** P0/P5.

### Reduced motion handled only in CSS
The entry choreography is about 4.5 s (rise 1.0 + grow 2.15 + bloom 1.4), with continuous shimmer, speed shrink and the focus drop. `prefers-reduced-motion` must:
- skip the entry (jump to the end state);
- freeze the shimmer and nova;
- disable speed shrink;
- shorten focus to a cross-fade;
- keep the films from autoplaying.

It must react when the setting changes, not only at load. WCAG 2.2.2 also needs a pause control for any moving content over 5 s. The sister project lacked this and needed a phase for it.

**Phase:** P1.

### Instagram in-app browser is the real primary browser
Visitors come from Instagram bios and stories. That means the IG in-app WKWebView (iOS) / WebView (Android), not Safari.
- Media and autoplay settings differ.
- `wa.me` links may open inside the webview.
- Stripe Checkout's Apple Pay may not be offered.
- Memory is tighter than in Safari.

LOW confidence on exact behaviour. Add "open from an Instagram DM link on iPhone and Android" to every UAT.

**Phase:** P8 (and P2 spot check).

### Webhook idempotency and ordering
Stripe retries webhooks and does not guarantee order.
- Verify the signature with the **raw body** (`await request.text()`, then `stripe.webhooks.constructEventAsync` with `Stripe.createSubtleCryptoProvider()` on Workers; sync crypto is not available).
- Store `event.id` in a `stripe_events` table with a UNIQUE key and skip duplicates.
- Drive state from `checkout.session.completed` + `checkout.session.async_payment_succeeded/failed`, `charge.refunded`, `charge.dispute.created`.
- Never mark a booking paid on the client's success-page redirect.
- A Connect webhook endpoint is separate from the platform endpoint for `account.updated`.

**Phase:** P7.

### Locale routing breaks static generation or caching
- Per-locale pages must be `/en/...`, `/ar/...`, `/fr/...` with `hreflang` alternates and `x-default`.
- Locale stored only in a cookie makes the HTML vary per user: the cache serves the wrong language and Google indexes one.
- `<html lang dir>` must be set server-side per segment.
- Claude-drafted AR/FR strings must be marked unreviewed until Houssem signs. Launch blocks on that review (PROJECT constraint).

**Phase:** P3.

### Filter change re-uploads every texture
Filtering by industry should rebuild the row from already-loaded textures (or load lazily). It should not dispose and reload everything. The engine assumes a fixed `PROJECTS` list, so a filter needs a `setProjects()` on the handle that re-lays out and keeps the scroll invariants (snap on idle; `target` moves only). This is an AGENTS.md invariant zone.

**Phase:** P1.

---

## Minor Pitfalls

- **lil-gui shipped to production:** dynamic-import it only under `?gui` in development. It adds bytes and an attack-irrelevant but unprofessional panel.
- **`mix-blend-exclusion` on plum text over a white canvas** gives unexpected colours on gold panels. Check contrast (WCAG AA) per panel.
- **The 1025px gate removed but `refreshLayout` not re-run on orientation change:** iOS fires `resize` before the viewport settles. Debounce, and re-read `visualViewport`.
- **iOS 100vh:** use `100dvh` for the full-height 9:16 focus view, or the bottom of the film hides under Safari's toolbar.
- **The WhatsApp link** must be `https://wa.me/971505085753` (no `+`, no spaces) with a pre-filled `?text=` per locale, URL-encoded (Arabic text included).
- **Phone and email in page HTML** get scraped. That is acceptable for a business, but use the booking form as the primary path.
- **D1 migrations** applied to remote before the code that needs them is deployed, or the reverse. Use `wrangler d1 migrations apply --remote` with the pinned account HOME, read back the schema, and never drop the live DB (standing rule).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Films list hard-coded in `config.js` instead of D1 | Ship the carousel day 3 | Admin upload has nothing to write to; a second migration later | Only for P1 dev; D1-backed by P6 |
| One 1080p MP4 per film, no 720p | No encode script | Slow first play on mobile data; high R2 Class B reads | Never for launch; the ladder is one ffmpeg line |
| `images.unoptimized` with pre-sized posters | No Cloudflare Images bill, no runtime work | Manual sizes per rendition | Acceptable permanently at this scale |
| Deposit UI built before Stripe approval | Feels complete | Dead control, rework if the charge model changes | Never (standing rule) |
| Read-then-insert booking without a unique index | Simpler code | Double bookings (sister bug) | Never |
| Validating only that the `Cf-Access-Jwt-Assertion` header exists | Five lines | Admin open on any non-Access route | Never |
| Claude-drafted AR/FR shipped unreviewed | Hits the date | Embarrassing Arabic for a Dubai brand | Never; it's a PROJECT constraint |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Stripe Connect (UAE) | `on_behalf_of` destination charges; self-serve Express; legacy `type=express` code | Destination charges without `on_behalf_of`; sales contact; Accounts v2/controller properties; trade licence check |
| Stripe webhooks on Workers | `constructEvent` (sync) on a parsed JSON body | `constructEventAsync` + SubtleCrypto provider on the raw text; event-id dedupe table |
| Cloudflare Access | Trusting the cookie or header presence; `workers.dev` left on | `jose` verify with issuer + AUD via remote JWKS; `workers_dev=false`; all admin paths in the app |
| R2 | `r2.dev` in production; Worker-proxied video; uploads through the Worker | Custom domain + cache; presigned direct PUT; CORS scoped |
| D1 | Global client; read replicas for availability | Per-request binding; primary reads; partial unique index |
| Resend | Sending before DNS verification | SPF/DKIM/DMARC in P0, verified before booking UAT |
| wrangler | Default HOME = Vamos | Dedicated HOME + pinned `account_id` + whoami preflight |
| OpenNext | Runtime `sharp`/`next/image`; Node-only packages; `proxy.ts` bundling | Static pages, unoptimized images, minimal proxy, latest adapter |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full-res lens pass at DPR 2 on phones | Hot phone, under 40 fps, throttling after ~1 min | DPR 1.5, FBO 0.75×, 8 samples, pause when idle or hidden | Any mid-range Android; older iPhones |
| Full-size posters as textures | Context lost on iOS, tab reload | Pre-sized 600×1066 / 400×712 renditions | ~20–30 films on iOS |
| All films preloaded | Long LCP, data burn | `preload="none"`; one active `<video>` | Any number over 1 |
| Contexts leaked on navigation | Blank canvas after a few back/forward | `forceContextLoss()` in `destroy` | ~16 contexts |
| SSR per request on the Free plan | 1102 errors | SSG marketing pages; paid plan decision | First traffic spike |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Deposit amount taken from the client request | Visitor pays AED 1 for a "confirmed" shoot | Amount computed server-side from the booking row set by admin |
| Presigned PUT URL with no key or type constraint | Anyone with a leaked URL overwrites films | Short expiry (≤15 min), fixed key per upload, content-type pinned, minted only after the Access JWT check |
| Booking confirmation sent to any email without Turnstile | Site used to send mail to third parties | Turnstile + rate limit + length caps |
| Stripe secret or Access AUD in `wrangler.jsonc` | Secret in git | `wrangler secret put` (Houssem or Koss types it in his own terminal) |
| Admin listing exposes visitor PII on preview URLs | Data leak | Preview URLs off; JWT check in code |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| ~4.5 s entry animation before anything is tappable | Instagram visitors bounce | Skip on revisit (sessionStorage); shorten on mobile; reduced motion skips it |
| "View / Drag" cursor label on touch | Meaningless on phones | Touch hint once ("Swipe"), then hide |
| Time slots shown only in the visitor's zone | Houssem shows up at the wrong hour | GST primary label + the visitor's local time secondary |
| A deposit button with no agreed price | Distrust, refunds | Deposit only after a quote (Pitfall 2) |
| Arabic page with an LTR carousel and LTR counter | Feels like an afterthought | One `dir` flag in the engine + logical CSS |
| Landscape panel crop of 9:16 films | His main format looks wrong | Panels keep natural aspect (already decided); verify filters with mixed aspects |

## "Looks Done But Isn't" Checklist

- [ ] **Carousel:** works on mobile, but check `forceContextLoss` on destroy, the context-restore handler, the reduced-motion live switch, keyboard nav, the DOM list and the WebGL-fail fallback.
- [ ] **Focus playback:** plays on the Mac, but check iPhone with Low Power Mode (play button appears), the Instagram in-app browser, `playsinline`, no poster flash, and a `206` on range requests from the live media domain.
- [ ] **Booking:** the row is inserted, but check that two parallel submits give one row, a Paris visitor across 25 Oct 2026, blocked time hiding slots, Turnstile, and both emails arriving in Gmail inbox (not spam).
- [ ] **Admin:** login works, but check that `workers.dev` and preview URLs are off, `/api/admin/*` rejects without a JWT, and a 300 MB upload succeeds (presigned).
- [ ] **AR:** strings translated, but check the Arabic font loaded (not Geeza Pro), the counter and phone numbers LTR, no letter-spacing, Houssem's sign-off recorded.
- [ ] **Deploy:** green deploy, but `wrangler whoami` = Houssem's account, the live URL is verified, the D1 schema read back, `git log` committed before deploy.
- [ ] **Licences:** MIT notice present, no Lay Grotesk or Behance files in `git ls-files`, font licence files shipped.
- [ ] **Deposits:** hidden unless `charges_enabled`; refund path tested with `reverse_transfer`; webhook dedupe table present.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Deployed into the Vamos account | MEDIUM | Delete only the Mansouri resources created there (by exact name, never pattern); recreate in Houssem's account; pin `account_id`; never touch Vamos's Worker or DB |
| Double booking happened | LOW | Admin contacts the second visitor; add the unique index (pre-check for duplicates first) |
| iOS context loss reported | LOW | Ship the restore handler + mobile profile; no data impact |
| Stripe Connect refused for the UAE setup | MEDIUM | Keep free call + shoot request; consider payment links on Houssem's own Stripe (no platform fee) and discuss the commission model with Koss |
| Takedown request for a celebrity photo or logo | LOW | Remove the R2 object + D1 row from admin; purge cache; no deploy needed if content is D1-driven |
| Videos won't play on iPhone | LOW–MEDIUM | Re-encode with faststart; verify 206; bypass cache for `.mp4` if Cloudflare cache returns 200 |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1 Stripe UAE / licence | P0 (human), P7 | Stripe sales answer + licence confirmed before P7 plan is signed |
| 2 Deposit before price | P7 (+ pricing talk) | Deposit only reachable from an admin-quoted booking |
| 3 Wrong Cloudflare account | P0 | `wrangler whoami` preflight script; `account_id` pinned |
| 4 Canvas SEO/a11y | P1, P8 | Keyboard-only UAT; `curl` shows work links; Lighthouse a11y/SEO |
| 5 GPU/memory/context | P1, P6, P8 | Real Android + iPhone; `renderer.info` stable after 10 navigations |
| 6 iOS playback | P2 | Low Power Mode UAT; Instagram in-app UAT |
| 7 R2 video delivery | P2, P6 | `curl` Range → 206 (cold + cached); `ffprobe` faststart; 300 MB upload |
| 8 D1 race / time zones | P5 | Parallel insert test; DST unit test; `ar` date shows Gregorian |
| 9 RTL | P1 (engine flag), P3 | AR UAT on iPhone; font check in Web Inspector |
| 10 Access bypass | P0, P6 | `workers.dev` 404; `/api/admin` 403 without JWT |
| 11 Workers limits | P0, P1, P8 | Skeleton deploy day 2–3; no 1102 in Observability |
| 12 Licensing/endorsement | P1, P4 | `git ls-files` audit; Houssem per-logo/photo confirmation |
| 13 Scope | Roadmap, P0 | Cut line in ROADMAP; human-track board updated daily |

## Sources

- Stripe, Express accounts (UAE not self-serve; UAE charge types; `on_behalf_of` unsupported; legacy notice): https://docs.stripe.com/connect/express-accounts (HIGH)
- Stripe, Custom accounts (same UAE rules): https://docs.stripe.com/connect/custom-accounts (HIGH)
- Stripe Support, Connect availability in the UAE (business types, trade licence required): https://support.stripe.com/questions/connect-availability-in-the-uae (HIGH)
- Stripe, Destination charges (fees, refunds, `reverse_transfer`, `refund_application_fee`, disputes debited from the platform): https://docs.stripe.com/connect/destination-charges (HIGH)
- Cloudflare Workers limits (10 ms CPU Free; 64 MiB uncompressed; 25 MiB asset file; 100 MB request body Free/Pro): https://developers.cloudflare.com/workers/platform/limits/ (HIGH)
- OpenNext Cloudflare overview + troubleshooting (3/10 MiB compressed, which conflicts with Cloudflare; images need config; Node middleware): https://opennext.js.org/cloudflare, https://opennext.js.org/cloudflare/troubleshooting (MEDIUM)
- OpenNext `proxy.ts` support PR #1309 and bundling bug #1400: https://github.com/opennextjs/opennextjs-cloudflare/pull/1309, https://github.com/opennextjs/opennextjs-cloudflare/issues/1400 (MEDIUM)
- vinext status (experimental): https://github.com/cloudflare/vinext, https://infoq.com/news/2026/03/cloudflare-vinext-experimental (MEDIUM)
- D1 batch atomicity, Sessions/read replication: https://developers.cloudflare.com/d1/worker-api/d1-database/ (HIGH)
- Cloudflare Access JWT validation: https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/ (HIGH)
- iOS WebGL context loss on backgrounding: https://discourse.threejs.org/t/context-lost-when-backgrounding-safari-on-ios-17-developer-beta-8/55772, https://bugs.webkit.org/show_bug.cgi?id=262628 (MEDIUM)
- three.js context-restore issue: https://github.com/mrdoob/three.js/issues/34682 (MEDIUM)
- iOS Low Power Mode blocks autoplay: https://wojtek.im/journal/safari-autoplay-not-working-in-low-power-mode, https://developer.apple.com/forums/thread/709821 (MEDIUM)
- R2/Cloudflare range requests and Safari: https://community.cloudflare.com/t/public-r2-bucket-doesnt-handle-range-requests-well/434221, https://community.cloudflare.com/t/mp4-streaming-seeking-from-r2-no-longer-works-reliably-despite-no-config-changes/844957 (LOW–MEDIUM, community)
- Geist has no Arabic: https://fontcompressor.com/blog/geist-font-guide, https://vercel.com/font (MEDIUM)
- UAE Cybercrime Law Art. 44 (image publication without consent): https://www.khaleejtimes.com/uae/crime/new-uae-cybercrime-law-up-to-dh500000-fine-for-taking-photos-of-people-without-consent, https://uaelegislation.gov.ae/en/legislations/1526/download (LOW on applicability)
- Sister project lessons: `/Users/koss/Developer/Koussay-Portfolio/.planning/research/PITFALLS.md` (CORS taint, licence notices, font licence, video ffprobe), `.planning/codebase/CONCERNS.md` (in-memory slot claim race, open booking endpoints, missing reduced motion, `forceContextLoss`), `ROADMAP.md` (a11y phase, R2 needs the zone in the same account).
- Reference code read: `_reference/liquid-glass-carousel/lib/carousel/engine.js`, `Components/CarouselSection.jsx`, `AGENTS.md`.

---
*Pitfalls research for: WebGL video portfolio + booking + Stripe Connect on Cloudflare (Mansouri Media)*
*Researched: 2026-10-03*
