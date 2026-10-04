# Phase 1: Platform Foundation - Context

**Gathered:** 2026-10-03
**Status:** Ready for planning

<domain>
## Phase Boundary

A skeleton site is live on a **workers.dev address** (no custom domain yet) from Houssem's Cloudflare account "Houssam Portfolio", deployed by Cloudflare Workers Builds from a public GitHub repo. D1 (local / preview / production), R2 media served with seeking, and Cloudflare Access on /admin are wired, and the Worker fits the Workers Free plan. The public page is a real holding page in EN / AR / FR.

Covers PLAT-01..05, **amended** by this discussion (see D-01..D-04): the domain mansourimedia.com and `media.mansourimedia.com` are deferred until Koss can buy the domain.

</domain>

<decisions>
## Implementation Decisions

### Account and access
- **D-01:** Cloudflare account is **"Houssam Portfolio", ID `1c850e50f5cbd5777f020315ccc72718`**. Wrangler is logged in with `HOME=/Users/koss/.mansouri-cloudflare` (OAuth, 2026-10-03; only this account visible). Pin `account_id` in `wrangler.jsonc`; every wrangler command uses that HOME; every deploy step prints `wrangler whoami` and fails if the account ID differs. Never the default (Vamos `e64b47de…`) login.
- **D-02:** Access allow-list for /admin: `houssemansouri96@gmail.com` and `koussayzayeni@gmail.com` (address exactly as Koss typed it, 2026-10-03), email one-time code.

### Domain and URLs (amends PLAT-01, PLAT-02, PLAT-05)
- **D-03:** **No domain for now.** Koss cannot buy mansourimedia.com at present. The site lives at the Worker's workers.dev address. Worker name: **`mansourimedia`** → `mansourimedia.<account-subdomain>.workers.dev`. mansourimedia.com and `media.` become a later step when the domain is bought.
- **D-04:** Media (films, posters) is **served by the Worker from the R2 binding**, with HTTP Range → 206 and long cache headers. Do not use the `r2.dev` public URL (rate-limited, not for production). Posters must load into WebGL with correct CORS.
- **D-05:** Access protects **only `/admin*` and `/api/admin*`** on the workers.dev hostname; the Worker also validates the Access JWT (signature, audience, team domain) on every admin request. **Research must confirm Access can protect a path on a workers.dev hostname.** If it cannot, stop and bring the alternative to Koss — do not pick a different auth scheme without him.

### Before launch
- **D-06:** The public workers.dev address shows a **real holding page**: Mansouri Media logo, slogan "WE MAKE YOUR VIDEOS REMEMBERED.", a working WhatsApp button (`wa.me/971505085753`) and a working email button (`houssemansouri96@gmail.com`). Nothing else public. No placeholder text, no "coming soon".
- **D-07:** Holding page in **EN, AR (RTL) and FR**. Claude drafts AR/FR; Houssem checks.

### Code and deploys
- **D-08:** Repo is **public on GitHub: `Loomlyne/mansouri-media`** (create with the `gh` CLI, logged in as Loomlyne). Never commit `_source/` (Houssem's Drive: celebrity photos, CV with home address), `CLAUDE.local.md`, `.dev.vars`, `.env*` or any secret. Account ID in `wrangler.jsonc` is acceptable (not a secret).
- **D-09 (amended 2026-10-04 by Koss):** deploys are run by the **control session** (`opennextjs-cloudflare build`, then `cf-guard` + `opennextjs-cloudflare deploy` with `HOME=/Users/koss/.mansouri-cloudflare`) after Koss's Ship; Workers Builds / GitHub auto-build is **not connected** (Koss could not check the GitHub app; he chose direct deploys). Original text: **Deploys by Cloudflare Workers Builds on push to `main`** (GitHub connected to the "Houssam Portfolio" account). Pushing `main` = shipping: only the control session pushes `main`, and only after Koss's Ship answer. Planning-only pushes are labelled as planning notes.
- **D-10:** **Branch previews are public** (Workers Builds preview URLs, no Access). Consequences the plan must honour: previews bind to the preview D1/R2, never production; `/admin` and admin APIs on a preview refuse every request without a valid Access JWT (so admin is unusable there, which is safe).

### Platform limits
- **D-11:** Workers **Free plan**: public pages pre-rendered, handlers tiny; measure CPU per request on the first deploy and record it. Paid is the escape hatch if error 1102 appears (Koss decides).

### Claude's Discretion
- Exact Next.js/OpenNext scaffold, D1 schema for this phase (minimal: enough to prove migrations in three environments), test film/poster used for the 206 + WebGL CORS proof, Access application layout, cache headers.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project
- `.planning/PROJECT.md` — scope, constraints, key decisions
- `.planning/REQUIREMENTS.md` — PLAT-01..05 (as amended here)
- `.planning/ROADMAP.md` §Phase 1 — goal and success criteria (amended here: workers.dev instead of mansourimedia.com)
- `BRIEF.md` — all client decisions, brand colours, design inventory
- `CLAUDE.local.md` (gitignored) — account ID, wrangler HOME, operating rules

### Research
- `.planning/research/SUMMARY.md` — stack and decisions table (overrides other research)
- `.planning/research/STACK.md` — Next 16.3.8 + OpenNext 1.20.8, Drizzle 0.45.3, wrangler, Access JWT with `jose`
- `.planning/research/ARCHITECTURE.md` — one Worker, D1, R2, environments
- `.planning/research/PITFALLS.md` — wrong-account deploys, Access bypass on workers.dev/previews, R2 range/CORS, Free CPU limit

### Reference code
- `_reference/liquid-glass-carousel/` — upstream carousel (MIT, Yousuf Soomro), Next 16 layout to start from
- `_source/logo/logo png.png` (gitignored) — logo for the holding page

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `_reference/liquid-glass-carousel/app/*`, `next.config.mjs`, `postcss.config.mjs`: Next 16 App Router + Tailwind 4 baseline (bump Next to 16.3.8 for OpenNext).
- Logo PNG (4608×3712, white on plum) in `_source/logo/` — needs a web-sized/SVG export for the holding page.

### Established Patterns
- None yet in this repo (greenfield). Sister project `/Users/koss/Developer/Koussay-Portfolio` planned a Vercel → Workers move (its phase 3.1); read for OpenNext lessons only.

### Integration Points
- GitHub `Loomlyne/mansouri-media` ↔ Cloudflare Workers Builds (Koss connects the GitHub app in the dashboard — one numbered human step).

</code_context>

<specifics>
## Specific Ideas

- Holding page: logo, slogan, WhatsApp + email buttons, three languages, white canvas with plum text and gold accent (brand from BRIEF.md).

</specifics>

<deferred>
## Deferred Ideas

- Buy mansourimedia.com, move site + media to `mansourimedia.com` / `media.mansourimedia.com` — when Koss can buy the domain.
- Resend sending domain: Resend needs a domain to send from; decide in Phase 5 (booking) — no domain exists yet.
- Workers Paid plan — only if Free CPU limits are hit.

</deferred>

---

*Phase: 01-platform-foundation*
*Context gathered: 2026-10-03*
