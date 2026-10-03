# Walking Skeleton — Mansouri Media

**Phase:** 1
**Generated:** 2026-10-03

## Capability Proven End-to-End

A visitor opens `https://mansourimedia.<subdomain>.workers.dev` and gets the signed holding page in English, Arabic (RTL) or French; an admin signs in to `/admin` with an email one-time code (Cloudflare Access), presses "Run check" on the signed "System check" page and sees the row written to and read back from D1 (last five); on the signed "Media lab" page a test film from R2 seeks (HTTP 206 on first and repeat request) and its poster loads into WebGL — all served by one Worker in Houssem's "Houssam Portfolio" account, deployed by Workers Builds from GitHub, within the Workers Free plan.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16.3.8 App Router + `@opennextjs/cloudflare` 1.20.8; no `proxy.ts`/`middleware.ts`; no edge runtime; no `next/font`/`next/image` | Locked stack (CLAUDE.md); OpenNext floor is Next 16.3.8; proxy support in OpenNext is experimental |
| Worker entry | Custom `worker.ts` wraps `.open-next/worker.js`: order = admin JWT gate → `/` locale 307 → `/media/*` from R2 → OpenNext | Keeps cheap paths and the security gate out of Next (Free-plan CPU), one choke point for admin |
| Rendering | `[locale]` pages SSG (`generateStaticParams` + `setRequestLocale`), OpenNext static-assets incremental cache with cache interception; admin pages dynamic | PLAT-04: public pages never rendered per request |
| i18n | next-intl 4.14.9, `localePrefix: "always"`, `/en` `/ar` `/fr`, `<html lang dir>`, messages in `messages/{en,ar,fr}.json`; root `/` negotiated in `worker.ts` | No proxy; Arabic RTL from the first version |
| Fonts | Host Grotesk (variable, latin + latin-ext) and IBM Plex Sans Arabic (400/500, arabic subset) self-hosted woff2 in `public/fonts/*` with `OFL.txt`; Arabic loads only via `unicode-range` | Licences (OFL), no Google Fonts request, portable |
| Data layer | Cloudflare D1 + Drizzle ORM 0.45.3; drizzle-kit 0.31.11 `generate` only → flat `migrations/NNNN_name.sql`; applied with `wrangler d1 migrations apply` by database name; never `drizzle-kit push/migrate` | Read-back through wrangler's `d1_migrations` table; production migration is a control-session step after Ship |
| Environments | One Worker `mansourimedia`; top-level config = production (`mansourimedia-db`, `mansourimedia-media`); `previews` block = preview (`mansourimedia-db-preview`, `mansourimedia-media-preview`); local = Miniflare state; tests = `wrangler.test.jsonc`; `wrangler.preview-migrations.jsonc` for preview migrations | D-10: previews never bind production; a unit test fails on any shared id/name or missing preview binding/var |
| Media | R2 binding served by the Worker at `/media/<key>` with Range → 206/416/304, ETag, immutable cache, ACAO `*`; no r2.dev; body streamed untouched | D-04 (no domain yet); seeking on Safari; CPU-free streaming |
| Auth | Cloudflare Access self-hosted app on `/admin` and `/api/admin` (production host + `*-mansourimedia` preview wildcard), one-time PIN, two allowed emails; Worker and every admin handler verify `Cf-Access-Jwt-Assertion` with `jose` (RS256, iss = team domain, aud = AUD, email allow-list); no dev bypass | D-02, D-05, PLAT-05; Access is the first lock, the Worker the second |
| Account safety | `scripts/wr.sh` (HOME=/Users/koss/.mansouri-cloudflare, project-local wrangler 4.147.0) → `scripts/cf-guard.mjs` (pinned `account_id` 1c850e50f5cbd5777f020315ccc72718, whoami must see only that account; in Workers Builds prints the account before deploy/preview) | D-01; the default login is the Vamos account |
| Deployment target | Workers Builds on push to `main` (production) and non-main branches (Worker Previews via `wrangler preview`); pushing `main` is a ship — control session only, after Koss's Ship answer | D-08, D-09, D-10 |
| Tests | vitest 4.1.11 (`node` project: guard, config, Access; `workers` project via `@cloudflare/vitest-pool-workers` 0.22.0: real D1/R2); Playwright 1.63.0 (desktop, Pixel 7, iPhone 15) against the local Worker on port 8791 or `BASE_URL`; `scripts/verify-live.sh` for any URL; `scripts/prepush-check.sh` before every push | Every behaviour automated; live checks repeatable per host |
| Directory layout | `app/[locale]/*` public, `app/admin/*` + `app/api/admin/*` admin (own root layout), `lib/{auth,media,db,cf,i18n,admin}`, `db/schema.ts`, `migrations/`, `messages/`, `scripts/`, `tests/` (+ `tests/workers/`), `e2e/` | Bindings touched only in `lib/cf/env.ts` (Next) and `worker.ts`, so a later vinext move is contained |

## Stack Touched in Phase 1

- [ ] Project scaffold (framework, build, lint, test runner) — 01-01, 01-04
- [ ] Routing — `/` → `/en|/ar|/fr`, `[locale]` pages, `/media/*`, `/admin`, `/admin/lab`, `/api/admin/ping` — 01-01, 01-02, 01-05, 01-09 (gate + API), 01-10 (admin pages)
- [ ] Database — read AND write: `runCheck` inserts one `checks` row and reads the last five back — 01-04, 01-09, live 01-12 (after ship 2, 01-11)
- [ ] UI — "Run check" button (signed /admin design) wired to `POST /api/admin/ping`; WhatsApp/email buttons; language switch — 01-02, 01-10
- [ ] Deployment — live at `mansourimedia.<subdomain>.workers.dev` via Workers Builds; previews on `*-mansourimedia.<subdomain>.workers.dev`; local full stack: `bash scripts/preview-local.sh` (port 8791) — 01-06 (ship 1), 01-07, 01-11 (ship 2)

## Out of Scope (Deferred to Later Slices)

- Domain `mansourimedia.com` and `media.mansourimedia.com` (deferred until Koss buys the domain; then media moves to the custom domain with edge cache and a CORS transform rule)
- Workers Cache / edge cache for media — waits for the real domain (Koss, 2026-10-03: in Phase 1 "cold and cached" means first and repeat Range request both 206 from the Worker, plus browser cache)
- Workers Paid plan (only if Free limits are hit; Koss decides)
- Carousel, film focus view, real films and posters (Phase 2); content model, uploads, designed admin (Phase 3)
- Site sections, hreflang, "unreviewed" marking of AR/FR (Phase 4); booking, Resend, Turnstile, WhatsApp floating button (Phase 5)
- Stripe deposits (Phase 7)
- Any copy beyond the signed holding page; Houssem's review of AR/FR holding copy is pending (D-07)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: a visitor browses Houssem's films in the liquid-glass carousel and watches any of them full height (seed JSON, media from `/media/*`)
- Phase 3: Houssem signs in to /admin and manages works, logos and creators; the home page reads from D1
- Phase 4: logos, creators, services, industries and `/work/<slug>` pages in EN/AR/FR
- Phase 5: free call and shoot request with real slots, emails and WhatsApp; bookings in /admin
- Phase 6: launch checks on real devices, licence and content audit, live at mansourimedia.com
- Phase 7: deposits on Houssem's own Stripe, behind a switch
