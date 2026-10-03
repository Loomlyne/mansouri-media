<!-- GSD:project-start source:PROJECT.md -->
## Project

**Mansouri Media**

The website of Mansouri Media, the Dubai content agency of filmmaker Houssem Mansouri, at mansourimedia.com. The home page is a full-screen liquid-glass WebGL carousel (from Yousuf Soomro's MIT `liquid-glass-carousel`) of his video, editing and photography work — mostly vertical 9:16 Instagram films — filtered by industry; clicking a panel plays the film. The site shows the brands and influencers he has worked with and his six services, and every page leads to a booking flow (free call, shoot request, or paid deposit) or WhatsApp. It is for brands, clinics, real-estate firms and creators in Dubai and the GCC deciding whether to hire Mansouri Media. Built and run by Koss for Houssem, in English, Arabic and French.

**Core Value:** A brand in the GCC can watch Houssem's vertical films in the glass carousel and book him — call, shoot request or deposit — in a few taps, on a phone or a desktop.

### Constraints

- **Hosting**: Cloudflare Workers + R2 + D1 in Houssem's own Cloudflare account, own wrangler login (separate HOME, like ALMAR) — never the default Vamos login
- **Timeline**: first version live within 2 weeks (by ~2026-10-17)
- **Licence**: keep Yousuf Soomro's MIT notice; no Behance images; no Lay Grotesk
- **Content**: most work is vertical 9:16; every surface must show vertical video well
- **Honesty**: no invented numbers, testimonials, prices or legal copy; results only with proof; deposit amounts and commission % come from Koss
- **Languages**: EN / AR (RTL) / FR from the first version
- **Payments**: Houssem's own Stripe account; no Connect, no commission; deposit only after a quote
- **Workers plan**: Free plan for now — static pages, tiny handlers; Paid later if CPU limits hit
- **Admin**: Cloudflare Access email one-time code; no password store
- **Process**: GSD; Koss signs discuss, plan, UAT and ship
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Decisions in one place
| # | Question | Decision | Confidence |
|---|----------|----------|------------|
| 1 | Next on Workers | **Next.js 16.3.8 + `@opennextjs/cloudflare` 1.20.8** for v1. Use **no `proxy.ts`/`middleware.ts`**. Keep all Cloudflare bindings behind one module so the app can move to vinext later. | MEDIUM |
| 2 | D1 access | **Drizzle ORM 0.45.3 (stable) + drizzle-kit 0.31.11**. drizzle-kit generates the SQL; **`wrangler d1 migrations apply`** applies it. Do not use Drizzle 1.0 RC. | HIGH |
| 3 | R2 media | **Public bucket on a custom domain** (`media.mansourimedia.com`) for MP4s and posters, cached at the edge, with CORS. **Admin uploads go through the Worker's R2 binding using the multipart API** (no S3 keys, Access-protected). | HIGH (delivery) / MEDIUM (upload path) |
| 4 | /admin auth | **Cloudflare Access** (one-time email code) on `/admin*` and `/api/admin*`, plus a **`jose` 6.2.12 check of the `Cf-Access-Jwt-Assertion` header in every admin handler**. Turn off `workers.dev` and preview URLs. | HIGH |
| 5 | Stripe Connect | **UAE platform → only destination charges *without* `on_behalf_of`, or separate charges and transfers.** Direct charges are not available. UAE Express accounts are **not self-serve**: Koss must contact Stripe sales. Houssem needs a **UAE trade licence**. Use Checkout Session + `application_fee_amount` + `transfer_data.destination`. `stripe` 23.0.0. | HIGH (rules) / LOW (onboarding path) |
| 6 | Email | **`resend` 6.32.0** over fetch, from a route handler. Works on Workers with no polyfill. | HIGH |
| 7 | i18n | **`next-intl` 4.14.9**, `[locale]` segment, `localePrefix: 'always'`, **no proxy**. A root `app/route.ts` reads `Accept-Language` and redirects. `<html lang dir>` per locale. Tailwind logical utilities for RTL. | HIGH (lib) / MEDIUM (no-proxy root redirect) |
| 8 | Font | **Host Grotesk** (OFL, variable) for Latin/French + **IBM Plex Sans Arabic** (OFL) for Arabic, self-hosted woff2 with `unicode-range`. | HIGH (licences) / MEDIUM (look) |
| 9 | Mobile WebGL | **Viable with a mobile tier**: DPR cap 1.5 (1.25 on weak GPUs), 6 to 8 dispersion samples, `antialias: false`, rim blur off, pause rendering when idle. The film plays in a DOM `<video>` above the canvas, not in a VideoTexture. Fall back to a static poster grid when WebGL is missing or reduced motion is on. | MEDIUM |
## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js (App Router) | **16.3.8** (exact) | Pages, i18n routes, route handlers for booking, webhooks and admin | Same framework as the reference and the sister project (Koussay-Portfolio is on 16.3.8). The booking flow can be ported from there. **OpenNext 1.20.8 requires `next >=16.3.8`**, so the reference's 16.2.6 must be bumped. |
| `@opennextjs/cloudflare` | **1.20.8** | Builds the Next output into a Worker | Mature (1.x since 2025, releases weekly, latest 2026-10-02). Supports every Next 16 minor. Runs the real `next build`, so behaviour matches Next. Its one documented gap is Node middleware (`proxy.ts`), which this design avoids on purpose. |
| Cloudflare Workers (Paid plan) | wrangler **4.147.0** | Hosting in **Houssem's own account** | The Free plan allows **10 ms CPU per request**. Cloudflare's own docs put SSR at 10 to 20 ms, so a Next SSR Worker will hit error 1102 on Free. Paid is Cloudflare's published **$5/month account minimum**. That is a cost on Houssem's account, so Koss raises it with him. Worker size is no longer a constraint: **64 MiB uncompressed on both plans, with no compressed limit** (limits page, checked 2026-10-03). OpenNext's docs still say 3/10 MiB, which is out of date. |
| Cloudflare D1 | (platform) | Bookings, blocked time, media catalogue, payment state | Kept inside Cloudflare as decided. Relational data, with low write volume. |
| Cloudflare R2 | (platform) | MP4 1080×1920 H.264 + poster per film; logo and influencer images | No egress fees. Range requests and caching work through a custom domain. |
| React | **19.2.x** (whatever Next 16.3.8 pins; npm latest is 19.3.0) | UI | Let Next pick it. Do not force 19.3 until Next lists it. |
| three.js | **0.186.1** (exact, no caret) | Carousel engine (two-pass lens) | Latest (2026-09-24). three's minor releases can break APIs, so pin the exact version and feel-check after any bump. The reference uses 0.184 and the sister project 0.185.1, so the jump is small. Keep `WebGLRenderer`. Do not move to `WebGPURenderer` for this. |
| GSAP | **3.15.0** | Focus, entry and UI choreography | Already the engine's tweener. It is free to use, plugins included. |
| Tailwind CSS | **4.3.3** + `@tailwindcss/postcss` | Styling, RTL | Logical utilities (`ms-*`, `pe-*`, `start-*`, `text-start`) and the `rtl:` variant cover Arabic without a second stylesheet. |
| TypeScript | **6.0.3** | Server code (D1 schema, Stripe, Access) | Keep `engine.js` as plain JS (`allowJs`) to respect the upstream code. Use TS for everything that touches money, auth or the database. TS 7.0.2 is the new Go-based compiler, and Next 16.3.8 does not say it supports it. LOW confidence, so stay on 6.0.x. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `drizzle-orm` | **0.45.3** | Typed D1 queries (`drizzle(env.DB)` from `drizzle-orm/d1`) | All D1 access. It is thin, has no runtime engine and works with D1 batch. |
| `drizzle-kit` | **0.31.11** (dev) | `drizzle-kit generate` → flat `NNNN_name.sql` files in `migrations/` | Point `migrations_dir` in wrangler config at the same folder. **Stay on 0.31.** drizzle-kit 1.0 (RC) changes the layout to one folder per migration, which `wrangler d1 migrations apply` does not read as flat files. |
| `next-intl` | **4.14.9** | Messages, `getTranslations`, typed `Link` per locale | All UI strings in EN/AR/FR. Use `setRequestLocale` + `generateStaticParams` so pages prerender. |
| `stripe` | **23.0.0** (API `2026-09-30.endive`) | Checkout Sessions, Connect account links, webhooks | Ships a `workerd` export condition (fetch client + SubtleCrypto). Verify webhooks with **`stripe.webhooks.constructEventAsync`**. The sync version fails on Workers. |
| `resend` | **6.32.0** | Visitor and Houssem confirmation emails | Call `resend.emails.send` with HTML, or with `react:` plus `@react-email/components` 1.0.12 if templates grow. |
| `jose` | **6.2.12** | Validate the Access JWT (`createRemoteJWKSet` + `jwtVerify`, issuer = team domain, audience = AUD tag) | Every `/api/admin/*` handler and the `/admin` layout. This is Cloudflare's own documented Workers sample. |
| `zod` | **4.6.5** | Validate booking form, admin upload metadata, webhook payload shape | Every route handler input. |
| `@date-fns/tz` + `date-fns` | **1.5.0 / 4.4.0** | Slot maths in `Asia/Dubai`, blocked time | Booking calendar and blocked-time logic. Store UTC in D1 and render in Dubai time. |
| `libphonenumber-js` | **1.13.14** | Validate the WhatsApp/phone field | Booking form (GCC numbers). |
| `@fontsource-variable/host-grotesk` | **5.3.0** | Latin/French font files (OFL) | Copy the woff2 into `public/fonts/` and declare `@font-face` yourself, or import the CSS. Do not depend on `next/font` for this, so the files stay portable to vinext. |
| `@fontsource/ibm-plex-sans-arabic` | **5.3.0** | Arabic font files, weights 400/500/600 (OFL) | Use the `arabic` subset only, with `unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF`, so EN/FR pages never download it. |
| `lil-gui` | **0.21.0** (dev only) | Engine tuning panel | Load only in dev or behind a key. Never ship it in the production bundle. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| wrangler 4.147.0 | D1 migrations, R2, secrets, deploy, types | **Houssem's account only.** Run with a separate HOME (`HOME=/Users/koss/.mansouri-cloudflare wrangler …`), the same way ALMAR does, and **pin `account_id` in `wrangler.jsonc`**. Never use the default Vamos login. |
| `wrangler types` | Generates `CloudflareEnv` (DB, MEDIA, ASSETS, secrets) | Run after every binding change. Commit the generated `cloudflare-env.d.ts`. |
| `opennextjs-cloudflare preview` | Runs the real Worker build locally in workerd | The gate before every deploy. `next dev` alone does not prove the Worker works. |
| `@playwright/test` 1.63.0 | Smoke: each locale's home renders a canvas, booking happy path, RTL `dir` set, no console errors | Same approach as the sister project. Add a mobile viewport project (Pixel 7 / iPhone 15). |
| `vitest` 5.0.3 + `@cloudflare/vitest-pool-workers` 0.22.0 | Unit tests for slot maths, webhook handler and Access check against a real D1 in Miniflare | Server logic only. The carousel feel is checked by hand. |
| Stripe CLI | `stripe listen --forward-to localhost:8787/api/stripe/webhook` | Webhook development. Test mode only until Houssem's account is approved. |
| ffmpeg (Houssem's or Koss's machine) | `-movflags +faststart`, H.264 High, AAC, about 6 to 8 Mbps at 1080×1920, plus a WebP/AVIF poster | **faststart is required**: without the `moov` atom at the front, phones must download the whole file before the first frame. |
## Installation
# core
# dev
## Detail per decision
### 1. Why OpenNext over vinext over Astro (for v1)
- **Cloudflare's guide now names vinext as the default** for Next on Workers (page updated 2026-08-25, which called vinext "beta"). The `nextjs-on-cloudflare` skill installed on this Mac says the same. **vinext reached 1.0.0 on 2026-09-28 and 1.0.1 on 2026-10-01.** That is five days of 1.0.
- vinext's own README (current) still says *"Under active development … not yet a drop-in replacement for every application or production workload"* and, on production use, *"You can, with caution."*
- **Open vinext issues hit exactly what this site uses.** #3671: next-intl `setRequestLocale` is lost during the page probe, so every `[locale]` page is marked dynamic (opened this week). Another open issue: async `generateMetadata` tags render into a hidden `<div>` in `<body>` instead of `<head>`. Per-locale titles and hreflang come from async `generateMetadata`, so this would hurt SEO. `next/font` and `next/image` are only partial there; this design uses neither for anything important.
- **OpenNext** is at 1.20.x with weekly releases and supports all Next 16 minors. Its gap is **Next 16 `proxy.ts`**: Next 16's bundled docs say *"Proxy defaults to using the Node.js runtime"*, and OpenNext's support for that (PR #1309, merged 2026-08-25) logs *"Node.js middleware support is experimental … not officially maintained"*. **Fix: ship no proxy.** next-intl works with prefix-based routing and no proxy. Locale negotiation at `/` is a 10-line `app/route.ts`. Admin auth is the Access JWT check in handlers.
- **Astro 7.3.5 + `@astrojs/cloudflare` 14.3.3**: Cloudflare acquired Astro in January 2026, its Workers support is first-class, and it has built-in i18n routing. The framework-free engine would fit it well. It loses for this project because it throws away the React booking flow and the overlay patterns shared with Koussay-Portfolio, and Koss runs Next across his products. A two-week deadline does not suit a framework switch.
### 2. D1 with Drizzle
- Schema in `db/schema.ts`. `drizzle.config.ts` uses `dialect: "sqlite"`, `driver: "d1-http"` (only for Studio/introspection) and `out: "migrations"`.
- Flow: `drizzle-kit generate` → review the SQL → `wrangler d1 migrations apply DB --local` → test → the control session runs `--remote` on the live database and reads the schema back (`wrangler d1 execute DB --remote --command "PRAGMA table_info(bookings)"`). **Never `drizzle-kit push` or `drizzle-kit migrate`** against D1: they skip wrangler's `d1_migrations` table and break the read-back.
- Use `db.batch([...])` for multi-statement writes, such as a booking row plus a blocked slot. D1 has no interactive transactions.
- Raw SQL is still allowed through `sql\`\`` for one-off reporting. A raw-only layer was rejected because the booking and payment state machine benefits from typed columns.
### 3. R2: delivery and uploads
- Cloudflare docs: `r2.dev` is *"rate-limited and should only be used for development purposes"*. Caching, WAF and Access need a custom domain. MP4, WEBP and AVIF are in the default cached extension list. The cache object limit is 512 MB on Free/Pro/Business. The CDN serves client `Range` requests from cache, so seeking works with no Worker code and no Worker CPU or request cost.
- Object keys are content-addressed (`films/<sha256-12>.mp4`, `posters/<sha>.webp`) with `Cache-Control: public, max-age=31536000, immutable`, set as R2 object `httpMetadata` at upload.
- **CORS is required** because posters become WebGL textures (`crossOrigin = "anonymous"`). Set an R2 CORS rule allowing `GET, HEAD` from `https://mansourimedia.com`. Also add a **Response Header Transform Rule on `media.` that always sets `Access-Control-Allow-Origin: *`**. Without it, an edge-cached response stored without an `Origin` header can be served without CORS. The sister project recorded this as the "missing `Vary: Origin`" trap, and it shows up as a WebGL `SecurityError` on a warm cache.
- Unpublished uploads are publicly reachable by key. Hashed keys are unguessable, and nothing lists the bucket. Acceptable for portfolio media.
- A request body is capped at **100 MB on Free/Pro zones**, so a single POST through the Worker cannot carry a large film. Multipart solves it: the browser slices the `File` into **about 25 MB parts**. Each part is POSTed to `/api/admin/upload?action=mpu-uploadpart&uploadId=…&part=n`, and the handler calls `env.MEDIA.resumeMultipartUpload(key, uploadId).uploadPart(n, request.body)`. `mpu-create` and `mpu-complete` bracket it. This is Cloudflare's documented pattern ("Use the R2 multipart API from Workers", updated 2026-07-31). Parts are resumable after a dropped connection.
- Why not presigned URLs: they need an R2 S3 API token stored as a secret, a bucket CORS rule allowing `PUT` from the admin origin, and `aws4fetch` or the AWS SDK. The binding route needs no extra credential, and the Access check already guards it. Presigned PUT (up to 5 GiB, expiry 1 s to 7 days) is the fallback if Worker-proxied parts turn out slow from Houssem's connection.
- Posters: the admin page grabs a frame client-side (`<video>` → `<canvas>` → `toBlob('image/webp')`) or accepts an uploaded still, then does a normal single PUT through the Worker (well under 100 MB).
- Guard in admin before upload: read the first few KB of the file in the browser and refuse it if the `moov` atom is not before `mdat` (not faststart). Workers cannot run ffmpeg.
### 4. Cloudflare Access for /admin
- Access application(s) on `mansourimedia.com/admin*` and `mansourimedia.com/api/admin*`. Policy: include the email `houssemansouri96@gmail.com` (plus Koss's email if he should have access). Login method: one-time PIN. The Zero Trust Free plan covers up to 50 users. LOW confidence on whether signing up asks for a payment method: Houssem's step.
- Every admin handler checks the token itself. Cloudflare's guidance: *"When Cloudflare Access is in front of your Worker, your Worker still needs to validate the JWT"*. Read `cf-access-jwt-assertion` (not the cookie, which *"is not guaranteed to be passed"*) and run `jwtVerify(token, createRemoteJWKSet(new URL(TEAM_DOMAIN + "/cdn-cgi/access/certs")), { issuer: TEAM_DOMAIN, audience: ACCESS_AUD })`. Keep the JWKS object at module scope so it is cached per isolate.
- **Turn off `workers_dev` and `preview_urls`.** Access is bound to the hostname, so a `*.workers.dev` URL would serve `/admin` with no Access in front. The JWT check then becomes the only lock.
- Local dev: the check is skipped only when `NEXTJS_ENV === "development"`, and a test asserts it is never skipped in a production build.
### 5. Stripe Connect: what UAE actually allows
- *"Due to restrictions … in the United Arab Emirates … platform users in these countries can't self-serve Express connected accounts. To begin onboarding … contact us."* **Koss's UAE platform must go through Stripe sales before Houssem can be onboarded.** That is a lead time outside the code.
- *"Platforms in the UAE can only use Express connected accounts based in the UAE with … destination_charges and separate charges and transfers. Destination charges using the on_behalf_of attribute aren't yet supported for UAE platforms."* **Direct charges are not available to a UAE platform.**
- Connected account business types: *"Sole establishments, free zone establishments, or branches of sole establishments; LLCs, free zone LLCs …"* and *"a valid trade license issued within the UAE"*. **Individuals without a trade licence cannot be connected accounts.** Whether Houssem holds a licence for Mansouri Media is not known. It is a new OPEN item.
- *"It is not possible to create UAE connected accounts where the platform is liable when the connected account can't pay back their losses."* Classic Express makes the platform liable for negative balances, so the exact controller set-up (for example `losses.payments: "stripe"` with the Express dashboard) has to be confirmed with Stripe sales. LOW confidence until they answer.
- **Integration to build once allowed:** a hosted Checkout Session (`mode: "payment"`) with `payment_intent_data: { application_fee_amount, transfer_data: { destination: acct_… } }` and no `on_behalf_of`. Consequence to put to Koss: with destination charges **without `on_behalf_of`, Koss's platform is the merchant of record**. His business name appears on the card statement, he pays the Stripe fee, and refunds and disputes debit his balance first (then the transfer can be reversed). This is a business and legal decision for the pricing discussion, not a code detail.
- Webhooks: `checkout.session.completed` and `payment_intent.payment_failed` arrive on the **platform** endpoint, because destination charges live on the platform. `account.updated` (onboarding complete) needs a separate **Connect** endpoint. That makes two signing secrets.
- **Roadmap implication:** build deposits last, behind a feature flag that stays off until Stripe sales confirms, Houssem is onboarded, and Koss has signed off the amounts and fee %. v1 can launch with the free call and shoot request, which need no payment. Fallback if Connect is refused: Houssem takes deposits on his own Stripe account through a Payment Link, and Koss invoices his commission separately. That is a business choice for Koss, not a recommendation to switch.
### 6. Resend on Workers
- The SDK is fetch-based (dependencies: `postal-mime`, `standardwebhooks`). Resend's own Cloudflare Workers guide uses it unchanged. Send from the booking route handler and **await it before responding** (or use `ctx.waitUntil` from `getCloudflareContext().ctx`). A Worker that returns first may drop the send.
- Domain: add Resend's DKIM/SPF/return-path records to the `mansourimedia.com` zone in Houssem's Cloudflare. Sender `bookings@mansourimedia.com`, with `reply_to` set to the visitor for the email to Houssem. Whose Resend account it is (Koss's or Houssem's) is an open item.
- Cloudflare Email Service (native `send_email` binding, no API key) now exists and could replace Resend later. Keep Resend as decided: the sister project's templates and know-how carry over.
### 7. i18n with RTL
- `app/[locale]/layout.tsx` renders `<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>`, calls `setRequestLocale(locale)`, and has `generateStaticParams()` over `["en","ar","fr"]`. Messages live in `messages/{en,ar,fr}.json`. Claude drafts AR and FR, and Houssem checks them.
- No proxy. `app/route.ts` (GET `/`) parses `Accept-Language` (ar → `/ar`, fr → `/fr`, else `/en`) and returns a 307. next-intl documents prefix routing without middleware, with `localePrefix: 'always'`. Admin and API routes sit outside `[locale]`.
- RTL rules: use logical Tailwind utilities only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`); add the `rtl:` variant for icons and arrows. **The WebGL canvas stays LTR in maths.** Whether drag direction or panel order flips in Arabic is a design question for the UI phase. Do not assume a mirrored ring.
- Arabic digits: show Latin digits for phone numbers and dates, which is common in the UAE. Use `Intl.DateTimeFormat("ar-AE", { numberingSystem: "latn" })`.
### 8. Font: Host Grotesk + IBM Plex Sans Arabic
- **Latin: Host Grotesk** (Element Type; variable 300 to 800; latin + latin-ext, so French accents are covered). Its warmth and open apertures are close to Lay Grotesk's contemporary grotesk character at the reference's `text-sm`/`text-base` sizes. **Geist is the sister project's face**, so Mansouri Media gets a distinct identity with Host Grotesk. Inter Tight is too neutral and tight for a brand voice. MEDIUM confidence on "closest look": confirm by a side-by-side render in the UI phase.
- **Arabic: IBM Plex Sans Arabic** (Khajag Apelian, Wael Morcos, Bold Monday). It was drawn as the Arabic partner of a grotesk, and it stays clean and readable at small UI sizes. It has static weights only, so load 400/500/600. **Alexandria** (variable, more geometric) is the alternative if Koss wants Arabic headings to echo the geometric "mansouri" wordmark.
- Delivery: self-hosted woff2 under `public/fonts/`, with OFL files committed beside them. One family stack `"Host Grotesk", "IBM Plex Sans Arabic", system-ui, sans-serif`, and `unicode-range` so the Arabic file loads only when Arabic glyphs appear. Preload only the Latin variable file. Bundle no `.otf` or `.ttf` (the sister project's HYG rule).
### 9. Mobile WebGL: viable with a lighter tier
- `antialias: true` on the renderer, which is wasted: the visible canvas only draws a fullscreen quad. DPR is capped at 2, and the FBO is sized `W*dpr × H*dpr`.
- The lens fragment shader loops up to 16 dispersion samples, each with three `exp(pow())` weights, plus an optional 18-tap rim blur. It exits early outside the ellipse, **but the ellipse is `0.565 × 1.0` of viewport *height*. On a portrait phone that is wider than the screen, so the lens covers almost every pixel.** At DPR 2 on a 390×844 phone that is about 1.3 M pixels × 16+ texture reads every frame, which costs the most on mid-range Android GPUs (Mali-G57/G68, Adreno 6xx) and leads to thermal throttling after 20 to 30 seconds.
- The shimmer uses `uTime`, so the loop renders every frame even when nothing moves.
| Knob | Desktop | Mobile | Low tier (FPS probe < 45 during entry) |
|------|---------|--------|----------------------------------------|
| `setPixelRatio` cap | 2 | **1.5** | **1.25** |
| FBO scale vs canvas | 1.0 | 1.0 | **0.75** (upsampled by the lens pass; the lens hides softness) |
| Dispersion samples | 16 | **8** | **6** |
| Rim blur (`uBlur`) | as tuned | **0** | 0 |
| `antialias` | false | false | false |
| Anisotropy | max | **4** | 2 |
| Render loop | continuous | **stop when idle** (no input, snap settled, no tween running): freeze shimmer, render one frame | same |
| Texture size | poster at full res | **poster at about 720 px tall** (`posters/<sha>@720.webp`) | same |
- Precompute the three Gaussian weights per sample on the CPU into a uniform array (`uW[16]`) instead of `exp(pow())` per pixel. This is cheap and changes nothing visible.
- Make the sample count a **compile-time `#define`** per tier rather than a uniform loop bound. Some mobile GLSL compilers do not unroll `if (i >= N) break;` well.
- **The film plays in a DOM `<video playsinline>` above the canvas in focus mode, not a `VideoTexture`.** This gives hardware decode, native controls and sound on tap (the click is the user gesture), and saves GPU on the phone. The canvas can pause while the video plays.
- Handle `webglcontextlost` (iOS drops contexts when the tab goes to the background): rebuild on `webglcontextrestored`. Fallbacks: no WebGL, `prefers-reduced-motion`, or a failed FPS probe at the lowest tier → a static CSS scroll-snap row of posters with the same overlay and booking CTAs.
- Remove the reference's `<1025px` black-screen gate (already decided).
- Confidence MEDIUM: the principles (fill rate × samples, DPR capping, idle rendering) are standard and confirmed by several sources. The **actual thresholds must be measured on a real mid-range Android and an older iPhone in the carousel phase.** Budget one day for it.
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| OpenNext 1.20.8 | **vinext 1.0.x** (Cloudflare's stated default) | Once vinext #3671 (next-intl static rendering) and the `generateMetadata`-in-body issue are closed and `vinext check` passes on this repo. Probably a post-v1 migration done together with Koussay-Portfolio. |
| OpenNext 1.20.8 | Astro 7.3.5 + `@astrojs/cloudflare` 14.3.3 | A new content-only site with no React flows to reuse. Strong on Workers (Cloudflare owns Astro since January 2026), but it would mean rewriting the booking flow. |
| Drizzle 0.45.3 | Raw `env.DB.prepare()` | A one-table app. Here the bookings, payments, media and blocked-time tables are worth the types. |
| Drizzle 0.45.3 | Drizzle 1.0 RC | After 1.0 is stable and wrangler reads the new folder layout. |
| R2 binding multipart | Presigned PUT via `aws4fetch` 1.0.20 | Upload speed through the Worker is poor from Houssem's connection, or files exceed what part-chunking handles comfortably. |
| R2 MP4 + poster | Cloudflare Stream | Playback stalls on poor mobile data (it gives adaptive HLS). Already deferred in PROJECT.md. |
| Resend | Cloudflare Email Service (`send_email` binding) | If removing the Resend account and API key becomes worth more than reusing the sister project's set-up. |
| next-intl | Hand-rolled dictionaries (`getDictionary(locale)`) | Only if next-intl blocks a vinext migration. You would lose typed messages, plurals and formatting. |
| Host Grotesk | Geist / Inter Tight | Geist if Koss wants one face across his projects. Inter Tight if a denser, more neutral look is wanted. |
| IBM Plex Sans Arabic | Alexandria / Readex Pro | Alexandria for a more geometric Arabic that echoes the wordmark. Readex Pro if one family covering both Arabic and Latin is preferred. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `proxy.ts` / `middleware.ts` | Next 16 proxy always runs on Node. OpenNext support for it is "experimental … not officially maintained". `middleware.ts` is deprecated in Next 16. | Locale redirect in `app/route.ts`. Access JWT checked in handlers. |
| `export const runtime = "edge"` | OpenNext does not support the edge runtime | The default Node runtime (workerd with `nodejs_compat`) |
| `@cloudflare/next-on-pages` / Cloudflare Pages | Deprecated path. Workers + Static Assets is the current target. | OpenNext on Workers |
| `next/image` optimisation | Needs an image loader on Workers; vinext supports it only partially. Media is pre-sized anyway. | Plain `<img>` / WebGL textures from `media.` with fixed sizes (`@720`, full) |
| `next/font` | Ties fonts to Next's build pipeline (partial in vinext) | Self-hosted woff2 + `@font-face` |
| `r2.dev` URLs in production | Rate-limited, no cache, no WAF | `media.mansourimedia.com` custom domain |
| `drizzle-kit push` / `migrate` on D1 | Bypasses wrangler's migration table and the read-back ship rule | `drizzle-kit generate` + `wrangler d1 migrations apply` |
| `stripe.webhooks.constructEvent` (sync) | Node crypto path. Fails on Workers. | `constructEventAsync` |
| Direct charges / `on_behalf_of` | Not available to a UAE platform | Destination charges without `on_behalf_of` |
| `THREE.VideoTexture` for the focused film | GPU upload every frame, iOS autoplay and sound quirks | DOM `<video playsinline>` over the canvas |
| `WebGPURenderer` | Not needed for one fullscreen pass, and riskier on mid-range phones | `WebGLRenderer` |
| Default wrangler login | It is the Vamos account; Vamos configs pin no `account_id` | Separate HOME for Houssem's account + pinned `account_id` |
| TypeScript 7.x | New Go compiler; no Next 16.3.8 support statement found | TypeScript 6.0.3 |
| Lay Grotesk, Behance demo images | Commercial licence / not licensed | Host Grotesk + IBM Plex Sans Arabic; Houssem's own posters |
## Stack Patterns by Variant
- Ship v1 with the free call and shoot request only. The deposit option is hidden, not shown as a dead control (Koss's rule: no fake controls).
- Because UAE Connect is not self-serve, and Koss must decide on liability and the fee first.
- Serve the static poster row on that device class, with the same overlay, filters and booking.
- Because the core value is "watch and book", and a janky ring hurts that more than a static row does.
- Still ship on OpenNext, then migrate as its own phase with a full smoke run.
- Because an adapter swap inside a two-week window adds risk without visible gain.
## Version Compatibility
| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@opennextjs/cloudflare@1.20.8` | `next >=16.3.8`, `wrangler ^4.125.0` | From its `peerDependencies`. The reference's `next@16.2.6` is below the floor. |
| `next@16.3.8` | `react`/`react-dom ^19`, `eslint-config-next@16.3.8` | `eslint-config-next` needs `eslint >=9`. |
| `next-intl@4.14.9` | `next ^16` | Peer range confirmed. `next/root-params` support exists but is optional. Use `setRequestLocale` + `generateStaticParams`. |
| `drizzle-orm@0.45.3` | `drizzle-kit@0.31.11` | Both on npm `latest`. Do not mix with the 1.0 RC tags. |
| `stripe@23.0.0` | Workers (`workerd` export condition) | Pins API `2026-09-30.endive`. Set `apiVersion` explicitly to the same value. |
| `three@0.186.1` | `gsap@3.15.0` | No coupling. Pin three exactly. |
| `tailwindcss@4.3.3` | `@tailwindcss/postcss@4.3.3` | Keep both on the same version. |
| `vitest@5.0.3` | `@cloudflare/vitest-pool-workers@0.22.0` | Check the pool's vitest peer range at install. If 5.x is not yet listed, use the vitest major it names. LOW. |
## Open items this research adds (do not invent answers)
## Sources
- Cloudflare, Next.js framework guide (vinext default, beta note; updated 2026-08-25): https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ (HIGH)
- vinext README, releases 1.0.0 (2026-09-28) and 1.0.1, issue #3671: https://github.com/cloudflare/vinext (HIGH)
- OpenNext Cloudflare docs and get-started: https://opennext.js.org/cloudflare, https://opennext.js.org/cloudflare/get-started (HIGH). proxy.ts PR #1309: https://github.com/opennextjs/opennextjs-cloudflare/pull/1309 (MEDIUM)
- Next.js 16.3.8 bundled docs, `proxy.md` "Runtime" section (read from the npm tarball) (HIGH)
- Workers limits and pricing (64 MiB, 10 ms Free CPU, $5 Paid): https://developers.cloudflare.com/workers/platform/limits/, https://developers.cloudflare.com/workers/platform/pricing/ (HIGH)
- R2 public buckets, presigned URLs, Workers multipart: https://developers.cloudflare.com/r2/buckets/public-buckets/, https://developers.cloudflare.com/r2/api/s3/presigned-urls/, https://developers.cloudflare.com/r2/api/workers/workers-multipart-usage/ (HIGH)
- Cache default extensions, 512 MB, range: https://developers.cloudflare.com/cache/concepts/default-cache-behavior/ (HIGH)
- Access JWT validation (Workers + jose sample): https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/ (HIGH)
- Stripe Express accounts (UAE restrictions): https://docs.stripe.com/connect/express-accounts (HIGH). Connect availability in the UAE: https://support.stripe.com/questions/connect-availability-in-the-uae (HIGH). Cross-border payouts: https://docs.stripe.com/connect/cross-border-payouts (HIGH)
- Resend on Cloudflare Workers: https://resend.com/docs/send-with-cloudflare-workers (HIGH)
- next-intl docs via Context7 `/amannn/next-intl` (routing without middleware, static rendering) (HIGH)
- Drizzle docs via Context7 `/drizzle-team/drizzle-orm-docs` (D1 + `migrations_dir`, v1 folder layout change) (HIGH)
- Google Fonts METADATA.pb (licence and subsets) in https://github.com/google/fonts (HIGH)
- Cloudflare acquires Astro (2026-01-16): https://www.cloudflare.com/press/press-releases/2026/cloudflare-acquires-astro-to-accelerate-the-future-of-high-performance-web-development/ (HIGH)
- Mobile three.js DPR and fill rate: https://www.utsubo.com/blog/threejs-best-practices-100-tips, https://dev.to/dheerajakula/why-a-static-threejs-scene-still-cooks-your-phone-and-the-dirty-flag-fix-3a6h (MEDIUM)
- npm registry versions read 2026-10-03 (HIGH)
- Local: `_reference/liquid-glass-carousel/lib/carousel/engine.js` (shader and DPR), `~/.claude/skills/nextjs-on-cloudflare/SKILL.md`, Koussay-Portfolio `.planning/ROADMAP.md` Phase 3.1/4
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
