# Phase 1: Platform Foundation - Research

**Researched:** 2026-10-03
**Domain:** Cloudflare Workers (OpenNext + Next.js 16), Workers Builds + Worker Previews, D1, R2 media through the Worker, Cloudflare Access on workers.dev
**Confidence:** MEDIUM overall. Platform facts HIGH (official docs read today, OpenNext and wrangler source read from the npm tarballs). Two items need a live spike before code builds on them: Access path-scoping on a `workers.dev` hostname (MEDIUM) and the OpenNext + `wrangler preview` command chain (MEDIUM).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Account and access
- **D-01:** Cloudflare account is **"Houssam Portfolio", ID `1c850e50f5cbd5777f020315ccc72718`**. Wrangler is logged in with `HOME=/Users/koss/.mansouri-cloudflare` (OAuth, 2026-10-03; only this account visible). Pin `account_id` in `wrangler.jsonc`; every wrangler command uses that HOME; every deploy step prints `wrangler whoami` and fails if the account ID differs. Never the default (Vamos `e64b47de…`) login.
- **D-02:** Access allow-list for /admin: `houssemansouri96@gmail.com` and `koussayzayeni@gmail.com` (address exactly as Koss typed it, 2026-10-03), email one-time code.

#### Domain and URLs (amends PLAT-01, PLAT-02, PLAT-05)
- **D-03:** **No domain for now.** Koss cannot buy mansourimedia.com at present. The site lives at the Worker's workers.dev address. Worker name: **`mansourimedia`** → `mansourimedia.<account-subdomain>.workers.dev`. mansourimedia.com and `media.` become a later step when the domain is bought.
- **D-04:** Media (films, posters) is **served by the Worker from the R2 binding**, with HTTP Range → 206 and long cache headers. Do not use the `r2.dev` public URL (rate-limited, not for production). Posters must load into WebGL with correct CORS.
- **D-05:** Access protects **only `/admin*` and `/api/admin*`** on the workers.dev hostname; the Worker also validates the Access JWT (signature, audience, team domain) on every admin request. **Research must confirm Access can protect a path on a workers.dev hostname.** If it cannot, stop and bring the alternative to Koss — do not pick a different auth scheme without him.

#### Before launch
- **D-06:** The public workers.dev address shows a **real holding page**: Mansouri Media logo, slogan "WE MAKE YOUR VIDEOS REMEMBERED.", a working WhatsApp button (`wa.me/971505085753`) and a working email button (`houssemansouri96@gmail.com`). Nothing else public. No placeholder text, no "coming soon".
- **D-07:** Holding page in **EN, AR (RTL) and FR**. Claude drafts AR/FR; Houssem checks.

#### Code and deploys
- **D-08:** Repo is **public on GitHub: `Loomlyne/mansouri-media`** (create with the `gh` CLI, logged in as Loomlyne). Never commit `_source/` (Houssem's Drive: celebrity photos, CV with home address), `CLAUDE.local.md`, `.dev.vars`, `.env*` or any secret. Account ID in `wrangler.jsonc` is acceptable (not a secret).
- **D-09:** **Deploys by Cloudflare Workers Builds on push to `main`** (GitHub connected to the "Houssam Portfolio" account). Pushing `main` = shipping: only the control session pushes `main`, and only after Koss's Ship answer. Planning-only pushes are labelled as planning notes.
- **D-10:** **Branch previews are public** (Workers Builds preview URLs, no Access). Consequences the plan must honour: previews bind to the preview D1/R2, never production; `/admin` and admin APIs on a preview refuse every request without a valid Access JWT (so admin is unusable there, which is safe).

#### Platform limits
- **D-11:** Workers **Free plan**: public pages pre-rendered, handlers tiny; measure CPU per request on the first deploy and record it. Paid is the escape hatch if error 1102 appears (Koss decides).

### Claude's Discretion
- Exact Next.js/OpenNext scaffold, D1 schema for this phase (minimal: enough to prove migrations in three environments), test film/poster used for the 206 + WebGL CORS proof, Access application layout, cache headers.

### Deferred Ideas (OUT OF SCOPE)
- Buy mansourimedia.com, move site + media to `mansourimedia.com` / `media.mansourimedia.com` — when Koss can buy the domain.
- Resend sending domain: Resend needs a domain to send from; decide in Phase 5 (booking) — no domain exists yet.
- Workers Paid plan — only if Free CPU limits are hit.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAT-01 | Worker `mansourimedia` in "Houssam Portfolio" at its workers.dev address; `wrangler.jsonc` pins `account_id`; separate wrangler login; every deploy runs `wrangler whoami` first | Workers Builds config (build/deploy/preview commands), `wrangler whoami --json` shape read from wrangler 4.147.0 source, guard script pattern, workers.dev subdomain API. See Patterns 1, 2, 7. |
| PLAT-02 | Films/posters in R2, served by the Worker (not r2.dev); seek returns 206 cold and cached; posters load into WebGL without CORS errors | R2 binding `get(key, { range: request.headers, onlyIf: request.headers })`, `httpEtag`, `writeHttpMetadata`; same-origin texture loads; Workers Cache alternative and its trade-offs. See Pattern 4. |
| PLAT-03 | D1 with versioned migrations; separate local / preview / production databases | Top-level D1 binding = production, `previews.d1_databases` = preview, `--local` = Miniflare state; `wrangler.preview-migrations.jsonc` for the preview DB (Cloudflare's documented pattern); drizzle-kit 0.31 `generate` only. See Pattern 5. |
| PLAT-04 | Workers Free plan: pages pre-rendered, handlers under the CPU limit, measured on first deploy | OpenNext `staticAssetsIncrementalCache` + `enableCacheInterception` for SSG; next-intl `generateStaticParams` + `setRequestLocale`; custom Worker wrapper keeps `/`, `/media/*` and the admin gate out of Next; CPU visible in Workers Logs invocation logs. See Patterns 3, 6. |
| PLAT-05 | /admin and admin APIs behind Access on the workers.dev address; refuse any request without a valid Access token, including on public previews | Access hostname/path apps support `workers.dev` hostnames; path + wildcard rules; `jose` JWT check in the Worker (ctx.access is NOT available to OpenNext because Static Assets' router drops it). See Pattern 2 and the Access section. |
</phase_requirements>

## Project Constraints (from CLAUDE.md and CLAUDE.local.md)

- Every wrangler command runs with `HOME=/Users/koss/.mansouri-cloudflare`. Never the default (Vamos) login. `account_id` pinned in `wrangler.jsonc`. `wrangler whoami` before any deploy.
- Control session (the first Claude Code session in the main checkout) is the only one that commits on `main`, pushes `main`, applies D1 migrations to production, and deploys. Pushing `main` triggers a production deploy (D-09), so a push of `main` is a ship and needs Koss's Ship answer.
- Never wipe a live database. Live-row facts are read read-only.
- Secrets stay in Koss's terminal (`wrangler secret put`, Zero Trust dashboard). No secret in chat or files. Phase 1 has no secrets (AUD and team domain are not secrets; see Pattern 2).
- No invented prices, numbers, testimonials, legal copy. Holding page copy is fixed by the signed sketch (`.planning/sketches/01-holding/DECISION.md`, variant C).
- `_source/` (gitignored) holds Houssem's Drive files; never commit them. The repo is public.
- Stack constraints from CLAUDE.md: Next 16.3.8 + `@opennextjs/cloudflare` 1.20.8; no `proxy.ts`/`middleware.ts`; no `export const runtime = "edge"`; no `next/font`, no `next/image` optimisation; Drizzle 0.45.3 + drizzle-kit 0.31.11, never `drizzle-kit push`/`migrate` on D1; self-hosted Host Grotesk + IBM Plex Sans Arabic woff2; TypeScript 6.0.x (not 7.x).
- Keep the MIT notice of `_reference/liquid-glass-carousel` when code from it is used.
- GSD gates: Koss signs plan, UAT and ship. This research recommends; it does not decide where Koss must decide.
- This Mac runs other products' dev servers. Kill only processes this phase started, by port.

## Summary

**Access on a path of a workers.dev hostname is documented as supported, but not shown with an example that combines both.** Cloudflare's Workers Access page (updated 2026-08-18) lists "A specific hostname — can be `workers.dev`, a Custom Domain, or a path" as a supported target, created as a self-hosted Access application whose domain is "the hostname or path", and the Access API describes a public destination `uri` as "the public hostname and optional path to secure" with wildcard support. The one-click "Enable Access" toggle in the Worker's settings (now the Worker's **Access** tab) only offers "Previews only" or "All traffic" for the whole Worker; it cannot be scoped to a path. So the D-05 layout is: one Zero Trust **self-hosted** application with path destinations on `mansourimedia.<sub>.workers.dev/admin`, `/api/admin`, and the preview wildcard `*-mansourimedia.<sub>.workers.dev/admin`, `/api/admin`. This must be proven by a short live check before admin code depends on it. If Zero Trust refuses a workers.dev path destination, D-05 says stop and bring the alternatives (listed below) to Koss.

**Previews changed in September 2026.** Workers Builds now runs `npx wrangler preview` for non-production branches by default, which creates a **Worker Preview** with its own bindings from a `previews` block in `wrangler.jsonc`. Previews do not inherit production settings: D1 and R2 are isolated by binding the `previews` block to a different `database_id` / `bucket_name`. This is exactly D-10. The old model (aliased Version URLs via `wrangler versions upload`) **uses production resources** and must not be used. One catch found in source code: `wrangler deploy` hands off to `opennextjs-cloudflare deploy` in an OpenNext project, but `wrangler preview` does not, so the prerendered-page cache is not copied into the assets unless the Preview command runs `opennextjs-cloudflare populateCache` first.

**For the Free plan, route the cheap paths around Next.** Use OpenNext's read-only Static Assets incremental cache with cache interception for the prerendered `[locale]` pages, and a small custom Worker entry that handles `/` (Accept-Language redirect), `/media/*` (R2 with Range → 206) and the admin JWT gate before Next is loaded. Cloudflare's own `ctx.access` cannot be used here: the Static Assets router does not pass it to the user Worker, so the Worker verifies `Cf-Access-Jwt-Assertion` with `jose`, as Cloudflare's own Workers sample does.

**Primary recommendation:** One Worker `mansourimedia` (top-level config = production, `previews` block = preview D1/R2), deployed by Workers Builds with `opennextjs-cloudflare deploy`; a guard script that checks `wrangler whoami --json` against `1c850e50f5cbd5777f020315ccc72718` before every deploy, preview and resource command; and a live spike of the Access path app on workers.dev as the first gated task.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Login wall for `/admin*`, `/api/admin*` | Cloudflare edge (Access self-hosted app) | Worker (JWT verify) | Access runs before the Worker; the Worker is the second lock because Access is per hostname/path and can be misconfigured. |
| Admin JWT verification | Worker wrapper (`worker.ts`) | Admin route handlers (re-verify) | One choke point before Next runs; handlers re-check for defence in depth. |
| Holding page EN/AR/FR | Next.js SSG (build time) | Worker static assets + OpenNext cache interception | Pre-rendered at build; served from Static Assets cache without rendering. |
| `/` → `/en` / `/ar` / `/fr` | Worker wrapper | — | A 307 from a few lines of JS; no reason to load Next for it. |
| Film/poster delivery with Range | Worker wrapper → R2 binding | Browser cache | D-04: no r2.dev, no media domain yet; R2 does the byte slicing. |
| Data | D1 (prod / preview / local) | — | Separate databases per environment through the `previews` block. |
| Build and deploy | Workers Builds (Cloudflare CI) | Guard script | Builds run in Cloudflare with an account-scoped token; the guard prints and asserts the account. |
| Local resource commands (d1 create, migrations, r2 bucket) | Control session terminal with `HOME=/Users/koss/.mansouri-cloudflare` | Guard script | Only these commands touch the account from the Mac. |

## Standard Stack

### Core

| Library | Version (npm, 2026-10-03) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.3.8 | App Router, SSG of `[locale]` pages | Locked in CLAUDE.md; OpenNext 1.20.8 peer range `>=16.3.8`. [VERIFIED: npm registry] |
| `@opennextjs/cloudflare` | 1.20.8 (published 2026-10-02) | Builds Next into a Worker | Locked. Peer `wrangler ^4.125.0`. [VERIFIED: npm registry + GitHub releases] |
| `wrangler` (devDependency) | 4.147.0 (2026-10-02) | Deploy, Previews, D1, R2 | Worker Previews needs **>= 4.135.0**, and Workers Builds uses the wrangler in `package.json`. The global wrangler on this Mac is 4.124.0, too old for `wrangler preview`: always run `./node_modules/.bin/wrangler`. [VERIFIED: npm registry; CITED: developers.cloudflare.com/workers/previews/] |
| `next-intl` | 4.14.9 | Messages, static rendering per locale | Locked; peer `next ^16`. [VERIFIED: npm registry] |
| `drizzle-orm` / `drizzle-kit` | 0.45.3 / 0.31.11 | D1 schema → SQL migrations | Locked; drizzle-kit 0.31 writes flat `NNNN_name.sql` that `wrangler d1 migrations apply` reads. [VERIFIED: npm registry] |
| `jose` | 6.2.12 | Access JWT verify (`createRemoteJWKSet` + `jwtVerify`) | Cloudflare's own Workers sample uses it. [VERIFIED: npm registry; CITED: Access "Validate JWTs" doc] |
| `react` / `react-dom` | whatever `next@16.3.8` resolves (npm latest 19.3.0) | UI | Let Next pick. |
| `tailwindcss` + `@tailwindcss/postcss` | 4.3.3 | Styling, RTL logical utilities | Locked. |
| `typescript` | 6.0.3 | Types | npm `latest` is now 7.0.2; stay on 6.0.x as CLAUDE.md says. |

### Supporting (Phase 1)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@fontsource-variable/host-grotesk`, `@fontsource/ibm-plex-sans-arabic` | 5.3.0 | Source of the woff2 files | Copy woff2 into `public/fonts/` with OFL files (CLAUDE.md). |
| `vitest` | **4.1.11** (not 5.x) | Unit tests: range parser, admin gate, guard | `@cloudflare/vitest-pool-workers` 0.22.0 declares peer `vitest ^4.1.0`; CLAUDE.md's "vitest 5.0.3" does not match that peer. Phase 1 tests can run in plain Node; the pool is optional. [VERIFIED: npm registry peerDependencies] |
| `@playwright/test` | 1.63.0 | Holding page smoke (3 locales, `dir`, button hrefs), WebGL poster check | Phase 1 smoke and the WebGL CORS proof. |
| `@cloudflare/workers-types` | 5.20261003.1 | Types | Or `wrangler types` output (`cloudflare-env.d.ts`). |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Worker computes 206 from R2 (`range: request.headers`) | **Workers Cache** (`"cache": { "enabled": true }`): Worker returns a full 200 with `Cache-Control`, Cloudflare stores it and slices ranges itself (`Cf-Cache-Status: HIT`, Worker not invoked) | Works on `workers.dev`, tiered, request-collapsing, cache hits use no CPU. But: with it on, **every request to the Worker is billed and counted, including static asset requests that are otherwise free**; the cache key excludes the host and `Cookie`/`Authorization` (admin responses must be `private`/`no-store`); a 206 from the Worker is never stored; it is Worker-wide (per entrypoint). On the Free plan's 100,000 requests/day, counting every JS chunk, font and image is the bigger risk. Recommend: not in Phase 1; reconsider with the domain or Paid. [CITED: developers.cloudflare.com/workers/cache/] |
| Self-hosted Access app on `/admin` paths | Worker-level Access ("All traffic") + `overrides: [{ behavior: "public", path_pattern }]` for every public path | Fallback only, see Access alternatives. |
| One Worker + `previews` block | Wrangler environments (`env.preview` → separate Worker `mansourimedia-preview`) | Separate Worker, separate URL, more config; Cloudflare now recommends Previews for branch testing. [CITED: workers/previews/compare-workflows] |
| Aliased Version URLs (`wrangler versions upload --preview-alias`) | — | **Do not use**: "Version URLs use production resources." Violates D-10. [CITED: workers/previews/compare-workflows] |
| HOME-separated login | `wrangler --profile` (new global flag in 4.147) | Locked decision is the HOME approach; do not switch. |

**Installation:**
```bash
npm install next@16.3.8 react react-dom next-intl@4.14.9 drizzle-orm@0.45.3 jose@6.2.12 \
  @fontsource-variable/host-grotesk@5.3.0 @fontsource/ibm-plex-sans-arabic@5.3.0
npm install -D @opennextjs/cloudflare@1.20.8 wrangler@4.147.0 drizzle-kit@0.31.11 \
  typescript@6.0.3 @cloudflare/workers-types tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3 \
  eslint eslint-config-next@16.3.8 @playwright/test@1.63.0 vitest@4.1.11
```
Pin exact versions (`--save-exact` or `.npmrc save-exact=true`). Commit `package-lock.json`. Add `.node-version` with `24` to match the Workers Builds image (Node 24.18.0 default; 22.23.2 also preinstalled). [CITED: workers/ci-cd/builds/build-image/] Local Node is 26.7.0; fine for dev, but CI builds on 24.

## Package Legitimacy Audit

slopcheck 0.x was run with `-e npm` (its auto-detect picked PyPI on the first try and reported false SLOP; the npm run below is the valid one).

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| next | npm | 10+ yrs | very high | github.com/vercel/next.js | [OK] | Approved |
| @opennextjs/cloudflare | npm | ~2 yrs (1.x since 2025) | high | github.com/opennextjs/opennextjs-cloudflare | [OK] | Approved |
| wrangler | npm | 5+ yrs | very high | github.com/cloudflare/workers-sdk | [OK] | Approved |
| next-intl | npm | 5+ yrs | high | github.com/amannn/next-intl | [OK] | Approved |
| drizzle-orm | npm | 3+ yrs | high | github.com/drizzle-team/drizzle-orm | [OK] | Approved |
| drizzle-kit | npm | 3+ yrs | high | github.com/drizzle-team/drizzle-orm | [OK] | Approved |
| jose | npm | 8+ yrs | very high | github.com/panva/jose | [OK] | Approved |

`npm view <pkg> scripts.postinstall` is empty for all seven. Not slopchecked (well-known, from the locked stack): tailwindcss, @tailwindcss/postcss, typescript, vitest, @playwright/test, @cloudflare/workers-types, @fontsource packages, eslint-config-next. Treat them as [ASSUMED] legitimate; they are the same packages already used in Koussay-Portfolio.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                         Browser (phone / desktop)
                                   │  https://mansourimedia.<sub>.workers.dev/…
                                   │  (previews: <branch>-mansourimedia.<sub>.workers.dev)
                                   ▼
             ┌───────────────────────────────────────────────┐
             │ Cloudflare edge: Access self-hosted app        │
             │  path match /admin, /api/admin (prod + preview │
             │  wildcard)?  yes → OTP login (2 emails) → adds │
             │  Cf-Access-Jwt-Assertion  │  no → pass through │
             └───────────────┬───────────────────────────────┘
                             ▼
             ┌───────────────────────────────────────────────┐
             │ Static Assets (served before the Worker):      │
             │  /_next/static/*, /fonts/*, /logo.svg, …       │──► 200 (no Worker run, free)
             └───────────────┬───────────────────────────────┘
                             │ not a file
                             ▼
             ┌───────────────────────────────────────────────┐
             │ worker.ts (custom entry, runs first)           │
             │  1. path is /admin* or /api/admin*?            │
             │       verify JWT (jose, JWKS from team domain, │
             │       iss + aud) → fail: 403, stop             │
             │  2. path is "/"? → 307 /en|/ar|/fr             │
             │       (Accept-Language)                        │
             │  3. path is /media/<key>? → R2 binding MEDIA   │──► R2 bucket (prod or preview)
             │       get(key, {range, onlyIf}) → 206/200/304  │
             │  4. else → OpenNext handler.fetch              │
             └───────────────┬───────────────────────────────┘
                             ▼
             ┌───────────────────────────────────────────────┐
             │ OpenNext / Next 16                             │
             │  /en /ar /fr → prerendered HTML from Static    │
             │    Assets incremental cache (interception)     │
             │  /admin, /api/admin/ping → dynamic, re-verify  │──► D1 binding DB (prod or preview)
             └───────────────────────────────────────────────┘

  GitHub Loomlyne/mansouri-media
     push main ──► Workers Builds: guard → opennextjs-cloudflare build → opennextjs-cloudflare deploy (top-level bindings = prod)
     push other ─► Workers Builds: guard → build → populateCache → wrangler preview (previews block = preview D1/R2)
  Control session (Mac, HOME=/Users/koss/.mansouri-cloudflare): guard → d1 create / migrations apply / r2 bucket create / object put
```

### Recommended Project Structure
```
/                          # repo root (Next app at root; Workers Builds root dir = /)
├── app/
│   ├── [locale]/layout.tsx    # <html lang dir>, setRequestLocale, generateStaticParams
│   ├── [locale]/page.tsx      # holding page (variant C)
│   ├── admin/page.tsx         # Phase 1: "signed in as <email>" + media lab link (dynamic)
│   ├── admin/lab/page.tsx     # WebGL poster + <video> seek proof (behind Access)
│   └── api/admin/ping/route.ts# JSON {email} after requireAccess()
├── i18n/routing.ts, i18n/request.ts
├── messages/{en,ar,fr}.json   # copy from the signed sketch's T object
├── lib/cf/env.ts              # getCloudflareContext() wrapper (only place touching bindings)
├── lib/auth/access.ts         # verifyAccessJwt(request, env) — shared by worker.ts and handlers
├── lib/media/serve.ts         # R2 → Response (range, etag, headers)
├── db/schema.ts               # Drizzle schema
├── migrations/                # drizzle-kit output, read by wrangler
├── scripts/cf-guard.mjs       # account guard (whoami --json)
├── scripts/wr.sh              # HOME=… ./node_modules/.bin/wrangler "$@" after guard
├── worker.ts                  # custom Worker entry wrapping .open-next/worker.js
├── wrangler.jsonc             # prod top-level + previews block
├── wrangler.preview-migrations.jsonc  # preview DB only, for migrations
├── open-next.config.ts        # staticAssetsIncrementalCache + enableCacheInterception
├── public/_headers            # /_next/static/* immutable; /fonts/* immutable
├── public/fonts/              # woff2 + OFL.txt
└── tests/ (vitest), e2e/ (playwright)
```

### Pattern 1: wrangler.jsonc — production at top level, Previews isolated
**What:** One Worker. Top level = production bindings. `previews` = preview bindings (D-10). Local = `--local` on the top-level binding (Miniflare state in `.wrangler/state`).
**Example:**
```jsonc
// Sources: developers.cloudflare.com/workers/previews/configuration/, /workers/previews/resources/,
//          opennext.js.org/cloudflare/get-started, opennext.js.org/cloudflare/howtos/custom-worker
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "mansourimedia",
  "account_id": "1c850e50f5cbd5777f020315ccc72718",
  "main": "worker.ts",                       // custom entry wrapping .open-next/worker.js
  "compatibility_date": "2026-10-03",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "workers_dev": true,                       // D-03: the site IS the workers.dev URL
  "preview_urls": true,                      // D-10: public Previews on workers.dev
  "observability": { "enabled": true, "head_sampling_rate": 1 },
  "vars": {
    "APP_ENV": "production",
    "ACCESS_TEAM_DOMAIN": "https://<team>.cloudflareaccess.com",
    "ACCESS_AUD": "<aud tag of the self-hosted app>"
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "mansourimedia-db", "database_id": "<prod uuid>", "migrations_dir": "migrations" }
  ],
  "r2_buckets": [ { "binding": "MEDIA", "bucket_name": "mansourimedia-media" } ],
  "previews": {
    "vars": {
      "APP_ENV": "preview",
      "ACCESS_TEAM_DOMAIN": "https://<team>.cloudflareaccess.com",
      "ACCESS_AUD": "<same aud>"
    },
    "d1_databases": [
      { "binding": "DB", "database_name": "mansourimedia-db-preview", "database_id": "<preview uuid>", "migrations_dir": "migrations" }
    ],
    "r2_buckets": [ { "binding": "MEDIA", "bucket_name": "mansourimedia-media-preview" } ]
  }
}
```
Notes:
- "Previews do not inherit production settings." Every binding and var the code reads must also be in `previews`, or the Preview fails at runtime (1101). [CITED: workers/previews/configuration]
- `assets`, `compatibility_date`, `compatibility_flags` stay top level only. [CITED: same page]
- No `WORKER_SELF_REFERENCE` service binding: OpenNext only uses it for revalidation queues (read in `@opennextjs/cloudflare@1.20.8` source: `api/overrides/queue/*`, `api/durable-objects/queue.js`), and "Service bindings from a Preview call the bound Worker's production deployment", which would break D-10. [VERIFIED: package source; CITED: workers/previews/resources]
- No R2 incremental cache, no DO queue, no tag cache (SSG only).
- `ACCESS_AUD` and the team domain are put in `vars`: the AUD is an identifier carried in every Access JWT, not a credential; Cloudflare's own changelog sample puts both in Worker vars. [CITED: changelog 2025-10-03 one-click Access]. PITFALLS.md line 504 lists "Access AUD in wrangler.jsonc" as a secret leak; that line is superseded by this reasoning, flag for Koss if he prefers `wrangler secret put` (then previews need `wrangler preview base-config secret put` too).

### Pattern 2: Access gate in the Worker (fail closed, no bypass)
**What:** Verify `Cf-Access-Jwt-Assertion` on every `/admin*` and `/api/admin*` request before Next runs; re-verify in admin handlers.
**Why not `ctx.access`:** "Workers with Static Assets execute behind an internal router Worker. Access still protects the application and its assets. However, the router does not pass `ctx.access` to the user Worker." OpenNext always uses Static Assets. [CITED: developers.cloudflare.com/workers/configuration/cloudflare-access/]
```ts
// lib/auth/access.ts — Source: developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined; // module scope = cached per isolate
let jwksFor = "";

export function isAdminPath(pathname: string): boolean {
  // Over-match on purpose (case-insensitive, decoded): failing closed is safe.
  let p = pathname;
  try { p = decodeURIComponent(pathname); } catch { return true; }
  p = p.toLowerCase().replace(/\/{2,}/g, "/");
  return p === "/admin" || p.startsWith("/admin/") || p === "/api/admin" || p.startsWith("/api/admin/");
}

export async function verifyAccessJwt(
  request: Request,
  env: { ACCESS_TEAM_DOMAIN?: string; ACCESS_AUD?: string },
): Promise<JWTPayload | null> {
  const team = env.ACCESS_TEAM_DOMAIN, aud = env.ACCESS_AUD;
  if (!team || !aud) return null;                       // misconfigured → refuse
  const token = request.headers.get("cf-access-jwt-assertion"); // header, not the cookie
  if (!token) return null;
  if (!jwks || jwksFor !== team) {
    jwks = createRemoteJWKSet(new URL(`${team}/cdn-cgi/access/certs`));
    jwksFor = team;
  }
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: team, audience: aud, algorithms: ["RS256"],
    });
    return payload;
  } catch { return null; }
}
```
- Access signs RS256, rotates keys every 6 weeks, old key valid 7 more days; fetch the JWKS, never hard-code. [CITED: validating-json]
- Optional extra: also require `payload.email` in an allow-list var (the two D-02 addresses). Cheap second check if the Access policy is ever widened by mistake.
- No `NEXTJS_ENV === "development"` bypass in code. Unit tests inject a local key set (`createLocalJWKSet` + `SignJWT` from jose) through a test-only parameter; locally `/admin` returns 403, which is acceptable in Phase 1.

### Pattern 3: Custom Worker entry (keeps CPU out of Next)
```ts
// worker.ts — Source pattern: opennext.js.org/cloudflare/howtos/custom-worker
// @ts-ignore generated at build time
import { default as openNext } from "./.open-next/worker.js";
import { isAdminPath, verifyAccessJwt } from "./lib/auth/access";
import { serveMedia } from "./lib/media/serve";

const LOCALES = ["en", "ar", "fr"] as const;

export default {
  async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (isAdminPath(url.pathname)) {
      const claims = await verifyAccessJwt(request, env);
      if (!claims) return new Response("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    if (url.pathname === "/") {
      const al = (request.headers.get("accept-language") ?? "").toLowerCase();
      const pick = LOCALES.find((l) => al.split(",").some((part) => part.trim().startsWith(l))) ?? "en";
      return new Response(null, { status: 307, headers: { Location: `/${pick}`, Vary: "Accept-Language" } });
    }
    if (url.pathname.startsWith("/media/")) return serveMedia(request, env.MEDIA, url.pathname.slice(7));
    return openNext.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<CloudflareEnv>;
```
Precise Accept-Language parsing (q-values) is the executor's job; the shape is what matters. `wrangler.jsonc` `main` points to `worker.ts`; wrangler bundles it with esbuild at deploy. [CITED: OpenNext custom-worker how-to]

### Pattern 4: R2 → Response with Range, conditional GET, ETag
```ts
// lib/media/serve.ts — Source: developers.cloudflare.com/r2/api/workers/workers-api-reference/
export async function serveMedia(request: Request, bucket: R2Bucket, rawKey: string): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  const key = decodeURIComponent(rawKey);
  if (!/^[a-z0-9][a-z0-9._\/-]{0,200}$/i.test(key) || key.includes("..")) return new Response("Not found", { status: 404 });

  if (request.method === "HEAD") {
    const head = await bucket.head(key);
    if (!head) return new Response(null, { status: 404 });
    return new Response(null, { headers: baseHeaders(head, head.size) });
  }

  let obj: R2Object | R2ObjectBody | null;
  try {
    obj = await bucket.get(key, { range: request.headers, onlyIf: request.headers }); // Headers accepted for both
  } catch {
    const head = await bucket.head(key);           // invalid / unsatisfiable range
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${head?.size ?? 0}` } });
  }
  if (!obj) return new Response("Not found", { status: 404 });
  if (!("body" in obj)) return new Response(null, { status: 304, headers: baseHeaders(obj) }); // precondition failed

  const headers = baseHeaders(obj);
  const hasRange = request.headers.has("range") && obj.range;
  if (hasRange) {
    const r = obj.range as { offset?: number; length?: number; suffix?: number };
    const size = obj.size;
    const start = r.suffix !== undefined ? size - r.suffix : (r.offset ?? 0);
    const end = r.suffix !== undefined ? size - 1 : (r.length !== undefined ? start + r.length - 1 : size - 1);
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set("Content-Length", String(obj.size));
  return new Response(obj.body, { status: 200, headers });
}

function baseHeaders(obj: R2Object, len?: number): Headers {
  const h = new Headers();
  obj.writeHttpMetadata(h);                   // Content-Type etc. stored at upload
  h.set("ETag", obj.httpEtag);                // quoted, RFC 9110
  h.set("Accept-Ranges", "bytes");
  h.set("Cache-Control", "public, max-age=31536000, immutable"); // keys are content-addressed or never reused
  h.set("Access-Control-Allow-Origin", "*");  // harmless for public media; future media.mansourimedia.com
  h.set("Cross-Origin-Resource-Policy", "cross-origin");
  if (len !== undefined) h.set("Content-Length", String(len));
  return h;
}
```
- `range` and `onlyIf` both accept a `Headers` object; "All conditional headers aside from `If-Range` are supported." [CITED: R2 Workers API reference] Ignore `If-Range` (browsers rarely send it for media); executor may treat a present `If-Range` as "send full 200".
- CPU: "Waiting on network requests (such as fetch() calls, KV reads, or database queries) does not count toward CPU time." Passing `obj.body` straight to `Response` streams without JS touching the bytes, so a film costs about the same CPU as a tiny response. [CITED: workers/platform/limits; streaming-without-CPU is ASSUMED from runtime design, measured in validation]
- Upload of the test objects: `wrangler r2 object put mansourimedia-media/_probe/test-9x16.mp4 --file … --content-type video/mp4 --cache-control "public, max-age=31536000, immutable" --remote` (and the same to the preview bucket; `--local` for local). Executor checks the exact flags with `wrangler r2 object put --help` on 4.147.0.
- Test media: generate with the local ffmpeg 9.0.2 (no client content): a 1080×1920, ~20 s H.264 test pattern with `-movflags +faststart`, and a WebP poster from frame 1. This proves 206 and seeking without waiting for Houssem's files.
- WebGL proof page: `/admin/lab` (behind Access, so D-06 "nothing else public" holds) loads `/media/_probe/poster.webp` as a `THREE.TextureLoader` texture with `crossOrigin = "anonymous"` and a `<video>` of the test film. Same origin, so no CORS check is involved; the ACAO header is for later. [ASSUMED: same-origin requests are never CORS-tainted — standard Fetch behaviour; the page proves it]

### Pattern 5: D1 in three environments
```bash
# All through scripts/wr.sh (guard + HOME + local wrangler 4.147.0)
scripts/wr.sh d1 create mansourimedia-db            # prod → copy uuid into top-level d1_databases
scripts/wr.sh d1 create mansourimedia-db-preview    # preview → previews.d1_databases AND wrangler.preview-migrations.jsonc
npx drizzle-kit generate                            # writes migrations/0000_<name>.sql (review it)
scripts/wr.sh d1 migrations apply mansourimedia-db --local
scripts/wr.sh d1 migrations apply mansourimedia-db-preview --remote --config wrangler.preview-migrations.jsonc
scripts/wr.sh d1 migrations apply mansourimedia-db --remote      # control session only, after Koss's Ship
scripts/wr.sh d1 migrations list mansourimedia-db --remote       # read back: "No migrations to apply"
scripts/wr.sh d1 execute mansourimedia-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```
- Use the **database name**, not the binding name, in migration commands: "the binding name can change, whereas the database name cannot." [CITED: d1/reference/migrations] (`DB` is the binding in both prod and preview, so the name is the only unambiguous handle.)
- `wrangler.preview-migrations.jsonc` is Cloudflare's documented pattern for applying migrations to the preview database: a file whose top-level `d1_databases` names the preview DB with the same `migrations_dir`. [CITED: workers/previews/resources#d1-migrations]
- Minimal Phase 1 schema (discretion): one table, e.g. `settings(key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)`. Useful later (feature switches such as the deposit flag) and proves the pipeline.
- `drizzle.config.ts`: `dialect: "sqlite"`, `schema: "./db/schema.ts"`, `out: "./migrations"`. No `driver: "d1-http"` needed in Phase 1 (only for Studio). Never `drizzle-kit push`/`migrate`.
- Note: D1 config also supports `migrations_pattern` for nested layouts (Drizzle 1.0); not needed on drizzle-kit 0.31. [CITED: d1/reference/migrations]

### Pattern 6: Static `[locale]` pages that the Worker does not render
```ts
// open-next.config.ts — Source: opennext.js.org/cloudflare/caching ("SSG site")
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";
export default defineCloudflareConfig({ incrementalCache: staticAssetsIncrementalCache, enableCacheInterception: true });
```
```tsx
// app/[locale]/layout.tsx — Source: next-intl.dev/docs/routing/setup (Static rendering)
export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><body>{children}</body></html>;
}
```
- next-intl now calls `setRequestLocale` "legacy" and recommends `next/root-params`; `setRequestLocale` is "still supported". Use `setRequestLocale` in Phase 1 (works without a proxy and is what OpenNext projects use); revisit root-params later. [CITED: next-intl.dev/docs/routing/setup] Confidence MEDIUM on root-params status in Next 16.3.8 (not checked).
- The static-assets cache is **read-only** (no revalidation) — right for a holding page. It is filled by `populateCache`, which copies `.open-next/cache` into `.open-next/assets/cdn-cgi/_next_cache`. [VERIFIED: `@opennextjs/cloudflare@1.20.8` `dist/cli/commands/populate-cache.js`]
- `public/_headers`: `/_next/static/*` and `/fonts/*` → `Cache-Control: public,max-age=31536000,immutable`. The Worker does not run in front of static assets, so `next.config` headers do not apply to them. [CITED: opennext.js.org/cloudflare/caching]
- `/admin` and `/api/admin/ping` read request headers, so they are dynamic. Keep them tiny.

### Pattern 7: Account guard and Workers Builds commands
```js
// scripts/cf-guard.mjs — wrangler 4.147.0 `whoami --json` returns
// { loggedIn, authType, email, accounts: [{ id, name }], tokenPermissions } (read from wrangler source)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const EXPECTED = "1c850e50f5cbd5777f020315ccc72718";
const inCI = process.env.WORKERS_CI === "1";               // injected by Workers Builds
const cfg = readFileSync("wrangler.jsonc", "utf8");
const pinned = [...cfg.matchAll(/"account_id"\s*:\s*"([0-9a-f]{32})"/g)].map((m) => m[1]);
if (pinned.length === 0 || pinned.some((id) => id !== EXPECTED)) fail(`wrangler.jsonc account_id is not ${EXPECTED}`);
if (!inCI && process.env.HOME !== "/Users/koss/.mansouri-cloudflare") fail("HOME must be /Users/koss/.mansouri-cloudflare");
const out = execFileSync("./node_modules/.bin/wrangler", ["whoami", "--json"], { encoding: "utf8" });
const who = JSON.parse(out.slice(out.indexOf("{")));
const ids = (who.accounts ?? []).map((a) => a.id);
if (!who.loggedIn || !ids.includes(EXPECTED)) fail(`whoami does not see ${EXPECTED}: ${JSON.stringify(who.accounts)}`);
if (!inCI && ids.some((id) => id !== EXPECTED)) fail(`local login sees other accounts: ${ids.join(",")}`);
const acct = who.accounts.find((a) => a.id === EXPECTED);
console.log(`cf-guard OK: ${acct.name} (${acct.id}) via ${who.authType}${inCI ? " [Workers Builds]" : ""}`);
function fail(msg) { console.error(`cf-guard FAILED: ${msg}`); process.exit(1); }
```
```bash
# scripts/wr.sh — the only way the Mac runs wrangler for this repo
#!/usr/bin/env bash
set -euo pipefail
export HOME=/Users/koss/.mansouri-cloudflare
cd "$(dirname "$0")/.."
node scripts/cf-guard.mjs
exec ./node_modules/.bin/wrangler "$@"
```
Workers Builds settings (one-time, dashboard):

| Setting | Value |
|---|---|
| Git repository / production branch | `Loomlyne/mansouri-media` / `main` |
| Build command | `npm ci && npx opennextjs-cloudflare build` (or leave `npm ci` to the image's auto-install; executor checks the build log) |
| Deploy command | `node scripts/cf-guard.mjs && npx opennextjs-cloudflare deploy` |
| Preview command | `node scripts/cf-guard.mjs && npx opennextjs-cloudflare populateCache remote && npx wrangler preview` |
| Enable Preview Builds | on (D-10) |
| Build variable | `NODE_VERSION=24` (or `.node-version` file) |
| API token | auto-created by Workers Builds (user token; Account Settings read, Workers Scripts edit, R2 edit, …) |

- Workers Builds "use[s] the Wrangler version set in your `package.json`". [CITED: workers/ci-cd/builds/configuration]
- `wrangler deploy` in an OpenNext project delegates to `opennextjs-cloudflare deploy`; **`wrangler preview` does not** (only `maybeDelegateToOpenNextDeployCommand` exists, called from the deploy path). [VERIFIED: wrangler 4.147.0 `wrangler-dist/cli.js`] Hence the explicit `populateCache` in the Preview command. For the static-assets cache, `populateCache` only copies files (`fs.cpSync`) — no remote writes. [VERIFIED: OpenNext 1.20.8 source] Whether `populateCache remote` starts a platform proxy that needs credentials in CI is not checked: MEDIUM, proven by the first preview build.
- In CI the guard proves the token sees the account and the config pins it; wrangler deploys to the pinned `account_id`. The HOME check is skipped in CI because builds do not use Koss's Mac.

### Anti-Patterns to Avoid
- **Version URLs / `wrangler versions upload --preview-alias` for branches:** they run on production D1/R2. Use Previews.
- **Relying on `ctx.access`:** undefined behind Static Assets' router; also do not trust the `CF_Authorization` cookie or the mere presence of the header.
- **`workers_dev: false`** (old research advice): the whole site lives on workers.dev now (D-03).
- **Global `wrangler` (4.124.0) or `npx wrangler` with the changed HOME:** too old for Previews, and `npx` under a different HOME uses a different npm cache. Use `./node_modules/.bin/wrangler` through `scripts/wr.sh`.
- **Next route handler for `/media/*`:** loads the Next server per range request (more CPU); serve media in `worker.ts`.
- **Returning 206 and enabling Workers Cache together:** Workers Cache never stores a Worker's 206.
- **Putting production values in `previews`:** the one way D-10 breaks. A test should assert the two blocks differ for `database_id` and `bucket_name`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT signature check, key rotation | Manual RS256 + PEM parsing | `jose` `createRemoteJWKSet` + `jwtVerify` | `kid` matching, rotation (6-week, 7-day overlap), `alg` pinning, exp/nbf. |
| Byte-range slicing of films | Reading the body and slicing | R2 `get(key, { range: request.headers })` | R2 parses the header and returns only those bytes. |
| Conditional GET | Comparing ETags by hand | R2 `onlyIf: request.headers` + `httpEtag` | Handles If-None-Match / If-Modified-Since. |
| Branch-isolated test environments | Second Worker + scripts | Worker Previews (`previews` block, `wrangler preview`) | Built into Workers Builds; per-branch URL and PR comment. |
| Migration tracking | Own `schema_version` table | `wrangler d1 migrations apply` (`d1_migrations` table) | Read-back with `migrations list`. |
| Locale routing | Own dictionary loader | next-intl | Typed messages, RTL-aware formatting later. |
| Login page / OTP | Anything | Cloudflare Access one-time PIN | D-02, Zero Trust Free. |

**Key insight:** every platform piece this phase needs now exists as a Cloudflare primitive (Previews, Access destinations, R2 ranges); the code is glue plus two guards (account, JWT).

## Cloudflare Access on workers.dev — the D-05 answer

**Can Access protect a specific path on a `*.workers.dev` hostname?** Documented as yes, not yet demonstrated: MEDIUM.

Evidence:
1. Workers Access doc (updated 2026-08-18), table "Choose what to protect": "A specific hostname — can be `workers.dev`, a Custom Domain, or a path → Self-hosted application domain". Text: "Use hostname-based Access when only a specific URL that routes to your Worker should require sign-in, such as a `workers.dev` hostname, a Custom Domain, a subdomain, or a path… you can protect `my-worker.example.workers.dev`, `admin.example.com`, or a single path such as `example.com/login` to make only part of your Worker private." [CITED: developers.cloudflare.com/workers/configuration/cloudflare-access/]
2. Access API, public destination: "`uri`: The public hostname and optional path to secure… can include a domain and path with wildcards." Unlike override patterns, a destination `uri` "implicitly cover[s] subpaths". [CITED: Access applications API, create]
3. Precedence: "Hostname or path-based Access: Applies first… Worker-level Access: next… Account-level: last." [CITED: Workers Access doc]
4. Counter-evidence: the generic self-hosted guide says "Domains must belong to an active zone in your Cloudflare account" (or "Switch to custom input" for SaaS hostnames). The workers.dev subdomain is not a zone in the account. The two docs disagree on the UI path; the Workers doc is newer and specific. [CITED: self-hosted-public-app]
5. No official example combines a workers.dev host **and** a path, and no community report of it was found (search 2026-10-03).

**What the "Enable Cloudflare Access" toggle does:** introduced 2025-10-03 under Settings → Domains & Routes for the `workers.dev` route and Preview URLs; it created an Access app for the whole hostname and showed the AUD and team domain in a modal ("`POLICY_AUD`… `TEAM_DOMAIN`: `https://<your-team-name>.cloudflareaccess.com`. Both of these appear in the modal"). Since 2026-08-14 the Worker's **Access** tab offers "Protect this Worker behind Access" with **Previews only** or **All traffic**, which creates a `worker` / `preview_worker` destination covering every domain of the Worker. Neither is path-scoped. Policies created this way are reusable ("<worker-name> - Production", shared "Cloudflare Workers Preview URLs"). [CITED: changelog 2025-10-03, 2025-12-04, 2026-08-14]

**AUD and team domain:** AUD = Zero Trust → Access controls → Applications → Configure → Additional settings → "Application Audience (AUD) Tag"; it "will never change unless you delete or recreate the Access application". Team domain = `https://<team-name>.cloudflareaccess.com`; JWT `iss` equals it; JWKS at `<team domain>/cdn-cgi/access/certs`. [CITED: validating-json]

**Recommended layout (one self-hosted app, one AUD):**
| Destination (public uri) | Covers |
|---|---|
| `mansourimedia.<sub>.workers.dev/admin` | `/admin`, `/admin/…` |
| `mansourimedia.<sub>.workers.dev/api/admin` | `/api/admin`, `/api/admin/…` |
| `*-mansourimedia.<sub>.workers.dev/admin` | Preview URL `<preview>-mansourimedia…` and Deployment URL `<id>-mansourimedia…` |
| `*-mansourimedia.<sub>.workers.dev/api/admin` | same for the API |
Policy: Allow, Include emails `houssemansouri96@gmail.com`, `koussayzayeni@gmail.com`; login method One-time PIN. Partial subdomain wildcards are allowed ("`*test.example.com` covers `test.example.com`, `alphatest.example.com`"; at most one `*` per label). [CITED: app-paths] Preview hostnames are `<preview-name>-<worker-name>.<subdomain>.workers.dev` and `<deployment-id>-<worker-name>.<subdomain>.workers.dev`. [CITED: workers/previews]
Previews stay public apart from these paths (D-10); even if the wildcard destination were refused, the Worker's JWT gate still returns 403 on preview admin paths, so admin is unusable there as D-10 requires.

**If Zero Trust refuses a workers.dev path destination (stop and ask Koss — do not choose):**
- A. Worker-level Access, **All traffic**, with `overrides: [{ behavior: "public", path_pattern: … }]` for every public path (`/`, `/en*`, `/ar*`, `/fr*`, `/_next/*`, `/fonts/*`, `/media/*`, favicons…). Overrides "do not implicitly cover subpaths". Risk: a missed public path shows visitors a login page; every new public route needs an override.
- B. A second Worker for admin (e.g. `mansourimedia-admin`) on its own workers.dev hostname, whole-hostname Access, same D1/R2 bindings; the public Worker has no admin routes.
- C. Buy the domain earlier; path apps on a real zone are the standard, documented case.
- D. A different login scheme — excluded by D-05 unless Koss decides it.

## Common Pitfalls

### Pitfall 1: Previews quietly using production data
**What goes wrong:** Preview builds bound to the production D1/R2.
**Why it happens:** Using `wrangler versions upload` / aliased Version URLs (production resources), copying production IDs into `previews`, or an old Worker created before Worker Previews that keeps "the previous preview model, which uses production settings" until a one-way switch.
**How to avoid:** New Worker (no legacy model). Preview command must invoke `wrangler preview`. Unit test: `previews.d1_databases[0].database_id !== d1_databases[0].database_id`, same for buckets. Live check: write a row on a preview, confirm it is absent in production (read-only).
**Warning signs:** Build log says "versions upload"; PR comment shows a Version URL instead of a Preview URL.

### Pitfall 2: Prerendered pages rendered per request on previews
**What goes wrong:** Preview Worker SSRs `/en` on every request (CPU, possible 1102 on Free).
**Why it happens:** `wrangler preview` does not delegate to OpenNext, so `populateCache` never copies the cache into assets.
**How to avoid:** Preview command runs `opennextjs-cloudflare populateCache …` before `wrangler preview`; compare CPU per request preview vs production.

### Pitfall 3: Wrong account from the Mac
**What goes wrong:** `d1 create` / `r2 bucket create` in the Vamos account.
**How to avoid:** Only `scripts/wr.sh`; guard asserts HOME, pinned ID and a single visible account (verified today: the Mansouri HOME login sees only "Houssam Portfolio" `1c850e50…`).

### Pitfall 4: Free plan request budget eaten by media
**What goes wrong:** Error 1027 after 100,000 Worker requests/day.
**Why it happens:** Every page view = 1 Worker request; every film play/seek = several range requests through the Worker. Static assets are free only while Workers Cache is off.
**How to avoid:** Phase 1 records request counts with the CPU numbers. Real films arrive in Phase 2; the media-domain move (deferred) or Workers Cache/Paid are Koss's levers.

### Pitfall 5: Access app covers `/admin/*` but not `/admin`
**What goes wrong:** Path wildcard `/admin/*` "does not cover the parent path". [CITED: app-paths]
**How to avoid:** Use destination `…/admin` (implicitly covers subpaths) and test both `/admin` and `/admin/x`; the Worker gate over-matches (`/admin`, `/admin/…`, case-insensitive, decoded) anyway.

### Pitfall 6: `/admin` request answered from a cache or with a stale JWT decision
**How to avoid:** All admin responses `Cache-Control: no-store`; no Workers Cache in Phase 1.

### Pitfall 7: Safari will not seek
**What goes wrong:** Video plays but cannot seek, or Safari refuses to play.
**Why it happens:** 200 instead of 206 for `Range: bytes=0-1`, missing `Accept-Ranges`/`Content-Range`, or MP4 without faststart.
**How to avoid:** Pattern 4 headers; `ffmpeg … -movflags +faststart`; curl checks below twice (first and repeat request).

### Pitfall 8: Public repo leaks
**What goes wrong:** `_source/`, `.dev.vars`, `CLAUDE.local.md` committed to the public repo.
**How to avoid:** `.gitignore` already covers them (checked); add a pre-push check (`git ls-files | grep -E '^_source/|\.dev\.vars|^\.env|CLAUDE\.local'` must be empty). `_reference/liquid-glass-carousel` is already tracked (21 files, MIT) — keep its LICENSE.

### Pitfall 9: GitHub account already linked to another Cloudflare account
**What goes wrong:** Cloudflare says "A GitHub account should only point to one Cloudflare account." If Loomlyne's "Cloudflare Workers and Pages" GitHub App is already installed for the Vamos account, connecting it to "Houssam Portfolio" can conflict. [CITED: workers/ci-cd/builds/git-integration/github-integration] Not checkable from here (`gh api user/installations` needs an App token).
**How to avoid:** Koss checks github.com/settings/installations before connecting (human step 4).

### Pitfall 10: `wrangler preview` is open beta
`wrangler preview --help` (4.147.0) labels it "[open beta]". Expect rough edges; if it fails, the fallback is no preview builds (production only) until fixed — not Version URLs.

## Code Examples
See Patterns 1–7 above (all derived from the cited official pages and package sources). Additional verification snippets:

```bash
# 206 proof (run twice: cold, then repeat)
U=https://mansourimedia.<sub>.workers.dev/media/_probe/test-9x16.mp4
curl -s -o /dev/null -D - -H 'Range: bytes=0-1' "$U" | grep -iE '^HTTP|content-range|accept-ranges|content-length|etag|cache-control'
#   expect: HTTP/2 206, content-range: bytes 0-1/<size>, accept-ranges: bytes, content-length: 2
curl -s -o /dev/null -D - -H 'Range: bytes=1000000-' "$U" | head -1                   # expect 206
curl -s -o /dev/null -D - -H 'Range: bytes=999999999-' "$U" | head -1                 # expect 416
curl -s -o /dev/null -D - -H "If-None-Match: $(curl -sI "$U" | awk -F': ' 'tolower($1)=="etag"{print $2}' | tr -d '\r')" "$U" | head -1  # expect 304

# Access proof
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://mansourimedia.<sub>.workers.dev/admin        # 302 → <team>.cloudflareaccess.com
curl -s -o /dev/null -w '%{http_code}\n' https://mansourimedia.<sub>.workers.dev/api/admin/ping              # 302/401/403, never 200
curl -s -o /dev/null -w '%{http_code}\n' -H 'cf-access-jwt-assertion: forged' https://mansourimedia.<sub>.workers.dev/api/admin/ping  # never 200
curl -s -o /dev/null -w '%{http_code}\n' https://<branch>-mansourimedia.<sub>.workers.dev/api/admin/ping     # never 200
curl -s -o /dev/null -w '%{http_code}\n' https://mansourimedia.<sub>.workers.dev/en                           # 200, public
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Branch previews = aliased Version URLs on production bindings | **Worker Previews**: `wrangler preview`, `previews` config block, isolated bindings | Docs updated 2026-09-22/24; Workers Builds default for new Workers | D-10 is achievable in one Worker. |
| One-click "Enable Cloudflare Access" per workers.dev / preview URL | Worker **Access** tab: Previews only / All traffic; account-wide "Protect all Workers"; hostname/path apps | 2026-08-14 | Path scoping still needs a self-hosted app. |
| `ctx.access` unavailable | `ctx.access.getIdentity()` for direct invocations | 2026-08 | Not usable with Static Assets (OpenNext). |
| Zone cache only in front of Workers on custom domains | **Workers Cache** (`cache.enabled`), works on workers.dev, edge range slicing | 2026 (docs 2026-07/09) | Option for media later; counts all requests incl. assets. |
| drizzle 1.0 nested migrations unreadable by wrangler | D1 `migrations_pattern` glob | 2026 | Not needed on drizzle-kit 0.31. |

**Deprecated/outdated in project research:** `workers_dev: false` / `preview_urls: false` (STACK.md decision 4, PITFALLS.md P10) — superseded by D-03/D-10. ARCHITECTURE.md's "Anti-pattern: `/media/*` Worker route" — superseded by D-04 for as long as there is no domain. STACK.md's vitest 5.0.3 — the Workers pool needs vitest 4.1.x.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Zero Trust accepts a self-hosted app destination of `mansourimedia.<sub>.workers.dev/admin` (host + path on workers.dev) and the partial wildcard `*-mansourimedia.<sub>.workers.dev/admin` | Access section | D-05 layout fails → stop, Koss picks alternative A–D. Spike first. |
| A2 | `opennextjs-cloudflare populateCache remote` runs cleanly in Workers Builds before `wrangler preview` | Pattern 7 | Preview builds fail or SSR per request; fix the Preview command. |
| A3 | Streaming an R2 body through `new Response(obj.body)` adds negligible CPU | Pattern 4 | Media near the 10 ms limit; measure. |
| A4 | Same-origin poster loads with `crossOrigin="anonymous"` never taint the WebGL texture | Pattern 4 | Visible in the `/admin/lab` proof; ACAO header already set. |
| A5 | Setting `Content-Length` explicitly on R2 responses is honoured by the runtime | Pattern 4 | Check `curl -D -`; drop the header if the runtime rejects it. |
| A6 | Zero Trust Free sign-up may ask for a payment method | Human steps | Koss/Houssem may need a card on the account; Koss's step, never in chat. |
| A7 | Workers Logs invocation logs expose per-request CPU (limits page says "CPU time and wall time appear in the invocation log"); the exact query field name was not read | Validation | Use the dashboard Metrics/Logs view instead. |
| A8 | Unchecked dev packages (tailwind, vitest, playwright, fonts) are legitimate | Package audit | Low; same as sister project. |

## Open Questions

1. **workers.dev subdomain string.** The public URL becomes `mansourimedia.<subdomain>.workers.dev`. Not readable from here without an API call; set or read in the dashboard (Workers & Pages → "Your subdomain" → Change) or `GET /accounts/{account_id}/workers/subdomain`. Recommendation: Koss picks it (it is public, and changing it later breaks links); human step 1.
2. **"cached" in success criterion 2.** On workers.dev with no Workers Cache, there is no edge cache in front of the Worker: "cold and cached" can only mean "first request and repeat request both return 206" (plus browser cache). Recommendation: record it that way in UAT; Workers Cache stays a later lever.
3. **Probe objects in the production bucket.** `/media/_probe/*` (generated test pattern, no client content) is reachable by URL though not linked. D-06 says nothing else public. Recommendation: keep them unlinked and delete or keep at Koss's word after UAT.
4. **First push of `main`.** Workers Builds deploys on push to `main`, and pushing `main` = shipping (D-09). The scaffold must reach `main` before the Worker can be imported from Git, so the first ship gate comes early in this phase; the plan should place Koss's Ship answer before that push.
5. **Admin email.** D-02 lists `koussayzayeni@gmail.com` "exactly as Koss typed it"; his usual address elsewhere is `koussay.zayani0@gmail.com`. The policy will lock out a mistyped address; Koss confirms when creating the policy.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, scripts | ✓ | 26.7.0 (CI uses 24.18.0) | — |
| npm | install | ✓ | 11.19.0 (CI 10.9.2) | — |
| wrangler (project) | Previews, D1, R2 | ✗ until install | 4.147.0 via devDependency | Global 4.124.0 exists but is below 4.135.0 — do not use |
| Mansouri wrangler login | all account commands | ✓ | OAuth, sees only "Houssam Portfolio" `1c850e50…` (checked 2026-10-03 with `whoami --json`) | — |
| gh CLI | repo | ✓ | logged in as Loomlyne; `Loomlyne/mansouri-media` exists, PUBLIC, set as `origin` | — |
| ffmpeg | test film + poster | ✓ | 9.0.2 | — |
| curl, jq, git | verification | ✓ | system | — |
| Zero Trust org + team domain | Access | unknown | — | none: human step |
| Workers Builds ↔ GitHub | deploys | not connected | — | none: human step |

**Missing dependencies with no fallback:** Zero Trust team, Access application, Workers Builds connection, workers.dev subdomain choice — all human steps below.

## Human Steps (Koss; one numbered action each, wait after each)

1. In the Cloudflare dashboard of "Houssam Portfolio": Workers & Pages → read (or set) "Your subdomain"; tell Claude the subdomain.
2. Zero Trust (same account): complete onboarding, choose the team name (gives `https://<team>.cloudflareaccess.com`), Free plan; tell Claude the team name.
3. Zero Trust → Settings → Authentication: confirm "One-time PIN" is enabled.
4. github.com/settings/installations (as Loomlyne): check whether "Cloudflare Workers and Pages" is already installed for another Cloudflare account; tell Claude what you see.
5. (After the scaffold is on `main`, with your Ship answer) Workers & Pages → Create → Import a repository → `Loomlyne/mansouri-media`, Worker name `mansourimedia`, build/deploy/preview commands from Pattern 7, Enable Preview Builds, `NODE_VERSION=24`; save and let the first build run.
6. Zero Trust → Access controls → Applications → Create → Self-hosted → add the four destinations from the Access section (production `/admin`, `/api/admin`; preview wildcard `/admin`, `/api/admin`), policy Allow emails `houssemansouri96@gmail.com` + `koussayzayeni@gmail.com`, login One-time PIN; copy the AUD tag and tell Claude. If the Domain field refuses the workers.dev host, stop and tell Claude (D-05 → alternatives).
7. Ship answers at each gate (first push of `main`, production migration, final deploy).

Resource creation (`d1 create`, `r2 bucket create`, migrations, `r2 object put`) is done by the control session through `scripts/wr.sh`, not by Koss.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.11 (unit), Playwright 1.63.0 (smoke/e2e), bash + curl (live checks) |
| Config file | none yet — Wave 0 |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run && npx playwright test && bash scripts/verify-live.sh <base-url>` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAT-01 | Guard refuses wrong `account_id`, wrong HOME, foreign accounts in whoami | unit | `npx vitest run tests/cf-guard.test.ts` (whoami stubbed) | ❌ Wave 0 |
| PLAT-01 | Build log prints `cf-guard OK: Houssam Portfolio (1c850e50…)` before deploy | manual (Workers Builds log) + curl | `curl -sI https://mansourimedia.<sub>.workers.dev/en` → 200 | ❌ |
| PLAT-01 | EN/AR/FR holding page: `lang`, `dir="rtl"` for ar, WhatsApp `wa.me/971505085753`, `mailto:houssemansouri96@gmail.com` | e2e | `npx playwright test e2e/holding.spec.ts` | ❌ Wave 0 |
| PLAT-02 | Range parsing → 206/416/304/200 headers | unit (R2 stub) | `npx vitest run tests/media.test.ts` | ❌ Wave 0 |
| PLAT-02 | Live 206 cold + repeat, 416, 304 | live smoke | `bash scripts/verify-live.sh <url>` (curl lines above) | ❌ Wave 0 |
| PLAT-02 | Poster texture uploads in WebGL, video seeks | e2e behind Access (manual login) | Playwright on local `opennextjs-cloudflare preview` + manual on live `/admin/lab` | ❌ |
| PLAT-03 | Same tables in local / preview / prod | live read-back | `scripts/wr.sh d1 migrations list <db> --local|--remote` and `d1 execute … sqlite_master` per DB | ❌ |
| PLAT-03 | Preview config never equals prod bindings | unit | `npx vitest run tests/wrangler-config.test.ts` | ❌ Wave 0 |
| PLAT-04 | CPU per request recorded (holding page, `/`, `/media` range, `/api/admin/ping`) | manual measurement | 50 requests per route, read CPU in Workers Logs/Metrics; record p50/p99 in the phase summary | ❌ |
| PLAT-05 | Gate refuses: no token, forged token, wrong aud, wrong iss, expired, `alg:none`, missing vars; accepts valid token | unit (jose local keys) | `npx vitest run tests/access.test.ts` | ❌ Wave 0 |
| PLAT-05 | Live: `/admin` → Access redirect; `/api/admin/ping` never 200 without login, on prod and a preview | live smoke | `bash scripts/verify-live.sh` (Access block) | ❌ |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** vitest + Playwright against `opennextjs-cloudflare preview` (local workerd)
- **Phase gate:** full suite + `verify-live.sh` on production and one branch Preview, then `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts`, `tests/access.test.ts`, `tests/media.test.ts`, `tests/cf-guard.test.ts`, `tests/wrangler-config.test.ts`
- [ ] `playwright.config.ts` (desktop + Pixel 7 + iPhone 15 projects), `e2e/holding.spec.ts`
- [ ] `scripts/verify-live.sh` (curl checks, exits non-zero on any mismatch)
- [ ] Test media: `scripts/make-probe-media.sh` (ffmpeg test pattern + WebP poster, faststart)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Cloudflare Access one-time PIN (no passwords stored) |
| V3 Session Management | yes | Access session (`CF_Authorization`), app token lifetime set in the Access app |
| V4 Access Control | yes | Access path app + Worker `jose` verify (iss, aud, RS256, exp) on every admin request, fail closed |
| V5 Input Validation | yes | Media key allow-list regex, no `..`; method allow-list (GET/HEAD); range errors → 416 |
| V6 Cryptography | yes | `jose` (WebCrypto) — never hand-rolled |
| V14 Configuration | yes | Pinned `account_id`, guard script, no secrets in repo, `no-store` on admin |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Admin reached through an un-Accessed hostname (preview, deployment URL) | Elevation of privilege | Worker JWT gate on every admin path, independent of Access config |
| Forged `Cf-Access-Jwt-Assertion` header | Spoofing | Signature verify against team JWKS; issuer + audience checks |
| Path tricks (`/Admin`, `//admin`, `%2Fadmin`) skipping the gate | Elevation of privilege | Decode + lowercase + collapse slashes, over-match |
| Preview writing to production data | Tampering | `previews` block with separate DB/bucket; config test |
| Deploy into the wrong Cloudflare account | Tampering / info disclosure | HOME login, pinned `account_id`, guard |
| Path traversal / listing via `/media/` | Information disclosure | Key regex, no list endpoint |
| Secrets or client files in a public repo | Information disclosure | `.gitignore`, pre-push check |

## Sources

### Primary (HIGH confidence)
- developers.cloudflare.com/workers/configuration/cloudflare-access/ (updated 2026-08-18) — protection levels, hostname/path apps incl. workers.dev, ctx.access limits with Static Assets
- developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/ — wildcards, subpath rules
- developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/applications/methods/create/ — destination types, `uri`, `overrides`
- developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/ — AUD, team domain, JWKS, jose sample
- developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/ — "active zone" wording (counter-evidence)
- Changelog posts 2025-10-03, 2025-12-04, 2026-08-14 (Access for Workers)
- developers.cloudflare.com/workers/previews/ (+ /configuration, /resources, /compare-workflows, /custom-domains, /examples) — 2026-09
- developers.cloudflare.com/workers/ci-cd/builds/configuration/, /build-branches/, /build-image/, /limits-and-pricing/, /git-integration/github-integration/
- developers.cloudflare.com/r2/api/workers/workers-api-reference/ — range/onlyIf with Headers, httpEtag, writeHttpMetadata
- developers.cloudflare.com/workers/platform/limits/ — 10 ms CPU, 100,000 req/day, CPU excludes network waits
- developers.cloudflare.com/workers/cache/ (+ /configuration, /limitations, /cache-keys) — Workers Cache, range slicing, billing
- developers.cloudflare.com/d1/reference/migrations/ — migrations_dir, database name vs binding, migrations_pattern
- developers.cloudflare.com/api/resources/workers/subresources/subdomains/ — GET/PUT workers subdomain
- opennext.js.org/cloudflare/get-started, /cli, /caching, /howtos/dev-deploy, /howtos/env-vars, /howtos/custom-worker
- Package source read from npm tarballs: `@opennextjs/cloudflare@1.20.8` (populate-cache, deploy, queue), `wrangler@4.147.0` (whoami --json, OpenNext delegation only on deploy, `preview` command)
- npm registry (versions, peerDependencies, postinstall) 2026-10-03; slopcheck (npm) 7/7 OK
- next-intl.dev/docs/routing/setup — static rendering, setRequestLocale (legacy), root-params

### Secondary (MEDIUM confidence)
- WebSearch summaries on workers.dev path apps (no official example found)
- github.com/SailorDave17/madcowsailing.com/issues/151 — third-party design that also verifies Access JWT in code on every hostname

### Tertiary (LOW confidence)
- Zero Trust Free sign-up payment-method prompt (training knowledge; not checked)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — registry and peer ranges read today; one correction (vitest 4.1.x).
- Architecture: MEDIUM-HIGH — Previews/bindings, OpenNext caching and R2 APIs from official docs and source; the Preview command chain needs one live run.
- Access on workers.dev path: MEDIUM — documented but undemonstrated; spike gates it.
- Pitfalls: HIGH for the platform ones (docs/source), MEDIUM for request-budget estimates.

**Research date:** 2026-10-03
**Valid until:** 2026-10-17 (Workers Previews and `wrangler preview` are open beta and moving weekly)
