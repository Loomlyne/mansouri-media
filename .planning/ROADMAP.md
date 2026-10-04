# Roadmap: Mansouri Media

## Overview

Mansouri Media goes from an empty folder to a live agency site at mansourimedia.com in Houssem's own Cloudflare account. First the platform is pinned to the right account and proven on the Workers Free plan. Then two tracks run side by side: the liquid-glass carousel with film playback, and the content model with Houssem's /admin. The site sections and three languages sit on top of both, then booking (free call and shoot request, with emails) turns visitors into enquiries. A launch phase proves it on real phones and checks licences and content. Deposits on Houssem's own Stripe come last, behind a switch, and do not block launch.

Target: Phases 1-6 live by about 2026-10-17 (v1 cut line). Phase 7 follows when its human inputs exist.

Gates: Koss signs discuss, plan, UAT and ship for every phase. No phase self-approves.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Platform Foundation** - Worker, D1, R2 and Access in Houssem's own Cloudflare account, proven on the Free plan
- [ ] **Phase 2: Carousel and Film Playback** - Liquid-glass carousel recoloured to his brand, mobile tier, fallback, and the focus player
- [ ] **Phase 3: Content Model and Admin Media** - Houssem signs in to /admin and manages works, logos and creators; the home page reads from D1
- [ ] **Phase 4: Site Sections and Languages** - Logos, creators, services, industries, film pages, in English, Arabic (RTL) and French
- [ ] **Phase 5: Booking** - Free call and shoot request with real slots, emails, WhatsApp, and booking management in /admin
- [ ] **Phase 6: Launch** - Production checks on real devices, licence and content audit, live at mansourimedia.com
- [ ] **Phase 7: Deposits** - Card payment link on Houssem's own Stripe after a quote, confirmed by webhook (after v1, non-blocking)

**v1 cut line: after Phase 6.** Phase 7 ships when Houssem's Stripe account is live and Koss has set amounts and refund wording.

## Dependencies and Parallel Work

```
Phase 1 ──┬── Phase 2 (carousel, seed JSON) ──┐
          │                                   ├── Phase 4 ── Phase 5 ── Phase 6  (v1 live)
          └── Phase 3 (content + admin) ──────┘                │
                                                              └── Phase 7 (deposits, after v1)
```

- Phases 2 and 3 run in parallel once Phase 1 has the scaffold. Phase 2 starts on seed JSON and switches to D1 data when Phase 3 lands.
- Phase 2 and Phase 3 can start locally before Houssem's Cloudflare account exists; Phase 1's live deploy criteria need that account (human track item 1).
- Phase 4 needs Phase 2 (carousel and focus view) and Phase 3 (logos, creators, AR/FR approval in /admin).
- Phase 5 needs Phase 3 (admin) and Phase 4 (languages for screens and emails).
- Phase 7 needs Phase 5 (bookings and quotes) and is not on the launch path.

## Human Track (start day 1, not requirements)

These are inputs only Houssem or Koss can give. Each blocks a named phase; none is invented by Claude.

| # | Item | Owner | Blocks |
|---|------|-------|--------|
| 1 | 2/12 | In Progress|  |
| 2 | Sending domain mansourimedia.com added and verified in Koss's Resend account (DNS records on Houssem's zone) | Koss | Phase 5 emails |
| 3 | Houssem's Stripe account and his UAE eligibility (trade licence / business) | Houssem | Phase 7 |
| 4 | Film source files (web-ready MP4s) and which Vimeo films go in v1, incl. private folders | Houssem | Phase 2 real data, Phase 3 uploads |
| 5 | Clean (SVG) logos; names of the 9 unidentified logo files | Houssem | Phase 4 logos |
| 6 | Brand confirmations: each brand he may show under "Brands I've filmed for" | Houssem | Phase 4 logos |
| 7 | Creator roles: his real job with each creator, and which creators have a linked film | Houssem | Phase 4 creators |
| 8 | Bio, "why Mansouri Media" and process copy (sections stay absent without it) | Houssem | Phase 4 (optional sections) |
| 9 | AR and FR review: Houssem approves Claude's drafts in /admin | Houssem | Phase 6 launch |
| 10 | Slot grid, working hours, and whether shoot days block calls | Houssem | Phase 5 slots |
| 11 | Deposit amounts, which services take a deposit, refund copy | Koss (pricing talk) | Phase 7 |

## Phase Details

### Phase 1: Platform Foundation

**Goal**: A skeleton site (holding page) is live at its workers.dev address from Houssem's Cloudflare account, with D1, R2 media and Access wired, and it fits the Workers Free plan
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05
**Success Criteria** (what must be TRUE):

  1. Opening the workers.dev address shows the EN/AR/FR holding page served by the `mansourimedia` Worker in the "Houssam Portfolio" account, deployed by Workers Builds from GitHub, and every deploy prints a `wrangler whoami` check naming his account first (never the Vamos account)
  2. A test film served by the Worker from R2 can be seeked in the browser: the live address answers HTTP 206, cold and cached, and a poster loads into a WebGL test page with no CORS error
  3. Local, preview and production each have their own D1 database, and a migration applied from the repo shows the same tables in each
  4. /admin asks for Access on the workers.dev address and is unreachable without a valid Access token from any URL, including public branch previews
  5. The first deploy's measured CPU time per request is recorded and stays under the Free plan limit

**Plans:** 2/12 plans executed

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Scaffold: Next 16.3.8 + OpenNext Worker, wrangler.jsonc (pinned account), worker.ts `/` locale redirect, [locale] layout, Playwright harness
- [ ] 01-03-PLAN.md — Koss's inputs: vitest npm check, workers.dev subdomain, GitHub app installation

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Holding page (signed variant C, EN/AR/FR), self-hosted fonts, visual match to the signed shots (or Koss's OK on the diff)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-04-PLAN.md — Account guard + wr.sh (CI whoami fallback), production/preview D1 and R2, migration 0000 (checks table) on local and preview

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 01-05-PLAN.md — R2 media through the Worker (206/416/304, first + repeat 206), probe film/poster, verify-live and prepush-check scripts

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 01-06-PLAN.md — Ship 1 (Koss's answer): clean-clone check, production migration, production probes, rollback tag, push main

**Wave 6** *(blocked on Wave 5 completion)*

- [ ] 01-07-PLAN.md — Workers Builds import (Koss), live checks, CPU measurement, branch-preview isolation

**Wave 7** *(blocked on Wave 6 completion)*

- [ ] 01-08-PLAN.md — Access spike on workers.dev paths (Koss creates team + app); stops with options if it fails

**Wave 8** *(blocked on Wave 7 completion)*

- [ ] 01-09-PLAN.md — Access JWT gate in the Worker (no bypass), Access vars, checks read/write + format helpers, /api/admin/ping, local 403 tests

**Wave 9** *(blocked on Wave 8 completion)*

- [ ] 01-10-PLAN.md — Signed /admin "System check" (Run check → D1 write + last five) and /admin/lab "Media lab" pages, full local suite

**Wave 10** *(blocked on Wave 9 completion)*

- [ ] 01-11-PLAN.md — Ship 2 (Koss's answer): clean-clone check, rollback tag, admin gate live, locked on production and preview

**Wave 11** *(blocked on Wave 10 completion)*

- [ ] 01-12-PLAN.md — Koss's live UAT, probe keep/delete decision, D1 read-back, admin CPU, evidence map

**Cross-cutting constraints:**

- A fresh clone of the commit to be pushed installs from the lockfile, builds with opennextjs-cloudflare and passes vitest, with the Node version recorded

### Phase 2: Carousel and Film Playback

**Goal**: A visitor on a phone or desktop browses Houssem's films in the liquid-glass carousel and watches any of them full height
**Mode:** mvp
**Depends on**: Phase 1 (scaffold); runs in parallel with Phase 3 on seed JSON
**Requirements**: CARO-01, CARO-02, CARO-03, CARO-04, CARO-05, CARO-06, CARO-07, CARO-08, PLAY-01, PLAY-02, PLAY-03
**Success Criteria** (what must be TRUE):

  1. On desktop the home page shows the carousel on a white canvas with plum text and a gold glass ring; each panel keeps its film's real shape (9:16, 4:5, 1:1, 16:9) and a filter with only 2-3 films still fills the screen
  2. Visitor can wheel, drag, flick, swipe and use the keyboard to move; the row settles on a panel and the counter and client/title follow it; industry filters show only industries that have films
  3. On a real phone the touch carousel has the same look at a lighter setting, a vertical swipe still scrolls the page, and with WebGL off or reduced motion a poster grid offers the same films and actions
  4. Tapping a panel opens the focus view and the film plays at once at full screen height; if the browser blocks it (iPhone Low Power Mode) a working play button appears; sound, next/previous and close by Close, Esc, swipe down or the back button all work
  5. Screen readers announce the centred film, the films exist as a real HTML list in the page source, and the carousel recovers after a dropped WebGL context and frees the GPU when the page is left

**Plans**: TBD
**UI hint**: yes

### Phase 3: Content Model and Admin Media

**Goal**: Houssem signs in to /admin and manages every work, logo and creator himself; the home page shows what he publishes without a redeploy
**Mode:** mvp
**Depends on**: Phase 1; runs in parallel with Phase 2
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-07
**Success Criteria** (what must be TRUE):

  1. Houssem opens /admin, gets a one-time code at his Gmail, and gets in; an admin request without a valid Access token is refused
  2. Houssem uploads a large film, picks its poster frame, sets title, client, creator, industry and text in three languages, and it appears on the home page after he publishes it
  3. A film that is not web-ready (not faststart) is refused with a message saying how to export it
  4. Houssem reorders, publishes and unpublishes works, and adds, edits and removes brand logos and creators; the live site reflects each change without a redeploy

**Plans**: TBD
**UI hint**: yes

### Phase 4: Site Sections and Languages

**Goal**: A visitor sees who Houssem has filmed for, who he worked with and what he offers, and can use the whole site in English, Arabic or French
**Mode:** mvp
**Depends on**: Phase 2, Phase 3
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-06, CONT-07, I18N-01, I18N-02, I18N-03, I18N-04, PLAY-04
**Success Criteria** (what must be TRUE):

  1. Koss signs sketches for the logo section and the creator section before any code for them; the built sections match the signed sketches
  2. Visitor sees "Brands I've filmed for" with only brands Houssem confirmed, the creators with their real job as caption (a creator with a linked film opens it), the six services, the industries, the slogan "WE MAKE YOUR VIDEOS REMEMBERED.", and the MIT notice for the carousel in the footer
  3. A section with no real content yet (results, testimonials, bio) is absent from the page, never a placeholder or "coming soon"
  4. Visitor lands in their browser's language at /en, /ar or /fr; Arabic is right-to-left with an Arabic font, the carousel still follows the finger, and arrows, keys and order follow RTL; dates are Gregorian; search engines see hreflang links between the three
  5. Each film has its own shareable link /work/<slug> that opens that film and shows its title and preview image when shared; AR and FR text is marked unreviewed until Houssem approves it in /admin

**Plans**: TBD
**UI hint**: yes

### Phase 5: Booking

**Goal**: A visitor books a free call or requests a shoot in a few taps, in their language, and Houssem manages every booking from /admin
**Mode:** mvp
**Depends on**: Phase 3, Phase 4
**Requirements**: BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, BOOK-07, ADMN-05, ADMN-06, CONT-05, PLAY-05
**Success Criteria** (what must be TRUE):

  1. From "Start your project" on any page, a visitor picks a free call, chooses a day and open slot shown in their time zone and in Dubai time, gives name, email and WhatsApp number, and both visitor and Houssem get an email in the visitor's language with a calendar file
  2. A visitor requests a shoot with service, preferred date, location and short brief; Houssem gets it in /admin and in his email; a booking started from a film or service carries that film or service through
  3. Two visitors racing for the same slot cannot both get it; times Houssem blocked in /admin are never offered; bots are stopped by Turnstile and repeated submissions are rate-limited
  4. Houssem sees every booking with type and status, replies on WhatsApp in one tap, and can quote, confirm or cancel
  5. The focus view shows client, linked creator, "Start a project like this" (booking prefilled with the film) and "WhatsApp us"; the floating WhatsApp button opens wa.me/971505085753 with a message in the visitor's language naming the film or service

**Plans**: TBD
**UI hint**: yes

### Phase 6: Launch

**Goal**: The real site is live at mansourimedia.com with real content, working on the phones and browsers its visitors use
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: LAUN-01, LAUN-02, LAUN-03
**Success Criteria** (what must be TRUE):

  1. Home, a film page and the full booking flow pass on a real iPhone (including Low Power Mode), a mid-range Android, the Instagram in-app browser, and desktop Chrome and Safari
  2. The licence audit passes: no Behance demo images, no Lay Grotesk, MIT notice present on the live site
  3. The live site shows only real content: confirmed brands, real films, AR/FR text Houssem approved; no invented numbers, prices or testimonials
  4. Koss's UAT steps pass on the live URL and Koss gives the ship answer

**Plans**: TBD
**UI hint**: yes

### Phase 7: Deposits

**Goal**: After Houssem quotes a shoot, the visitor can pay the agreed deposit by card to Houssem's own Stripe account, and the booking is marked paid only when Stripe confirms it
**Mode:** mvp
**Depends on**: Phase 5 (after v1; not on the launch path)
**Requirements**: PAY-01, PAY-02, PAY-03
**Success Criteria** (what must be TRUE):

  1. Until Houssem's Stripe account is live and Koss has set the amounts and refund wording, no deposit option is visible anywhere on the site
  2. Houssem enters the agreed deposit on a quoted booking in /admin and the visitor receives a card payment link on his own Stripe account, paying out to his bank
  3. The booking shows "deposit paid" only after Stripe's verified webhook, and only once even if Stripe sends the event twice

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
1 → (2 and 3 in parallel) → 4 → 5 → 6 (v1 live) → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Platform Foundation | 0/10 | Planned | - |
| 2. Carousel and Film Playback | 0/TBD | Not started | - |
| 3. Content Model and Admin Media | 0/TBD | Not started | - |
| 4. Site Sections and Languages | 0/TBD | Not started | - |
| 5. Booking | 0/TBD | Not started | - |
| 6. Launch | 0/TBD | Not started | - |
| 7. Deposits | 0/TBD | Not started | - |
