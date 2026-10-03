# Project Research Summary

**Project:** Mansouri Media
**Domain:** WebGL vertical-video portfolio + booking, Dubai/GCC, EN/AR/FR, Cloudflare Workers + D1 + R2
**Researched:** 2026-10-03
**Confidence:** MEDIUM overall — versions/platform limits HIGH; mobile GPU thresholds unmeasured.

## Koss's decisions after research (2026-10-03) — these override the findings below

| Topic | Decision |
|---|---|
| Deposits | **Houssem's own Stripe account**, payouts to his bank. **No Stripe Connect, no commission.** After he quotes a booking in /admin, the visitor gets a card payment link. Confirmed only by a verified webhook. Amounts and refund copy still come from Koss (pricing talk). Stripe UAE eligibility of Houssem (trade licence) still to confirm. |
| Workers plan | **Free plan for now**, Paid later. Consequence: pages pre-rendered (static) wherever possible, API handlers kept tiny, CPU measured on the skeleton deploy; Paid is the escape hatch if error 1102 appears. |
| Resend | **Koss's Resend account**, sending domain mansourimedia.com added there. |
| Logo heading | **"Brands I've filmed for"** (EN; AR/FR equivalents), Houssem confirms each brand. |

## Executive summary

Single-operator agency site. Home = full-screen liquid-glass three.js carousel of mostly 9:16 films, filtered by industry, with a DOM `<video>` focus view; proof sections (logos, creators); six services; booking (free call, shoot request, deposit after quote); private /admin behind Cloudflare Access. One Next.js 16 Worker (OpenNext), D1 for bookings + catalogue, R2 public bucket on `media.mansourimedia.com`. The engine stays framework-free, fed `WorkItem[]`. Mobile is primary (Instagram traffic).

Top risks: (1) deploying into the wrong Cloudflare account (default login is Vamos) → separate HOME, pinned `account_id`, whoami preflight, `workers_dev=false`; (2) mobile GPU + iOS video → mobile tier, ring-sized posters, faststart MP4, tap-synchronous `play()`; (3) 2-week deadline → hard cut line; (4) Workers Free CPU limit → static rendering.

## Recommended stack (STACK.md)

- Next.js 16.3.8 + `@opennextjs/cloudflare` 1.20.8 (not vinext: 1.0 is five days old with open next-intl/metadata bugs). No `proxy.ts`. All bindings via one `lib/cf/env.ts`.
- D1 + Drizzle 0.45.3 / drizzle-kit 0.31.11 (`generate` only; apply with `wrangler d1 migrations apply`).
- three 0.186.1 pinned, GSAP 3.15.0. TypeScript for money/auth/DB; engine stays JS.
- next-intl 4.14.9, `[locale]` segment, root `app/route.ts` reads Accept-Language.
- Fonts: Host Grotesk (Latin/FR) + IBM Plex Sans Arabic, OFL, self-hosted woff2 with `unicode-range`.
- Admin: Cloudflare Access + `jose` JWT check in every admin handler.
- stripe 23.0.0 (`constructEventAsync`), resend 6.32.0, zod 4.6.5, date-fns + `@date-fns/tz` (Asia/Dubai), libphonenumber-js, Turnstile.
- Tests: Playwright (mobile projects), vitest + `@cloudflare/vitest-pool-workers`; gate deploys with `opennextjs-cloudflare preview`.

## Expected features (FEATURES.md, VIMEO-INVENTORY.md)

17 public films: 15 vertical, 1 square, 1 horizontal. Clinics & beauty, Products, Ads folders are private → hide any filter chip with zero films.

**Must have:** poster ring + industry filter + focus player (natural 9:16, sound, Esc/back/swipe, next/prev, `?film=` URL); mobile touch carousel + CSS poster-grid fallback (no WebGL / reduced motion); brand logos + creators sections (layout from sketches); services (six), industries, why-us/process from facts only; booking type chooser, free call with real slots, shoot request, WhatsApp field, Turnstile, Resend emails per language, `.ics`; floating WhatsApp button with context prefill; EN/AR(RTL)/FR with hreflang; admin: upload with poster capture, order/publish, bookings with status + WhatsApp reply, blocked time.

**Should have:** reels-style swipe in mobile focus; film → client → creator linking; booking prefilled from a film; admin "send deposit link" after quote.

**Defer:** public fixed-price deposit, per-service pages, results numbers (until proof), testimonials (until real), hover previews, Google Calendar sync, AI pre-call brief, case studies, analytics.

**Anti-features:** unproven counters, autoplay with sound, Vimeo/YouTube/Instagram embeds, price calculator, client portal, chatbot, Calendly embed, long qualifying form, fake testimonials, CMS for all copy.

## Architecture (ARCHITECTURE.md)

One Worker, one D1, one R2 on `media.mansourimedia.com`. One-way data flow D1 → server render → host → engine.
- Engine contract `createCarousel(mount, { items, tier, callbacks })` with `setItems`, `openFocusById`, `closeFocus`, `destroy`; computed REPEATS so 2–3 films still fill the row; focus scale so 9:16 fills height; single `dir` flag for RTL.
- Content: language-neutral rows + per-language text rows with `reviewed` flag (Houssem's AR/FR check = launch gate).
- Uploads: Worker R2-binding multipart (~10–25 MB parts; pick at plan time), presigned PUT as fallback; client-side poster capture, two WebP sizes; content-hash keys, 1-year cache.
- Booking: partial unique index on live claims inside one `db.batch()`; UTC storage, half-open intervals, one Asia/Dubai time module; cron sweeps expired holds.
- Payment: confirmed only by verified Stripe webhook (idempotency table); Checkout min expiry 30 min sets hold time.
- Environments: local / preview / production each with own D1, R2, Stripe mode, all in Houssem's account.

## Critical pitfalls (PITFALLS.md)

1. Wrong Cloudflare account — dedicated HOME (`~/.mansouri-cloudflare`), pinned `account_id`, whoami before every deploy, `workers_dev` + preview URLs off (else /admin bypasses Access).
2. Deposit before a price — only from an admin-quoted booking, server-computed amount; no public "pay AED X"; refund copy from Koss.
3. Mobile GPU / texture memory / context loss — DPR ≤1.5, 8 samples, `antialias:false`, idle render stop, ring-sized posters (~600×1066 desktop, ~400×712 mobile), `forceContextLoss()` on destroy, handle `webglcontextlost/restored`; test real mid-range Android + iPhone Low Power Mode.
4. iOS video + R2 — `play()` synchronously in the tap, play button on rejection, `playsinline`, faststart MP4 (admin refuses non-faststart), verify `206` live cold+warm, CORS + always-on ACAO transform rule.
5. Canvas invisible to SEO/AT/keyboard — server-rendered works list, `/work/<slug>` pages with VideoObject JSON-LD, keyboard + `aria-live`.
6. Double booking + time zones — partial unique index; Gregorian calendar + Latin digits for `ar`; Europe DST ends 25 Oct 2026 (8 days after launch) — test a Paris visitor.
7. Access bypass — verify JWT signature in every admin handler.
8. Licensing/endorsement — keep MIT notice; "Brands I've filmed for"; caption creators truthfully; Houssem confirms each brand/photo (employer NDAs).
9. Workers Free CPU (10 ms) — static pages, tiny handlers; measure on skeleton deploy.

## Implications for roadmap

- **Foundation + human track** (day 1): scaffold, pinned account, migrations, R2 + media domain + CORS, Access, skeleton deploy with CPU check; human steps: Houssem's Cloudflare account + domain, Resend domain in Koss's account, Houssem's Stripe account + eligibility, assets.
- **Carousel port + focus video** (parallel): data-driven engine, recolour, mobile/low tier, context loss, a11y, DOM list, FocusPlayer, encode script.
- **Content model + admin media** (parallel): Access guard, multipart upload, poster capture, works/brands/creators CRUD; home switches from seed JSON to D1.
- **Site sections + i18n**: sketches signed first; `[locale]`, RTL, fonts, services, industries, brands, creators, WhatsApp, `/work/[slug]`, hreflang.
- **Booking core**: availability, call claims, shoot request, blocked time, bookings admin, Resend in 3 languages, `.ics`, Turnstile, cron.
- **Deposits (Houssem's own Stripe)**: admin quote → Checkout link on his account → webhook confirms; behind a flag until his Stripe account and Koss's amounts exist. Non-blocking for launch.
- **Launch hardening**: prod resources, live 206 checks, device UAT (iPhone LPM, Android, Instagram in-app browser), licence audit, AR/FR sign-off, whoami.

**Cut line v1:** carousel desktop+mobile, focus playback, logos + creators, services, EN/AR/FR, call + shoot booking with email, WhatsApp, admin (upload, bookings, block time). **v1.1 if gated:** deposits, results numbers. Shader tuning timeboxed ~1 day. Sections with missing content are absent, never "Coming soon".

**Research flags:** carousel phase needs a real-device spike; foundation needs Workers Free CPU measurement; deposits need Stripe UAE eligibility check for Houssem's own account.

## Conflicts resolved

Upload: Worker binding multipart (presigned fallback). No `proxy.ts`. next-intl with `[locale]`. Bundle limit: trust Cloudflare's 64 MiB, measure. Video ladder (720p default vs 1080p): decide at plan time from real files.

## Open items (human, do not invent)

1. Deposit amounts, which services take one, refund/cancellation copy — pricing talk with Koss.
2. Houssem's Stripe UAE eligibility (trade licence / business).
3. Which films go in v1 + source files; private Vimeo folders unseen.
4. Clean SVG logos; identify 9 unnamed logo files; Houssem confirms each brand.
5. Houssem's role per creator; which creators have a linked film.
6. Bio, why-us, process copy.
7. Slot grid, working hours; do shoot days block calls.
8. RTL carousel direction (design).
9. Real-device thresholds for mobile tier.

## Sources

Cloudflare docs (Workers limits/pricing, R2 public buckets/multipart, D1 batch, Access JWT, Next.js guide), Stripe docs, OpenNext docs/releases, next-intl + Drizzle (Context7), npm registry, Google Fonts metadata, local reference code and Koussay-Portfolio. Full lists in the four research files.
