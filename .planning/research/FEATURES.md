# Feature Research

**Domain:** Videographer / content-agency portfolio with booking (Mansouri Media, Dubai / GCC, EN-AR-FR)
**Researched:** 2026-10-03
**Confidence:** MEDIUM overall. HIGH on browser/platform behaviour (autoplay, wa.me, Stripe Connect fees: official or multi-source). MEDIUM on what GCC agency sites do (WebSearch survey of Dubai agencies plus known agency-site conventions). LOW where marked.

Inputs read: `.planning/PROJECT.md`, `BRIEF.md`, `_source/steps.txt`, `_source/brands/` (34 files), `_source/influencers/` (21), Koussay-Portfolio `app/booking/page.js`, `lib/book/*` (steps, config, validate, draft, time, confirmation, research), `components/book/*`, `app/api/book/*`.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these and a brand manager on a phone from Instagram leaves.

#### A. Vertical 9:16 video viewing

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Poster still for every film (shown before play) | Nothing loads blank; fast first paint on 4G | LOW | Poster JPG/WebP ~1080×1920 and a small one (~360×640) for the ring texture. Admin generates it (see E). |
| Focus view plays the film at full viewport height, natural 9:16 | His work is vertical; letterboxing a reel into 16:9 makes it look small and amateur | MEDIUM | Desktop: player height = 100vh minus chrome, width = h×9/16, centred. Side space = plum, or blurred enlarged poster (Instagram/TikTok desktop pattern). Mobile: edge-to-edge, `object-fit: cover` only if film is exactly 9:16, else `contain`. |
| Sound control visible and obvious | Social films are made with sound; users must know it exists | LOW | One mute/unmute button, large, bottom corner (mirrored in RTL). Remember choice for the session across films. |
| Play starts with sound when the user clicked to open | The click is a user gesture, so unmuted `play()` is allowed | MEDIUM | Call `video.play()` synchronously inside the click/tap handler (before the GSAP focus animation), not in an `onComplete` callback; Safari can lose the gesture after async delays. Fallback: if `play()` rejects with `NotAllowedError`, set `muted=true`, play, show "Tap for sound". (HIGH: autoplay policy; MEDIUM: gesture-timing detail.) |
| Inline playback on iOS | Without it iOS jumps to native fullscreen and breaks the design | LOW | `playsinline` + `muted` for any autoplay; `preload="metadata"` or `none` on non-focused films. |
| Low Power Mode fallback | iOS Low Power Mode blocks even muted autoplay; play() rejects with NotAllowedError | LOW | Always render a custom play button over the poster; never rely on autoplay for meaning. (HIGH, multiple sources.) |
| Close / Esc / back gesture leaves the film | Standard lightbox behaviour; Android back button must close, not leave site | LOW | Push a history state (`?film=slug`) on open; `popstate` closes. Also gives shareable links per film. |
| Next / previous film inside focus view | Users binge reels; going back to the ring each time is friction | MEDIUM | Swipe up/down on mobile (Reels gesture), arrows on desktop. Respect current industry filter. |
| Film caption: title, client, industry | Credit is the social proof; also needed for SEO | LOW | Data from admin fields. No views/likes numbers unless Houssem proves them. |
| Range-request streaming (seek works, starts fast) | Large MP4 must not download fully before play | MEDIUM | R2 served through a Worker or public bucket custom domain must honour `Range`. Encode with `+faststart` (moov atom first). See PITFALLS. |
| Reduced-motion and no-WebGL fallback | Some phones lack WebGL2 or are slow; a11y | MEDIUM | Plain CSS grid of 9:16 posters with the same filters and same focus player. Same data, no shader. |

#### B. Proof of work (no invented numbers)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Client logo section | Every Dubai agency site surveyed shows "trusted by" logos; it is the fastest credibility signal | LOW–MEDIUM | 34 files in `_source/brands/`, mostly JPG/PNG with backgrounds; 9 are unnamed (`images*.jpg/png`, `unnamed.jpg`) and must be identified by Houssem. Needs clean mono SVG/PNG for any layout (see directions below). |
| Creator / influencer credits | His differentiator vs generic production houses: footballers, fighters, creators | MEDIUM | 21 photos. State his role per creator truthfully ("filmed", "edited", "campaign with") — ask Houssem; do not imply a relationship that did not happen. |
| Each film credited to a real client | Logos alone are claimable by anyone; film + client name proves it | LOW | Admin field `client`, optional link to logo record so logo wall and films connect. |
| Experience facts from CV | True, checkable proof while no testimonials exist | LOW | DMT Abu Dhabi (via Kizmet, 2025–), Visioneers 2022–25, Alfan Group, NDI, BA ESAD Tunis. Short "About Houssem" block. |
| Results numbers block, hidden until proof | His doc lists 40+ brands / 400M+ / 3x ROI / 0→1M; brief forbids showing without proof | LOW | Build the section behind a flag in admin/content; ships off. Note: "40+ brands" is checkable from the logo count once all 34+ logos are identified — still needs Houssem's confirmation. |

#### C. Services, industries, why us

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Industry filter on the work | Buyers want "show me my industry" (clinic owner wants clinic films) | MEDIUM | All / Fashion / Beauty & clinics / Real estate / Products / Ads / Content. Filter must rebuild the carousel ring (engine change: dynamic panel set + re-entry animation). Hide a filter chip if it has zero films (no empty states shown as features). |
| Six services, each with what's included and matching films | Visitors scan for "do they do X" | LOW–MEDIUM | One page `/services` with six anchored sections is enough for v1; per-service pages are a v1.x SEO play. Each service links "Start your project" with that service preselected. Copy for deliverables must come from Houssem; no prices. |
| Industries list | His doc has it; reassures sector buyers | LOW | Can double as the filter chips; avoid two separate lists that drift. |
| "Why Mansouri Media" | Every agency site has it; his doc has the heading | LOW | Content is OPEN (brief item 7). Build from facts only: one person directing + editing (no hand-offs), vertical-first, trilingual, in-house web/app. Houssem signs the copy. |
| Process / how it works (3–4 steps) | Lowers fear for first-time buyers of video | LOW | Brief → shoot → edit → delivery. Real steps from Houssem; no invented turnaround times. |
| Contact facts: WhatsApp, email, Dubai | GCC buyers expect a phone/WhatsApp, not just a form | LOW | +971 50 50 8 5753, houssemansouri96@gmail.com (approved in brief). |

#### D. Booking (three types)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| One entry "Start your project" → choose type first | Three different intents need three different forms; choosing first keeps each short | LOW | Type cards: Free discovery call / Request a shoot date / Pay a deposit. |
| Discovery call: pick day + slot from real availability | Standard (Calendly-like); Koussay-Portfolio already has it | MEDIUM | Reuse `lib/book/time.js` slot maths (timezone-safe `slotStartMs`), replace Notion busy-list with D1 bookings + blocked ranges. |
| Shoot request: service + date + location → he quotes | Brief requirement; agencies quote per shoot | MEDIUM | Date with "flexible" option and optional second date; location = emirate + area/venue free text; on-site vs studio. |
| WhatsApp number field (not just email) | In the GCC the reply happens on WhatsApp | LOW | `tel` input with country code default +971; store E.164. |
| Server-side validation + double-booking guard | A slot must not be sold twice | MEDIUM | D1 unique index on slot start for calls; re-check availability in the write transaction. Koussay-Portfolio validates on server already (`validateBooking`), port it. |
| Confirmation screen + emails to visitor and Houssem (Resend) | Proof the request landed | LOW–MEDIUM | Port `bookingCopy`. Email in visitor's chosen language. Include reference ID and "Message us on WhatsApp" link with that ID. |
| Add-to-calendar (.ics) for calls | Expected after any time booking | LOW | ICS attachment or download; Asia/Dubai. |
| Spam protection | Public form on Cloudflare; bots hit it | LOW | Cloudflare Turnstile (free, invisible) + honeypot. |
| Deposit payment via Stripe Checkout | Brief requirement | MEDIUM–HIGH | Destination charge (or direct charge) with `application_fee_amount` = Koss's commission, `transfer_data.destination` = Houssem's Express account (HIGH: Stripe docs). Webhook `checkout.session.completed` marks booking paid. Amounts OPEN. |

#### E. Admin

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Upload film/photo to R2 with title, client, industry | Brief; Houssem must add work without Koss | MEDIUM–HIGH | Upload direct from browser to R2 with presigned (multipart) URLs; Worker request bodies are size-limited, a 1080×1920 film can exceed it. Verify current limit in STACK research. |
| Auto poster from the video | Houssem should not export a second file | MEDIUM | Seek to a chosen second in a `<video>`, draw to canvas, upload WebP. Let him scrub to pick the frame. |
| Order, feature, publish/unpublish films | The ring order is the portfolio's story | LOW–MEDIUM | Drag to reorder, `published` flag. Unpublished = never served. |
| Bookings list with status | He must see and act on requests | MEDIUM | Statuses: new → replied/quoted → deposit paid → confirmed → done / cancelled. One-tap WhatsApp reply (`wa.me/<their number>?text=`), mailto. |
| Block time | Brief; stops calls landing on shoot days | MEDIUM | Block whole days or ranges, and set weekly call hours. A confirmed shoot auto-blocks its day. |
| Login via Cloudflare Access email code | Brief; no passwords | LOW | Policy on `/admin*` and `/api/admin*`; Worker also verifies the `Cf-Access-Jwt-Assertion` header, not just path protection. |

#### F. Language and reach

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| EN / AR (RTL) / FR switcher, URL per language | GCC + Maghreb audience; brief | MEDIUM–HIGH | `/en`, `/ar`, `/fr` with `hreflang`. `dir="rtl"` on `/ar`; mirror layout via logical CSS properties. Arabic needs a paired Arabic typeface (the Latin grotesk will not have Arabic glyphs). |
| Film titles/clients per language | Mixed-language pages look broken | LOW | Admin fields: title EN required, AR/FR optional with EN fallback. Brand names stay Latin. |
| Booking, emails and WhatsApp prefill in the visitor's language | A French or Arabic speaker who booked in FR/AR expects replies in it | LOW | Store `locale` on the booking. |
| Floating WhatsApp button | Near-universal on UAE service sites; most leads arrive this way | LOW | `https://wa.me/971505085753?text=<urlencoded>` (HIGH: WhatsApp FAQ format: digits only, no +). Bottom-right LTR, bottom-left RTL. Hide while a film plays fullscreen and on the booking form to avoid covering controls. |
| Context-aware WhatsApp prefill | Saves the buyer typing; tells Houssem what they saw | LOW | From a film: "Hi Mansouri Media, I saw the <film> film and want something similar for <brand>." From a service: names the service. Per locale. |
| Basic SEO + social share cards | Links get shared in WhatsApp groups; preview card matters | LOW | OG image per film (poster), per page. Port Koussay-Portfolio `JsonLd`/`seo` helpers (VideoObject schema per film). |

---

### Differentiators (Competitive Advantage)

Aligned with the core value: watch vertical films in the glass carousel, book in a few taps.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Liquid-glass WebGL ring with gold lens | No Dubai agency surveyed has anything like it; it is the brand moment | HIGH | Already the plan. Mobile needs the lighter shader variant. |
| Mobile focus view = Reels-style vertical feed | Visitors arrive from Instagram; the same gesture they know (swipe up for next) | MEDIUM | After first tap, swipe through films full-screen with sound remembered. Preload only the next film's metadata + poster. |
| Desktop hover preview | Shows motion before commitment | HIGH | Needs a 2–3 s muted preview clip per film (extra file) and conflicts with WebGL posters in the ring (would need VideoTexture). Recommend: no hover video in the ring; instead a subtle poster parallax/brighten. Hover preview only in the fallback grid, v1.x. |
| "Shot for" link from film → client logo and back | Ties proof together: click Ooredoo logo, see Ooredoo films | MEDIUM | Needs client entity in D1 shared by films and logos. |
| Creator card → reel on tap | Proves the celebrity credit with the actual film | MEDIUM | Only for creators with a linked film. Creators without a film get no tap affordance (no fake controls). |
| Booking prefilled from context | "Book a shoot like this" on a film opens shoot request with service + industry + reference film set | LOW | Query params on `/book`. |
| Request a shoot with reference films | Buyer taps films they like as references; Houssem gets a brief with examples | LOW–MEDIUM | Multi-select from the published films list inside the shoot form. |
| Admin "send deposit link" per quote | Real agencies take a deposit after the quote, not before | MEDIUM | Admin enters agreed amount on a booking → creates Stripe Checkout Session → WhatsApp/email the link. Avoids publishing prices (pricing OPEN). See booking analysis. |
| Trilingual including Arabic RTL from day one | Most Dubai agency sites are EN only or EN+AR; FR reaches Maghreb/French brands (his network: Tunisian, Moroccan, Algerian creators) | MEDIUM | Already planned. |
| Credits-roll section (film end-credits style) | Fits a filmmaker; turns logos+creators into one cinematic piece | MEDIUM | One of the layout directions below. |

---

### Logo wall: layout directions to sketch

All need clean, single-colour logos. Today's files are mostly JPG with white/coloured backgrounds; a CSS `filter` or `mix-blend-mode` trick cannot make a JPG with a box background look clean. Sourcing SVGs (brief OPEN item 6) is a dependency of every direction. 9 files are unnamed and need identifying.

| # | Direction | How it looks | Desktop / mobile | Fit for this site | Complexity |
|---|-----------|--------------|------------------|-------------------|------------|
| L1 | Marquee, two rows, opposite directions | Mono plum logos scroll continuously; pause on hover/touch; colour on hover | Same, smaller logos on mobile | Common (most agency sites). Safe, but generic; competes with the carousel's motion | LOW |
| L2 | Static grid with hairline dividers | 6 columns desktop, 3 mobile; cells equal; logo optically sized | Grid collapses cleanly; RTL mirrors free | Calm, editorial; best for 34 logos; easiest to keep crisp | LOW |
| L3 | Grouped by industry | Grid with small headings Fashion / Beauty & clinics / Real estate…; heading taps set the carousel filter | Accordion on mobile | Reinforces the filter system; needs each logo tagged with industry | LOW–MEDIUM |
| L4 | Credits roll | Centred vertical scroll like film end credits: "Clients" then names/logos, then "Creators", slow auto-scroll, scroll-scrub | Same on mobile, natural vertical | Most on-brand for a filmmaker; text-only fallback works even with bad logo files | MEDIUM |
| L5 | Inside the carousel | Client logo on each film's overlay (top 15% brand line already exists in the reference) plus a "Clients" filter chip | Same | Zero extra section; but logos never seen together, so weaker "trusted by" scan | LOW |
| L6 | Stacked cards / deck | Logos on cards that fan or stack and deal out on scroll (GSAP) | Swipe deck on mobile | Playful, memorable; heavy for 34 items; best with ~8 hero logos | MEDIUM–HIGH |
| L7 | Featured + rest | 6 hero logos large (Lexus, L'Oréal, Dyson, Ooredoo, Universal, MBRGI — Houssem picks) then "+ 28 more" small grid | Hero 2×3, rest compact | Ranks recognisable brands first; good with mixed-quality files (hero 6 need SVG, rest can be small) | LOW |

Recommendation for sketching: L7 or L2 as the safe base, L4 as the bold option, L5 always on regardless (client on film overlay costs nothing).

### Creator / influencer section: layout directions to sketch

| # | Direction | How it looks | Fit | Complexity |
|---|-----------|--------------|-----|------------|
| C1 | Creator cards, reel on tap | 4:5 portrait cards: photo, name, handle, role ("Filmed for…"); tap opens linked film in focus view | Strongest proof; needs film links per creator | MEDIUM |
| C2 | Story circles strip | Instagram-story circles with gold ring, horizontal scroll; tap opens story-style viewer (photo, then reel if exists) | Instant recognition for Instagram users; small photos hide low-res files | MEDIUM |
| C3 | Typographic list + hover/tap reveal | Large names in a list (Mbappé, Pogba, Hakimi…); hover on desktop shows photo floating at cursor; tap on mobile expands row | Editorial, fast, name-recognition-led; photos secondary (good given photographer copyright note) | LOW–MEDIUM |
| C4 | Bento mosaic | Mixed-size tiles, celebrities big, creators small | Visual punch; hard to balance in RTL and with 21 uneven photos | MEDIUM |
| C5 | Inside the carousel | "Creators" filter chip; creator photo panels in the ring; tap → their film | Unifies the site; mixes stills with film posters (confusing which plays) | MEDIUM |
| C6 | Credits roll (shared with L4) | Names in the same end-credits sequence after clients | Cohesive with L4 | MEDIUM |

Recommendation for sketching: C1 (if Houssem can link films) or C3 (if not), C2 as the mobile-native option. Separate famous athletes (name recognition) from creators (reach) only if Houssem wants it.

---

### Booking flow: Koussay-Portfolio vs recommended

**What Koussay-Portfolio does (read from source):** 11 steps, one question per screen: 0 fit checks (two required checkboxes "decision-maker", "ready to start") · 1 name · 2 email · 3 day · 4 time (hourly 9am–7pm, 60 min, 5 timezones, 12/24h) · 5 company · 6 website · 7 services · 8 budget (USD/EUR/AED ranges) · 9 deadline · 10 details + attachment (4 MB). Step in URL (`?step=`), draft in localStorage + server draft (Notion) on each step, availability API (busy from Notion), server re-validation with step/field error mapping, confirmation copy, AI company-research briefing (Firecrawl + Gemini/OpenAI) for the call.

**Keep:** one-question screens with progress bar, step in URL (back button works), localStorage draft, server availability, server re-validation returning the step to jump back to, timezone-safe slot maths, confirmation copy structure.

**Change for Mansouri Media:**
- Type choice first; three short branches instead of one long flow. Eleven screens on a phone from Instagram is too long for a free call.
- Merge name + email + WhatsApp into one "contact" screen (three fields fit a phone screen).
- Drop the fit checks (gatekeeping a free call loses Instagram leads; Houssem can filter in admin).
- Drop budget ranges unless Koss and Houssem set them (pricing rule: no invented ranges). If added later, AED first.
- Drop website step as required; make "Brand / Instagram handle" one optional field (GCC brands live on Instagram, not websites).
- Add WhatsApp number, location, shoot date flexibility, reference films.
- Drop the server-side Notion draft (D1 decided); localStorage draft is enough. Abandoned-lead capture is v1.x.
- AI research briefing: defer (extra API keys, cost, and Instagram handles are not crawlable like websites).
- Timezones: default Asia/Dubai; detect browser zone; show times in visitor zone with Dubai time beside it.

**Recommended branches (screens):**

1. **Free discovery call** (4 screens): type → day + time (one screen on desktop, two on mobile) → contact (name, email, WhatsApp) → "What is it about?" (service chips + optional brand/handle + optional note) → confirm.
2. **Shoot date request** (5 screens): type → service(s) → date (calendar, "flexible" toggle, optional second choice; blocked days disabled) → location (emirate select + area/venue text + studio/on-site) → brief (brand/handle, reference films, note, optional attachment) → contact → confirm "Houssem replies with a quote" (no promised turnaround unless he sets one).
3. **Paid deposit** — two entry modes; pick at plan time once pricing is discussed:
   - **3a (recommended): deposit for a quote.** Admin sets amount on a shoot request → Stripe Checkout link sent by WhatsApp/email → webhook marks paid → day blocked. No public prices needed.
   - **3b: public "reserve a shoot day" deposit.** Fixed amount(s) per service from Koss → shoot-request screens → Stripe Checkout → paid booking. Only if Koss approves public amounts; also needs refund/cancellation terms (legal copy: Koss/Houssem provide, not invented).

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Animated counters ("400M+ impressions") without proof | Every agency site has them; his doc lists them | Brief honesty rule; unverifiable claims hurt trust with big brands | Results section built but off until proof arrives |
| Autoplay with sound / auto-playing every film in the ring | "Show the work immediately" | Blocked by browsers; heavy data on mobile; WebGL VideoTexture for every panel kills mobile GPU | Posters in ring, play on tap in focus view |
| Vimeo/YouTube embeds as the player | Films already live there | Third-party chrome, slower start, branding, cookies; decided against (R2) | R2 MP4 + own player |
| Instagram feed widget | "Show our latest posts" | Breaks with API changes, slow, off-brand, privacy | Link to Instagram profile; post selected films in admin |
| Instant price calculator / public rate card | Buyers like prices | Pricing not discussed; quotes depend on location, crew, edits | Shoot request → quote; deposit link from admin |
| Client accounts / client portal | "Clients can track projects" | Auth, password storage, scope; brief has no such need | Email + WhatsApp + reference ID |
| AI chatbot | Trend | Invents answers about prices/availability; GCC buyers prefer WhatsApp a human | WhatsApp button |
| Calendly / Cal.com embed | Quick booking | Breaks the design, no RTL/AR polish in the same look, no link to shoot/deposit types, another account for Houssem | Own flow on D1 (code exists in Koussay-Portfolio) |
| Long qualifying form (fit checks, budget, deadline required) | Filter bad leads | Kills mobile conversion on a free call | Short branches; Houssem filters in admin |
| Fake testimonials / placeholder quotes / stock "client stories" | Section in his doc | Honesty rule; no content exists | Omit section until real, signed testimonials |
| Desktop-only gate (<1025px) from the reference | Shader is heavy | Most visitors are on phones | Lighter mobile shader + CSS fallback grid |
| Newsletter popup, cookie wall theatre | Common template | Annoying; legal copy must not be invented | No tracking cookies in v1 → minimal notice copy from Koss if any |
| Blog | SEO | No content plan; empty blog is negative proof | Per-service pages later (v1.x) |
| Google Calendar two-way sync in v1 | Real availability | OAuth, token storage, sync bugs; 2-week deadline | Manual block time in admin; sync v2 |
| Admin-editable translations / CMS for all copy | Flexibility | Builds a CMS; copy changes rare | Copy in locale JSON in the repo; admin edits films only |

---

## Feature Dependencies

```
Clean logo files (SVG/PNG, identified) ──required by──> Logo wall (any direction)
Client entity in D1 ──required by──> film→client link, logo→films, L3/L5
Film records (admin upload) ──required by──> carousel data, filters, creator reel-on-tap, reference films in shoot form, OG/VideoObject
R2 presigned upload + range serving ──required by──> admin upload ──> films on site
Poster generation ──required by──> carousel ring textures, fallback grid, OG images
Industry tags on films ──required by──> industry filter ──enhances──> L3 grouped logos
Creator ↔ film link ──required by──> C1 creator cards with reel on tap
Locale routing (/en /ar /fr) + Arabic font ──required by──> all copy, booking, emails, WhatsApp prefill
Availability model (weekly hours + blocked ranges + bookings in D1) ──required by──> discovery call slots, shoot date calendar, admin block time
Booking records in D1 ──required by──> Resend emails, admin bookings list, deposit link
Stripe Connect platform + Houssem Express account onboarded + fee agreed + amounts set ──required by──> any deposit (3a or 3b)
Stripe webhook ──required by──> booking marked paid, day auto-blocked
Cloudflare Access on /admin ──required by──> every admin feature
Focus-view player ──required by──> Reels-style swipe feed, creator reel-on-tap, "book a shoot like this"

Hover video previews ──conflicts──> WebGL poster ring (would need VideoTexture per panel)
Public deposit amounts (3b) ──conflicts──> "pricing discussed first" until Koss sets them
Floating WhatsApp button ──conflicts──> fullscreen player controls and booking footer buttons (hide there)
Marquee logos (L1) ──competes──> carousel motion on the same screen (place far from the ring)
```

### Dependency Notes

- **Admin upload before real content:** the carousel can launch with films Koss loads, but Houssem adding work himself requires the full upload path (presign, poster, metadata). Build the data model and upload path before polishing sections that consume films.
- **Availability model is shared:** calls (slots) and shoots (days) read the same blocked ranges; design one table for both, not two systems.
- **Deposit is gated by people, not code:** Stripe account, fee agreement, amounts. Build 3a's admin side so it can ship dark and switch on.
- **Logo and creator sections depend on asset clean-up and Houssem's answers** (identify 9 unnamed logos, his role per creator, which creators have films). Sketch layouts in parallel, implement after.

---

## MVP Definition

### Launch With (v1, by ~2026-10-17)

- [ ] Carousel home with posters, industry filter, focus-view 9:16 player with sound handling — core value
- [ ] Mobile touch carousel + Reels-style focus view; CSS grid fallback — most traffic is phone
- [ ] Logo section (one chosen direction) + client name on each film overlay — proof
- [ ] Creator section (one chosen direction) — proof and differentiator
- [ ] Services (one page, six sections), industries, why-us/about from facts, process — buyer questions
- [ ] Booking: type chooser, discovery call, shoot request; D1; Resend emails; Turnstile — conversion
- [ ] WhatsApp floating button + context prefill, per locale — GCC conversion channel
- [ ] EN / AR (RTL) / FR — brief requirement
- [ ] Admin: upload with poster, order/publish, bookings list with status + WhatsApp reply, block time; Cloudflare Access — Houssem runs it
- [ ] Deposit 3a built behind a switch; on only after Stripe onboarding, fee agreement and amounts

### Add After Validation (v1.x)

- [ ] Per-service pages with own URLs — when SEO traffic matters
- [ ] Results numbers section — when Houssem provides proof
- [ ] Testimonials / client stories — when real ones exist
- [ ] Public deposit 3b — if Koss approves public amounts and terms exist
- [ ] Desktop hover preview clips in fallback grid — if posters underperform
- [ ] Abandoned-booking capture (server draft) — if many start and few finish
- [ ] Reference-film picker in the shoot form — cheap, after film data is rich

### Future Consideration (v2+)

- [ ] Google Calendar sync — when manual blocking causes clashes
- [ ] AI pre-call brief from Instagram handle — when lead volume justifies
- [ ] Case-study pages (problem, film, result) — need results with proof
- [ ] Analytics dashboard in admin — Cloudflare Web Analytics covers v1

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Focus-view 9:16 player with sound handling | HIGH | MEDIUM | P1 |
| Poster ring + industry filter | HIGH | HIGH | P1 |
| Mobile carousel + fallback grid | HIGH | MEDIUM | P1 |
| WhatsApp button + context prefill | HIGH | LOW | P1 |
| Discovery call booking | HIGH | MEDIUM | P1 |
| Shoot request booking | HIGH | MEDIUM | P1 |
| Logo section | HIGH | LOW–MEDIUM (asset-bound) | P1 |
| Creator section | HIGH | MEDIUM | P1 |
| Services / why us / process | MEDIUM | LOW | P1 |
| EN/AR/FR with RTL | HIGH (brief) | MEDIUM–HIGH | P1 |
| Admin upload + poster + publish | HIGH (operator) | MEDIUM–HIGH | P1 |
| Admin bookings + block time | HIGH (operator) | MEDIUM | P1 |
| Deposit via admin link (3a) | MEDIUM | MEDIUM | P1 built, switched off |
| Reels-style swipe between films | MEDIUM | MEDIUM | P2 (P1 if time) |
| Film ↔ client ↔ creator linking | MEDIUM | MEDIUM | P2 |
| Public deposit (3b) | MEDIUM | MEDIUM | P2, pricing-gated |
| Per-service pages | MEDIUM | LOW | P2 |
| Hover previews | LOW | HIGH | P3 |
| Calendar sync | LOW | HIGH | P3 |

---

## Competitor Feature Analysis

| Feature | Dubai production agencies (Dubai Prod, Masoud Raoufi, ABAB Digitals, The Media Lab, People Perfect Media) | Koussay-Portfolio | Our Approach |
|---------|------------------------------------|-------------------|--------------|
| Work display | Mostly 16:9 YouTube/Vimeo embeds or grids; vertical reels mentioned as a service, rarely shown at native aspect | WebGL carousel, landscape-friendly | Vertical-first: native 9:16 posters and full-height player |
| Social proof | Logo walls + counters ("1,000+ videos") + testimonials | Work + clients | Logos + creators + credited films; numbers only with proof |
| Pricing | Some publish "from AED X" packages (ABAB from AED 1,999 for short-form, per its site; LOW confidence, unverified) | Budget ranges in booking | No public prices until Koss sets them |
| Booking | Contact form or "get a quote" + WhatsApp | 11-step call booking | Three short typed branches + WhatsApp |
| Languages | Mostly EN, some EN+AR | EN | EN + AR (RTL) + FR |
| Admin | Not visible (CMS/WordPress typical) | Notion | Own /admin on D1 + R2 behind Access |

---

## Sources

- Project files: `/Users/koss/Developer/Houssam Mansory/.planning/PROJECT.md`, `BRIEF.md`, `_source/steps.txt`, `_source/brands/`, `_source/influencers/` (HIGH)
- Koussay-Portfolio booking source: `/Users/koss/Developer/Koussay-Portfolio/app/booking/page.js`, `lib/book/{steps,config,validate,draft,time,confirmation,research}.js`, `components/book/*`, `app/api/book/*` (HIGH)
- WhatsApp click-to-chat format: [WhatsApp FAQ — How to use click to chat](https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat), [Wati guide](https://support.wati.io/en/articles/11462980-how-to-create-whatsapp-click-to-chat-links) (HIGH)
- iOS autoplay / Low Power Mode: [wojtek.im — Safari autoplay in Low Power Mode](https://wojtek.im/journal/safari-autoplay-not-working-in-low-power-mode), [Apple Developer Forums 709821](https://developer.apple.com/forums/thread/709821), [Apple Developer Forums 727855](https://developer.apple.com/forums/thread/727855), [milkmidi — iOS low power mode](https://milkmidi.medium.com/html-autoplay-video-and-ios-low-power-mode-818dbdc982a0) (HIGH, multiple agree)
- Stripe Connect destination charges + application fee: [Stripe docs — Create destination charges](https://docs.stripe.com/connect/destination-charges), [cjav.dev — Taking a cut with Stripe Connect](https://www.cjav.dev/articles/taking-a-cut-with-stripe-connect) (HIGH)
- Dubai agency survey: [Masoud Raoufi videography](https://masoudraoufi.ae/videography/), [Dubai Prod](https://www.dubaiprod.com/video-production-dubai), [ABAB Digitals](https://ababdigitals.com/services/videography-services-dubai/), [The Media Lab](https://www.themedialab.me/what-we-do/video-production-company/), [People Perfect Media](https://peopleperfectmedia.com/), [videography.ae work](https://videography.ae/work/), [Webtonic list](https://www.webtonic.io/blog/best-video-production-agencies-dubai) (MEDIUM; from search summaries, pages not individually audited)
- Logo/creator layout directions: common agency-site patterns from training knowledge (LOW–MEDIUM; meant as sketch options, not claims)

---
*Feature research for: videographer / content-agency portfolio with booking (Mansouri Media)*
*Researched: 2026-10-03*
