# Mansouri Media

## What This Is

The website of Mansouri Media, the Dubai content agency of filmmaker Houssem Mansouri, at mansourimedia.com. The home page is a full-screen liquid-glass WebGL carousel (from Yousuf Soomro's MIT `liquid-glass-carousel`) of his video, editing and photography work — mostly vertical 9:16 Instagram films — filtered by industry; clicking a panel plays the film. The site shows the brands and influencers he has worked with and his six services, and every page leads to a booking flow (free call, shoot request, or paid deposit) or WhatsApp. It is for brands, clinics, real-estate firms and creators in Dubai and the GCC deciding whether to hire Mansouri Media. Built and run by Koss for Houssem, in English, Arabic and French.

## Core Value

A brand in the GCC can watch Houssem's vertical films in the glass carousel and book him — call, shoot request or deposit — in a few taps, on a phone or a desktop.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Liquid-glass carousel home with his work, recoloured to his brand (white canvas, plum text, gold ring), vertical 9:16 panels shown at natural aspect
- [ ] Focus view plays the clicked film (vertical full-height), poster stills in the ring
- [ ] Full mobile experience: touch carousel with the same look, lighter shader, full booking
- [ ] Industry filters: All / Fashion / Beauty & clinics / Real estate / Products / Ads / Content
- [ ] Client brand logos section (layout explored in sketches)
- [ ] Influencer/creator section using the Drive photos (layout explored in sketches)
- [ ] Six services: ads management, social media, scriptwriting/filming/editing, web & app development, PR, influencers
- [ ] Industries list, slogan "WE MAKE YOUR VIDEOS REMEMBERED.", CTAs "Start your project" and "WhatsApp us"
- [ ] Booking: free discovery call, shoot date request (service + date + location), paid deposit
- [ ] Bookings stored in Cloudflare D1; confirmation emails to visitor and Houssem via Resend
- [ ] Paid deposit through Stripe Connect (Koss's platform, Houssem connected Express account, Koss's commission as application fee)
- [ ] Private /admin behind Cloudflare Access (email code): upload video/photo to R2 with title/client/industry, see bookings, block time
- [ ] English, Arabic (RTL) and French; Claude drafts AR/FR, Houssem checks
- [ ] Results numbers section shown only when Houssem provides proof
- [ ] Hosted on Cloudflare Workers + R2 + D1 in Houssem's own Cloudflare account, domain mansourimedia.com

### Out of Scope

- Notion as booking store — D1 chosen; keeps everything on Cloudflare and needs no Notion account for Houssem
- Cloudflare Stream — R2 MP4 + poster chosen (no per-minute cost); revisit if playback on poor mobile data is a problem
- Lay Grotesk (reference font) — commercial licence; free look-alike instead
- Reference demo images (Behance) — not licensed for reuse
- Showing results numbers without proof — honesty rule
- Desktop-only gate of the reference (<1025px black screen) — most visitors come from Instagram on phones

## Context

- Reference code: `_reference/liquid-glass-carousel/` at upstream `6d770c9`: Next.js 16, React 19, three.js 0.184, GSAP 3.15, lil-gui, Tailwind 4. Engine (`lib/carousel/engine.js`, 1,255 lines) is framework-free; every tunable is in `config.js`. Two-pass render: row into a framebuffer, then a fullscreen lens shader (refraction, chromatic dispersion, nova, shimmer ring, rim wave). Focus mode, entry animation, snap, drag with flick, speed shrink.
- Full design inventory and brand colours (gold `#C48C3C`, plum `#251B26`→`#0E070F`) in `BRIEF.md`.
- Source material in `_source/` (gitignored), from his Drive: 33 brand logos (Lexus, L'Oréal, Dyson, Garnier, Universal, Temu, MG, Benefit, DB Fragrances, DMT, MBRGI, Ooredoo, Kappa, Sharaf DG…), 21 influencer photos (Mbappé, Pogba, Hakimi, Kamaru Usman, Katia Aveiro, Anthony Anderson, Kevin Levrone…), logo, his "steps" doc, CV.
- His films are on Vimeo (user 110194767) in showcases/folders: Content, Clinics & beauty, Fashion, Products, Ads. Titles include Ooredoo ad, Minions premiere, Huawei Watch 5, Joliesse summer 2024, Outika fashion film.
- Sister project: Koussay-Portfolio (`/Users/koss/Developer/Koussay-Portfolio`) uses a similar WebGL carousel and an eleven-step `/booking` flow (Notion + Resend); this site's booking is modelled on that flow but stores in D1.
- Houssem: Senior Videographer/Editor at DMT Abu Dhabi (via Kizmet, 2025–), ex Visioneers, Alfan Group, NDI; BA 2D/3D animation, ESAD Tunis.

## Constraints

- **Hosting**: Cloudflare Workers + R2 + D1 in Houssem's own Cloudflare account, own wrangler login (separate HOME, like ALMAR) — never the default Vamos login
- **Timeline**: first version live within 2 weeks (by ~2026-10-17)
- **Licence**: keep Yousuf Soomro's MIT notice; no Behance images; no Lay Grotesk
- **Content**: most work is vertical 9:16; every surface must show vertical video well
- **Honesty**: no invented numbers, testimonials, prices or legal copy; results only with proof; deposit amounts and commission % come from Koss
- **Languages**: EN / AR (RTL) / FR from the first version
- **Payments**: Stripe Connect; Houssem must agree to the platform fee before deposits go live
- **Admin**: Cloudflare Access email one-time code; no password store
- **Process**: GSD; Koss signs discuss, plan, UAT and ship

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Site is the agency Mansouri Media, Houssem as founder | Matches his logo, "we" slogan and service list | — Pending |
| Keep white canvas, recolour to his plum + gold, gold glass ring | Koss chose the original look, tuned to his brand | — Pending |
| Poster stills in the ring, film plays in focus view | Light and fast; vertical films shown full-height | — Pending |
| Full mobile version | Visitors come from Instagram on phones | — Pending |
| D1 + Resend for bookings | All on Cloudflare; no Notion account needed | — Pending |
| Stripe Connect with Koss as platform | Houssem gets paid directly; Koss's commission as application fee | — Pending |
| R2 MP4 + poster, no Stream | No egress or per-minute cost | — Pending |
| Cloudflare Access for /admin | No password to leak; free | — Pending |
| Use the Drive influencer photos as given | Koss's call (photographer copyright noted) | — Pending |
| Results numbers only with proof | Honesty rule | — Pending |
| All six services incl. web & app dev (delivered by Koss) | As written in his doc | — Pending |
| Industry filters matching his Vimeo folders | His work is already organised that way | — Pending |

## Open (do not invent)

1. Deposit amounts, which services take a deposit, commission % — pricing discussion with Koss.
2. Houssem's agreement to the platform fee.
3. Proof for results numbers.
4. Logo and influencer section layout — sketch directions.
5. Which Vimeo films go in v1, and the source files.
6. Clean (SVG) versions of client logos.
7. Bio, "why Mansouri Media", testimonials, client stories.
8. Houssem's Cloudflare and Stripe accounts (his steps).

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-03 after initialization*
