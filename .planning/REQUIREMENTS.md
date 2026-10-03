# Requirements: Mansouri Media

**Defined:** 2026-10-03
**Core Value:** A brand in the GCC can watch Houssem's vertical films in the glass carousel and book him — call, shoot request or deposit — in a few taps, on a phone or a desktop.

## v1 Requirements

### Platform (PLAT)

- [ ] **PLAT-01**: The site is served from a Cloudflare Worker in Houssem's own Cloudflare account at https://mansourimedia.com, with `wrangler.jsonc` pinned to his `account_id` and a separate wrangler login (never the default Vamos login); every deploy runs a `wrangler whoami` check first
- [ ] **PLAT-02**: Films and posters are served from an R2 bucket on `media.mansourimedia.com`; a seek in a film returns HTTP 206 from the live domain, cold and cached, and posters load into WebGL without CORS errors
- [ ] **PLAT-03**: Data lives in D1 with versioned migrations, separate local / preview / production databases
- [ ] **PLAT-04**: The site runs on the Workers Free plan: public pages are pre-rendered, API handlers stay under the CPU limit, measured on the first deploy
- [ ] **PLAT-05**: `workers.dev` and preview URLs are off or behind Access, so /admin is never reachable without Access

### Carousel (CARO)

- [ ] **CARO-01**: Visitor sees the liquid-glass carousel of Houssem's work on the home page, recoloured to his brand: white canvas, plum text, gold glass ring
- [ ] **CARO-02**: Each panel keeps its film's real shape (9:16, 4:5, 1:1, 16:9) — no crop, no stretch — and a row with only 2–3 films still fills the screen
- [ ] **CARO-03**: Visitor can browse by wheel, drag, flick and swipe; the row settles on a panel; the counter and the client/title text follow the centred panel
- [ ] **CARO-04**: Visitor can filter the work by industry (All / Fashion / Beauty & clinics / Real estate / Products / Ads / Content); a filter with no films is not shown
- [ ] **CARO-05**: On a phone, visitor gets a touch carousel with the same look at a lighter quality setting; a vertical swipe on the page still scrolls
- [ ] **CARO-06**: When WebGL is unavailable, the GPU is too weak, or the visitor prefers reduced motion, visitor gets a poster grid with the same films and actions
- [ ] **CARO-07**: Keyboard users can move through the films and open one; screen readers announce the centred film; the films are a real HTML list that search engines index
- [ ] **CARO-08**: The carousel recovers if the browser drops the WebGL context (iOS) and frees the GPU when the page leaves

### Film playback (PLAY)

- [ ] **PLAY-01**: Clicking or tapping a panel opens the focus view and the film starts playing at once, vertical films at full screen height
- [ ] **PLAY-02**: If the browser blocks playback (e.g. iOS Low Power Mode), visitor sees a play button that works
- [ ] **PLAY-03**: Visitor can turn sound on/off, go to the next/previous film, and close with Close, Esc, swipe down or the phone's back button
- [ ] **PLAY-04**: Each opened film has its own link (`/work/<slug>`) that can be shared and opens that film, with a preview image and title when shared
- [ ] **PLAY-05**: The focus view shows the client and, where linked, the creator, plus "Start a project like this" (booking prefilled with the film) and "WhatsApp us"

### Content sections (CONT)

- [ ] **CONT-01**: Visitor sees the client logos under the heading "Brands I've filmed for", only brands Houssem confirmed, in the layout Koss signs from the sketches
- [ ] **CONT-02**: Visitor sees the creators Houssem worked with, using the Drive photos, each captioned with the real job; creators with a linked film open it
- [ ] **CONT-03**: Visitor sees the six services: ads management · social media · scriptwriting, filming & editing · web & app development · PR · influencers
- [ ] **CONT-04**: Visitor sees the industries served and the slogan "WE MAKE YOUR VIDEOS REMEMBERED."
- [ ] **CONT-05**: Every page offers "Start your project" (booking) and a floating "WhatsApp us" button that opens `wa.me/971505085753` with a pre-filled message in the visitor's language naming the film or service
- [ ] **CONT-06**: A section with no real content yet (results numbers, testimonials, bio) is absent — never a placeholder or "coming soon"
- [ ] **CONT-07**: The page footer keeps the MIT notice for the carousel code (Yousuf Soomro)

### Languages (I18N)

- [ ] **I18N-01**: Visitor can use the whole site, booking and emails in English, Arabic or French, each at its own URL (`/en`, `/ar`, `/fr`), with the language picked from the browser on first visit
- [ ] **I18N-02**: Arabic pages are right-to-left with an Arabic font; the carousel keeps following the finger while arrows/keys and order follow RTL
- [ ] **I18N-03**: Arabic and French text is drafted by Claude and marked unreviewed until Houssem approves it in /admin; launch waits on his approval
- [ ] **I18N-04**: Dates and times show in the Gregorian calendar with the visitor's language format; search engines see hreflang links between the three languages

### Booking (BOOK)

- [ ] **BOOK-01**: Visitor chooses one of three: free discovery call, shoot date request, or (when switched on) deposit for a quoted shoot
- [ ] **BOOK-02**: Visitor can book a free call in a few screens: pick a day and an open time slot (shown in their own time zone and Dubai time), give name, email and WhatsApp number
- [ ] **BOOK-03**: Visitor can request a shoot: pick the service, a preferred date, a location and a short brief; Houssem replies with a quote
- [ ] **BOOK-04**: Two visitors can never book the same slot; times Houssem has blocked are never offered
- [ ] **BOOK-05**: Visitor and Houssem each get a confirmation email (from Koss's Resend account on mansourimedia.com) in the visitor's language, with a calendar file for calls
- [ ] **BOOK-06**: The booking form is protected from bots (Turnstile) and rate-limited
- [ ] **BOOK-07**: A booking started from a film or service carries that film/service into the booking and Houssem's email

### Deposits (PAY)

- [ ] **PAY-01**: Houssem can enter an agreed deposit for a quoted booking in /admin and send the visitor a card payment link on his own Stripe account (payout to his bank)
- [ ] **PAY-02**: A booking becomes "deposit paid" only from Stripe's verified webhook, once, even if Stripe sends it twice
- [ ] **PAY-03**: The deposit option stays switched off and invisible until Houssem's Stripe account is live and Koss has set the amounts and refund wording

### Admin (ADMN)

- [ ] **ADMN-01**: Houssem signs in to /admin with a one-time code sent to his Gmail (Cloudflare Access); every admin request checks the Access token
- [ ] **ADMN-02**: Houssem can upload a film or photo (large files supported), pick its poster frame, and set title, client, creator, industry and text in three languages
- [ ] **ADMN-03**: Houssem can reorder, publish and unpublish works; the site updates without a redeploy
- [ ] **ADMN-04**: Houssem can add, edit and remove brand logos and creators
- [ ] **ADMN-05**: Houssem sees every booking with its type and status, and can reply on WhatsApp in one tap, quote, confirm or cancel
- [ ] **ADMN-06**: Houssem can block days or time ranges so they are not offered for booking
- [ ] **ADMN-07**: Admin refuses a film that is not web-ready (not faststart) and says how to export it

### Launch (LAUN)

- [ ] **LAUN-01**: Home, a film page and the full booking flow pass on a real iPhone (incl. Low Power Mode), a mid-range Android, the Instagram in-app browser and desktop Chrome/Safari
- [ ] **LAUN-02**: Licence audit passes: no Behance demo images, no Lay Grotesk, MIT notice present
- [ ] **LAUN-03**: The live site uses only real content: confirmed brands, real films, reviewed AR/FR text; no invented numbers, prices or testimonials

## v2 Requirements

- **RES-01**: Results numbers (40+ brands, 400M+ impressions, 3x ROI, 0→1M followers) — only with Houssem's proof
- **TEST-01**: Testimonials and client stories — only real, named
- **PAY-04**: Public fixed-price deposit at booking time — only if Koss approves public amounts and cancellation terms
- **PLAT-06**: Workers Paid plan — if Free CPU limits are hit
- **CASE-01**: Per-service pages and case studies
- **CAL-01**: Google Calendar sync for Houssem
- **PREV-01**: Hover/short preview clips in the ring

## Out of Scope

| Feature | Reason |
|---------|--------|
| Stripe Connect / commission split | UAE platform needs Stripe sales and makes Koss merchant of record; Koss chose Houssem's own Stripe, no commission |
| Notion bookings | D1 keeps it all on Cloudflare; no Notion account for Houssem |
| Cloudflare Stream | R2 MP4 + poster, no per-minute cost |
| Vimeo / YouTube / Instagram embeds | Slow, branded players, tracking; own R2 playback instead |
| Autoplay with sound | Browsers block it; hostile to visitors |
| Lay Grotesk, Behance demo images | Not licensed |
| Price calculator, public prices | Pricing is discussed with Koss first |
| Client accounts / portal, chatbot, Calendly embed, blog | Not needed for a one-person agency at launch |
| Desktop-only gate of the reference | Visitors come from Instagram on phones |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Pending |
| PLAT-02 | Phase 1 | Pending |
| PLAT-03 | Phase 1 | Pending |
| PLAT-04 | Phase 1 | Pending |
| PLAT-05 | Phase 1 | Pending |
| CARO-01 | Phase 2 | Pending |
| CARO-02 | Phase 2 | Pending |
| CARO-03 | Phase 2 | Pending |
| CARO-04 | Phase 2 | Pending |
| CARO-05 | Phase 2 | Pending |
| CARO-06 | Phase 2 | Pending |
| CARO-07 | Phase 2 | Pending |
| CARO-08 | Phase 2 | Pending |
| PLAY-01 | Phase 2 | Pending |
| PLAY-02 | Phase 2 | Pending |
| PLAY-03 | Phase 2 | Pending |
| PLAY-04 | Phase 4 | Pending |
| PLAY-05 | Phase 5 | Pending |
| CONT-01 | Phase 4 | Pending |
| CONT-02 | Phase 4 | Pending |
| CONT-03 | Phase 4 | Pending |
| CONT-04 | Phase 4 | Pending |
| CONT-05 | Phase 5 | Pending |
| CONT-06 | Phase 4 | Pending |
| CONT-07 | Phase 4 | Pending |
| I18N-01 | Phase 4 | Pending |
| I18N-02 | Phase 4 | Pending |
| I18N-03 | Phase 4 | Pending |
| I18N-04 | Phase 4 | Pending |
| BOOK-01 | Phase 5 | Pending |
| BOOK-02 | Phase 5 | Pending |
| BOOK-03 | Phase 5 | Pending |
| BOOK-04 | Phase 5 | Pending |
| BOOK-05 | Phase 5 | Pending |
| BOOK-06 | Phase 5 | Pending |
| BOOK-07 | Phase 5 | Pending |
| PAY-01 | Phase 7 | Pending |
| PAY-02 | Phase 7 | Pending |
| PAY-03 | Phase 7 | Pending |
| ADMN-01 | Phase 3 | Pending |
| ADMN-02 | Phase 3 | Pending |
| ADMN-03 | Phase 3 | Pending |
| ADMN-04 | Phase 3 | Pending |
| ADMN-05 | Phase 5 | Pending |
| ADMN-06 | Phase 5 | Pending |
| ADMN-07 | Phase 3 | Pending |
| LAUN-01 | Phase 6 | Pending |
| LAUN-02 | Phase 6 | Pending |
| LAUN-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 49 total
- Mapped to phases: 49
- Unmapped: 0

---
*Requirements defined: 2026-10-03*
*Last updated: 2026-10-03 after roadmap creation*
