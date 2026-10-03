# Architecture Research

**Domain:** WebGL portfolio + booking site for a video agency (Mansouri Media) on Cloudflare Workers / D1 / R2
**Researched:** 2026-10-03
**Confidence:** HIGH for platform facts (Cloudflare, Stripe, OpenNext docs checked today); MEDIUM for the engine changes (from reading `engine.js`, not yet prototyped)

## Standard Architecture

One Cloudflare Worker (Next.js 16 built with `@opennextjs/cloudflare`) serves pages, the public API, the admin API and the Stripe webhook. D1 holds all structured data. R2 holds all media, served through its own custom domain. Cloudflare Access sits in front of `/admin*` and `/api/admin*`. No Durable Objects, no Queues, no Stream for v1.

### System Overview

```
┌──────────────────────────────── Browser ─────────────────────────────────────┐
│  Public pages (/en /ar /fr)                     /admin (behind Access)        │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────┐  ┌──────────────────────────┐ │
│  │ Carousel     │ │ Focus video  │ │ Booking │  │ Works editor + uploader  │ │
│  │ engine (GL)  │→│ <video> over │ │ wizard  │  │ (multipart, poster grab) │ │
│  │ framework-   │ │ canvas       │ │ 3 types │  │ Bookings / blocked time  │ │
│  │ free         │ └──────┬───────┘ └────┬────┘  └────────────┬─────────────┘ │
│  └──────┬───────┘        │ range GET    │ JSON               │ JSON + parts  │
└─────────┼────────────────┼──────────────┼────────────────────┼───────────────┘
          │ poster GET     │              │                    │
          ▼                ▼              ▼                    ▼
┌──────────────────────────────┐  ┌──────────────────────────────────────────────┐
│ media.mansourimedia.com      │  │ Worker: mansourimedia.com (Next + OpenNext)  │
│ R2 custom domain (CDN cache, │  │  ├─ pages (SSR, works JSON inlined)          │
│ native Range, CORS for GL)   │  │  ├─ /api/availability  /api/bookings         │
└──────────────┬───────────────┘  │  ├─ /api/checkout  /api/stripe/webhook       │
               │                  │  ├─ /api/admin/*  (Access JWT re-verified)   │
               │                  │  └─ cron: sweep expired holds                │
               │                  └───┬───────────────┬──────────────┬───────────┘
               │                      │ binding       │ binding      │ fetch
         ┌─────┴──────┐        ┌──────┴─────┐   ┌─────┴─────┐  ┌─────┴──────────┐
         │ R2 bucket  │◄───────│ (R2 put /  │   │ D1        │  │ Resend, Stripe │
         │ mm-media   │        │ multipart) │   │ mm-db     │  │ (Connect)      │
         └────────────┘        └────────────┘   └───────────┘  └────────────────┘
```

### Component Responsibilities

| Component | Owns | Does NOT own | Implementation |
|---|---|---|---|
| **Carousel engine** (`lib/carousel/engine.js`) | WebGL row, lens, scroll/drag/snap, entry, focus geometry, texture cache | Data fetching, text, video playback, routing, i18n | Ported reference engine; `createCarousel(mount, { items, tier, callbacks })` |
| **Carousel host** (`components/Carousel.tsx`) | Mount/destroy engine, overlay text (title/client/counter), filter bar, Close, tier detection, no-WebGL fallback | Any per-frame math | Thin React client component (same role as reference `CarouselSection.jsx`) |
| **Focus player** (`components/FocusPlayer.tsx`) | One `<video>` element positioned over the focused panel rect; play/mute/close; poster crossfade | The panel's motion (engine does that) | DOM overlay, `playsinline`, `preload="none"` until focus |
| **Content read model** (`lib/content/*`) | Queries works/brands/creators/services by language; shape `WorkItem[]` for the engine | Writes | Plain SQL over D1 binding; called from server components |
| **Admin app** (`app/admin/*` + `app/api/admin/*`) | Works CRUD + order, uploads, poster capture, brands/creators, bookings list, blocked time, settings | Auth (Access does it) | Server routes re-verify `Cf-Access-Jwt-Assertion` with `jose` |
| **Media pipeline** (`lib/media/*`) | Key naming, R2 multipart via binding, `httpMetadata` (type, cache), aspect/duration metadata | Transcoding (Houssem exports web-ready MP4) | Worker routes + browser-side poster capture |
| **Booking service** (`lib/booking/*`) | Availability calculation, slot claim/hold/confirm/release, blocked time, booking state machine | Payment UI, email transport | D1 batch + partial unique index |
| **Payments** (`lib/payments/*`) | Checkout Session creation (destination charge), webhook verification, idempotent event log | Prices/fees (config values set by Koss) | `stripe` SDK with fetch client, `constructEventAsync` |
| **Notifier** (`lib/email/*`) | Visitor + Houssem emails per booking event, in 3 languages | Deciding when (booking service decides) | Resend REST from Worker, `ctx.waitUntil`, sent-flag in D1 |
| **i18n** (`lib/i18n/*`, `messages/{en,ar,fr}.json`) | UI strings, `dir`, locale routing, date formatting (Asia/Dubai) | DB content text (lives in D1 `*_text` tables) | Locale segment `app/[lang]/…`; no heavy i18n framework needed |

## Recommended Project Structure

```
mansourimedia/
├── app/
│   ├── [lang]/                  # en | ar | fr ; layout sets lang + dir
│   │   ├── page.tsx             # home: carousel + sections (server component reads D1)
│   │   ├── work/[slug]/page.tsx # shareable deep link to one film (OG image = poster)
│   │   ├── services/…           # if services get their own pages
│   │   └── book/page.tsx        # booking wizard (3 types)
│   ├── admin/                   # Access-protected UI (not localized; EN only)
│   │   ├── works/  bookings/  calendar/  brands/  creators/  settings/
│   └── api/
│       ├── availability/route.ts
│       ├── bookings/route.ts            # create call / shoot request / deposit hold
│       ├── checkout/route.ts            # Stripe Checkout Session for a held deposit
│       ├── stripe/webhook/route.ts      # signature-verified, idempotent
│       └── admin/                       # every handler starts with requireAccess()
│           ├── works/…  uploads/…  blocks/…  bookings/…
├── lib/
│   ├── carousel/   engine.js config.js tier.js   # framework-free; MIT notice kept
│   ├── content/    works.ts brands.ts creators.ts services.ts
│   ├── booking/    availability.ts claim.ts states.ts
│   ├── payments/   stripe.ts webhook.ts
│   ├── media/      keys.ts multipart.ts
│   ├── email/      resend.ts templates/
│   ├── auth/       access.ts                    # jose + JWKS from team domain
│   ├── i18n/       index.ts  messages/{en,ar,fr}.json
│   └── env.ts                                   # getCloudflareContext() typed bindings
├── migrations/      0001_init.sql …             # wrangler d1 migrations
├── seed/            works.local.json  media/    # local fixtures (no Behance images)
├── wrangler.jsonc   open-next.config.ts
└── CLAUDE.local.md  # live host, account, wrangler HOME, gates
```

### Structure Rationale

- **`lib/carousel/` stays framework-free.** The reference proves the engine needs only three callbacks; keep it that way so it can be unit-tested and swapped from React without touching WebGL code.
- **One Worker, not split services.** Traffic is tiny; one deploy unit keeps preview/prod parity and halves the config. Split only if the bundle passes the size limit (see Pitfalls).
- **`app/[lang]` for public, `app/admin` un-localized.** Houssem is the only admin; translating admin costs time for no user.
- **`migrations/` as the single schema source.** `wrangler d1 migrations apply` per environment; the control session applies them verbatim to prod.

## Content Model (D1)

```sql
-- language-neutral rows + per-language text rows (EN required, AR/FR may lag)
works(
  id TEXT PRIMARY KEY,            -- ulid
  slug TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('video','photo')),
  industry TEXT NOT NULL,         -- fashion|beauty_clinics|real_estate|products|ads|content
  client_brand_id TEXT REFERENCES brands(id),
  width INTEGER NOT NULL, height INTEGER NOT NULL,   -- measured at upload; aspect = w/h
  duration_s REAL,                -- video only
  video_key TEXT,                 -- R2: works/{id}/{sha8}.mp4      (video only)
  poster_key TEXT NOT NULL,       -- R2: works/{id}/{sha8}-full.webp (1080 tall)
  ring_key TEXT NOT NULL,         -- R2: works/{id}/{sha8}-ring.webp (~960 tall, carousel texture)
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
work_text(work_id TEXT, lang TEXT CHECK (lang IN ('en','ar','fr')),
          title TEXT NOT NULL, description TEXT, reviewed INTEGER DEFAULT 0,
          PRIMARY KEY (work_id, lang));

brands(id, slug, name, logo_key, logo_kind /* svg|png */, sort_order, status);
creators(id, slug, name, photo_key, handle, sort_order, status);
creator_text(creator_id, lang, caption);
services(id, slug, sort_order, deposit_enabled INTEGER DEFAULT 0, deposit_amount_minor INTEGER NULL);
service_text(service_id, lang, name, summary);
settings(key PRIMARY KEY, value);   -- working hours, slot length, whatsapp, fee bps (set by Koss)
```

- **`reviewed` flag on text rows** carries the "Claude drafts AR/FR, Houssem checks" rule into data; launch checklist = no `reviewed=0` rows on published items.
- **Width/height stored, not measured in the browser.** The reference measures aspect on texture load and re-centres; with stored aspect the engine sets `locked: true` and the row never jumps.
- **Deposit amounts and fee are nullable config, not code constants.** They stay NULL until Koss decides pricing (honesty rule); the deposit option renders only when a service has `deposit_enabled=1` and an amount (no dead control).
- **Industries are a fixed enum in code** (labels in i18n messages), not a table: six values, changes need a deploy anyway because filters are UI.

## Architectural Patterns

### Pattern 1: Data-driven engine with an explicit item contract

**What:** Remove the `PROJECTS` import from `engine.js`. The host passes items; the engine never knows about D1, languages or video.
**When:** Always; this is the core refactor of the reference.

```js
// WorkItem — the only shape the engine sees
// { id, ringSrc, aspect /* w/h */, kind: 'video'|'photo' }
const engine = createCarousel(mount, {
  items,                       // WorkItem[] (already filtered + ordered)
  tier,                        // 'desktop' | 'mobile' | 'low'  -> PANEL_H, dpr cap, samples, REPEATS
  onActiveChange(i) {},        // overlay title/client/counter (host looks up text by items[i].id)
  onFocusChange(open, info) {},// info = { id, rect: {x,y,w,h} } -> FocusPlayer positions <video>
  onEntryDone(done) {},
});
engine.setItems(nextItems);    // filter change: reuse texture cache (Map by URL), rebuild pool
engine.openFocusById(id);      // deep link /work/[slug]
engine.closeFocus(); engine.destroy();
```

**Required engine changes (from reading the code):**
1. `sources` built from `items` argument, not `PROJECTS`.
2. `REPEATS` computed: `max(3, ceil(2*W / totalWidth) + 1)`. Fixed `REPEATS = 4` leaves gaps on wide screens when a filter has 2-3 portrait films (2 × 9:16 panels at 450px ≈ 530px per loop × 4 = 2,120px < 2,560px monitor).
3. `setItems()` rebuilds `sources`, `pool`, `drop[]`, `pEntry[]`, `growArr[]`, `lastCenterX[]` (all are sized `REPEATS * sources.length` at creation today).
4. `PANEL_H` from viewport: e.g. `clamp(320, 0.58 * H, 620)` on desktop, `0.62 * H` on phones, recomputed in `onResize` + `refreshLayout()`.
5. Focus scale computed, not fixed `1.18`: `centerScale = min(0.88*H / PANEL_H, 0.92*W / panelWidth)` so a 9:16 film fills the height.
6. `onFocusChange(true, { id, rect })` emitted with the panel's final screen rect; also emit on resize while focused.
7. Texture cache is module-level (`Map<url, Texture>`) so filters do not re-download.

**Trade-off:** We diverge from upstream; keep `UPSTREAM.txt` + MIT notice and a short `CHANGES.md` listing these edits.

### Pattern 2: Focus playback as an HTML `<video>` over the canvas (not a video texture)

**What:** When focus opens, the engine scales the poster panel up and fades the lens (`lensFx → 0`). At that moment the FocusPlayer places a `<video>` exactly on the reported rect, starts loading, and crossfades in on `playing`. Close: pause, fade the video out, then call `engine.closeFocus()`.
**Why this, not `THREE.VideoTexture`:**
- The lens is already faded to zero in focus mode, so a video texture buys no visual effect.
- Native `<video>` gives controls, fullscreen, captions, audio unlock on the tap gesture, AirPlay, and iOS `playsinline` behaviour for free.
- A video texture re-uploads every frame to the GPU and keeps the two-pass shader running during playback, which drains phones.
- Range/streaming behaviour of `<video>` with R2 is native.
**Trade-off:** Two layers must stay aligned during the scale animation; solve by starting the crossfade only after the focus timeline completes (`onFocusChange` fires at start; add an `onFocusSettled` or delay by `FOCUS.focusDuration`).

### Pattern 3: Device tiers decided once, in the host

| Tier | Trigger | Settings |
|---|---|---|
| desktop | `(pointer:fine)` and width ≥ 1025 | reference values, dpr ≤ 2, 16 samples |
| mobile | `(pointer:coarse)` or width < 1025 | dpr ≤ 1.5, dispersion samples 6-8, `antialias:false`, no lil-gui, posters ≤ 960px tall |
| low / no-GL | WebGL context fails, `prefers-reduced-motion`, or `navigator.connection.saveData` | DOM fallback: horizontal CSS scroll-snap list of posters using the same items + same FocusPlayer |

The DOM fallback doubles as the crawlable/accessible representation of the works list (render it server-side, hide it visually when GL boots).

**Mobile scroll conflict (verified in code):** the engine sets `touch-action: none` on the canvas. If the home page has sections below the carousel, a vertical swipe on the canvas will not scroll the page. Use `touch-action: pan-y` and lock the gesture to horizontal only after the first ~8px show horizontal intent.

### Pattern 4: Slot claim via D1 batch + partial unique index (no Durable Object)

**What:** Every time-consuming booking writes a `slot_claims` row. Uniqueness of live claims is enforced by the database, not by a read-then-write check.

```sql
slot_claims(
  id TEXT PRIMARY KEY, booking_id TEXT NOT NULL REFERENCES bookings(id),
  slot_start TEXT NOT NULL,              -- UTC ISO, aligned to the slot grid
  state TEXT NOT NULL CHECK (state IN ('held','confirmed','released')),
  hold_expires_at TEXT                   -- set for 'held'
);
CREATE UNIQUE INDEX one_live_claim ON slot_claims(slot_start) WHERE state IN ('held','confirmed');
```

```ts
// one atomic, sequential batch (D1 batch = SQL transaction, rolls back on any failure)
await db.batch([
  db.prepare(`UPDATE slot_claims SET state='released'
              WHERE state='held' AND hold_expires_at < ?`).bind(now),
  db.prepare(`INSERT INTO bookings (...) VALUES (...)`).bind(...),
  db.prepare(`INSERT INTO slot_claims (id, booking_id, slot_start, state, hold_expires_at)
              SELECT ?, ?, ?, ?, ?
              WHERE NOT EXISTS (SELECT 1 FROM blocks WHERE ? < ends_at AND ? > starts_at)`)
    .bind(...),
]);
// UNIQUE violation -> 409 "slot just taken"; 0 rows inserted -> 409 "blocked"
```

**Why not a Durable Object:** D1 serializes writes per database and `batch()` is a transaction, so the unique index already makes double booking impossible. A DO adds a second storage system, a second binding and a second migration story for zero extra safety at this volume. Revisit only if multiple calendars/resources with complex rules appear.
**Grid rule:** claims must be on a fixed grid (e.g. 30-min call slots; shoot = whole day key `YYYY-MM-DDT00:00Z` in a separate `kind`) so equality uniqueness equals overlap prevention. If two kinds can collide (shoot day vs calls that day), the availability query must exclude calls on shoot days and the insert's `NOT EXISTS` must check the other kind too.

### Pattern 5: Booking state machine, webhook-confirmed

```
discovery call : requested ─(claim ok)→ confirmed ─→ (cancelled by admin)
shoot request  : requested (no claim; optional soft check vs blocked days) → quoted/closed by admin
deposit        : held (claim held, TTL) ─checkout.session.completed + paid→ confirmed
                     │                  └ checkout.session.async_payment_succeeded → confirmed
                     ├ checkout.session.expired / hold TTL passed → released
                     └ paid after release and slot re-taken → 'needs_attention' (admin refunds)
```

- Hold TTL = Checkout Session `expires_at` (Stripe minimum is 30 min) + a few minutes; one cron trigger every 5-10 min also releases stale holds and is the safety net if `expired` webhooks are missed.
- Success page shows "payment received, confirming…" and polls `/api/bookings/:id` — confirmation comes only from the webhook.
- Webhook idempotency: `stripe_events(id PRIMARY KEY)`; `INSERT OR IGNORE` first in the batch; skip processing if 0 rows changed.

## Data Flow

### 1. Home page render (read path)

```
GET /ar  → Worker (Next server component)
        → D1: SELECT works ⋈ work_text(lang='ar', fallback 'en') WHERE status='published' ORDER BY sort_order
        → HTML with inline JSON {items, texts} + server-rendered DOM fallback list
Browser → host detects tier → createCarousel(items) → TextureLoader GET media.mansourimedia.com/…-ring.webp
        (CORS: bucket allows GET from site origins; textures need crossOrigin='anonymous')
Filter click → host filters items client-side → engine.setItems() (no network if cached)
Panel click → engine centres + focuses → onFocusChange(true,{id,rect})
        → FocusPlayer <video src=media…/x.mp4 poster=…-full.webp> → R2 serves 206 Range responses via CDN
```

Data flows one way: **D1 → server render → host → engine**. The engine never calls back into data; it only reports indices/ids.

**Freshness:** v1 renders per request (one indexed D1 query, milliseconds). Add OpenNext ISR/tag revalidation only if CPU or latency demands it; avoids a cache-invalidation step in the admin publish flow during the 2-week build.

### 2. Admin upload (write path)

```
/admin/works/new (Access OTP already passed at the edge)
 1. Pick MP4 → browser reads width/height/duration from a <video> element;
    checks first bytes for 'moov' before 'mdat' (fast-start) and warns if not
 2. Houssem scrubs to a frame → canvas → two WebP blobs (full ~1080 tall, ring ~960 tall)
 3. POST /api/admin/uploads (create)      → Worker: env.MEDIA.createMultipartUpload(key, {httpMetadata})
    PUT  /api/admin/uploads/:id/part/:n   → 10 MB chunks → uploadPart()   (each < 100 MB body limit)
    POST /api/admin/uploads/:id/complete  → complete(parts)
    PUT  posters (small, single put)
 4. POST /api/admin/works {meta, keys, texts}  → D1 insert (status='draft')
 5. Publish toggle → status='published' → visible on next page render
```

- Keys are content-addressed (`works/{id}/{sha8}.mp4`), so every object is set with `Cache-Control: public, max-age=31536000, immutable`; replacing a film writes a new key, no purge needed.
- Multipart through the **R2 binding** avoids issuing an R2 S3 API token and presigned URLs (presigned URLs do not work on custom domains and need bucket CORS for PUT anyway). Cost: chunks transit the Worker; fine at this volume.
- Uncompleted multipart uploads auto-abort after 7 days; admin also calls `abort()` on cancel.

### 3. Booking + deposit (write path)

```
/book → GET /api/availability?type=call&from=…&to=…
          D1: settings.hours − blocks − live claims  → free slots (Asia/Dubai display, UTC storage)
      → POST /api/bookings {type, slot, contact, lang, turnstile}
          D1 batch (Pattern 4) → 201 | 409
          ctx.waitUntil(Resend: visitor email in booking.lang + Houssem email) → set emailed_at
      deposit only:
      → POST /api/checkout {bookingId}
          Stripe Checkout Session: mode=payment, amount from services.deposit_amount_minor,
          payment_intent_data.application_fee_amount (from settings, set by Koss),
          payment_intent_data.transfer_data.destination = Houssem's acct_…,
          metadata.booking_id, expires_at = now+30min
      → redirect to Stripe → back to /book/done?session_id=… (polls status)
Stripe → POST /api/stripe/webhook (raw body, constructEventAsync + SubtleCrypto)
          D1 batch: INSERT OR IGNORE stripe_events; UPDATE claim→confirmed, booking→confirmed
          waitUntil(Resend confirmations)
```

### 4. Admin auth

```
Browser → mansourimedia.com/admin  → Cloudflare Access (email OTP to Houssem's Gmail, Koss) → Worker
Worker  → requireAccess(): verify Cf-Access-Jwt-Assertion with jose against
          https://<team>.cloudflareaccess.com/cdn-cgi/access/certs, aud = POLICY_AUD → else 403
```

Access protects paths `/admin*` and `/api/admin*` as one self-hosted application. The in-Worker check is mandatory, not optional: `*.workers.dev` and preview-version URLs reach the Worker without passing Access unless disabled.

## Environments

| | Local | Preview | Production |
|---|---|---|---|
| Account | none (Miniflare) | Houssem's account | Houssem's account |
| Wrangler login | n/a | `HOME=/Users/koss/.mansouri-cloudflare` (own login, like ALMAR; never the default Vamos login) | same |
| Worker | `next dev` with `initOpenNextCloudflareForDev()`; `wrangler dev` for the built bundle | `mansourimedia-preview` on `preview.mansourimedia.com` | `mansourimedia` on `mansourimedia.com` |
| D1 | `.wrangler/state` local, migrations + seed | `mm-db-preview` | `mm-db` |
| R2 | local bucket, seeded fixtures | `mm-media-preview` + `media-preview.` domain | `mm-media` + `media.mansourimedia.com` |
| Access | bypass only when `ENV==='local'`; prod code path fails closed if `POLICY_AUD` is missing | whole hostname behind Access (not public) | `/admin*`, `/api/admin*` |
| Stripe | test keys, `stripe listen --forward-to localhost/...` | test keys, test connected account | live keys, Houssem's live Express account |
| Resend | test key / log-only transport | real sends to Koss only | real |
| workers.dev / preview URLs | n/a | disabled | disabled |

`wrangler.jsonc` uses `env.preview` / `env.production` blocks; secrets via `wrangler secret put` typed in Koss's terminal (never in chat or files).

## Scaling Considerations

| Scale | Adjustments |
|---|---|
| Launch (hundreds of visits/day) | Everything above. One Worker, one D1, R2 + CDN. |
| A viral Instagram spike (10k+/day) | Media is already CDN-cached immutable; the only per-visit Worker cost is SSR + one D1 read. Add page caching (ISR / Cache API keyed by lang) if CPU time climbs. |
| Poor mobile networks in GCC | First bottleneck is MP4 weight, not servers. Ship a 720p rendition (`video_720_key`) chosen by tier before considering Stream/HLS. |

### Scaling Priorities

1. **First bottleneck:** GPU memory/thermal on phones (dozens of large textures + 16-sample shader). Fixed by ring-sized posters and the mobile tier, not by servers.
2. **Second bottleneck:** film size on cellular. Fixed by a lighter rendition, then Stream if still poor (already listed as the revisit trigger in PROJECT.md).

## Anti-Patterns

### Anti-Pattern 1: Read-then-insert availability check
**What people do:** `SELECT` to see if a slot is free, then `INSERT`.
**Why it's wrong:** Two visitors racing both see "free". Also stale holds block slots forever.
**Do this instead:** Partial unique index + release-expired + insert in one `batch()`; treat the constraint error as the "taken" signal.

### Anti-Pattern 2: Confirming a deposit on the success redirect
**What people do:** Mark the booking paid when the visitor lands on `success_url`.
**Why it's wrong:** The URL can be opened without paying; the visitor can close the tab before landing.
**Do this instead:** Only the verified webhook confirms; the success page polls.

### Anti-Pattern 3: Serving video through the Worker
**What people do:** `/media/*` Worker route that does `MEDIA.get()` with range parsing.
**Why it's wrong:** Every range chunk becomes a billable Worker invocation and CPU; you re-implement Range/ETag/304 by hand.
**Do this instead:** R2 custom domain (CDN + native Range); Worker only for admin writes.

### Anti-Pattern 4: Full-resolution posters as carousel textures
**What people do:** Use the 1080×1920 poster for the ring.
**Why it's wrong:** ~11 MB of GPU memory each with mipmaps; 30 films ≈ 330 MB → iOS Safari context loss.
**Do this instead:** Separate ring poster (~540-960px tall depending on tier).

### Anti-Pattern 5: Hard-coding pricing or fee in code
**Why it's wrong:** Pricing is open; Koss decides. A constant invites inventing a number.
**Do this instead:** Nullable settings/service columns; deposit option hidden until set (and until Houssem's connected account is `charges_enabled`).

### Anti-Pattern 6: Trusting Access alone
**Why it's wrong:** Alternate hostnames (workers.dev, version preview URLs) bypass it.
**Do this instead:** Disable them and verify the JWT in every admin handler.

## Integration Points

### External Services

| Service | Pattern | Notes |
|---|---|---|
| Stripe Connect | Destination charge via Checkout (`application_fee_amount`, `transfer_data.destination`); webhook on the platform account | Platform (Koss) is debited for refunds and disputes by default; refunds should use `reverse_transfer=true`. Use `Stripe.createFetchHttpClient()` and `constructEventAsync`. Houssem's Express onboarding link generated from admin. |
| Resend | REST `fetch` from Worker inside `waitUntil` | Verified sending domain on mansourimedia.com (DNS in Houssem's zone). Store `emailed_at` to avoid double sends on webhook retries. |
| Cloudflare Access | Self-hosted app on paths; JWT verified with `jose` | Team domain + AUD as non-secret vars. |
| Turnstile | Token on booking POST | Cheap spam guard on a public form that sends email. |
| WhatsApp | `https://wa.me/971505085753?text=…` link (localized prefill) | No API integration. |

### Internal Boundaries

| Boundary | Communication | Notes |
|---|---|---|
| Host ↔ engine | Function call in, 3-4 callbacks out | Engine gets `WorkItem[]` only; no text, no language |
| Host ↔ FocusPlayer | Props `{work, rect, open}` | Player owns `<video>` lifecycle; pauses on close and on `visibilitychange` |
| Pages ↔ content | Server-side function calls over D1 binding | No public "works API" needed in v1 |
| Booking API ↔ payments | Booking creates hold; payments reads booking by id; webhook calls `booking.confirm(id)` | Payments never writes claims directly |
| Booking ↔ email | `notify(event, booking)` after commit | Email failure never rolls back a booking |

## Suggested Build Order (2-week v1, target ~2026-10-17)

Dependencies drive the order; the carousel is the riskiest and the most visible, so it starts day 1 on local fixtures and never waits for cloud accounts.

| # | Phase | Days | Depends on | Delivers |
|---|---|---|---|---|
| 0 | **Foundation** | 1-2 | Houssem's Cloudflare account for deploy (local work can start without it) | Next 16 + OpenNext scaffold, `wrangler.jsonc` envs, D1 schema migration 0001, R2 buckets + CORS + media custom domain, Access app, preview deploy behind Access, separate wrangler HOME |
| 1 | **Carousel + focus video** | 2-5 | 0 (local only) | Engine refactor (items, REPEATS, PANEL_H, focus scale, setItems, rect callback), brand recolour, tier system + DOM fallback, FocusPlayer, filters — on seed JSON with real exported films |
| 2 | **Content + admin media** | 3-6 (parallel with 1) | 0 | Access JWT guard, multipart upload, poster capture, works CRUD/order/publish, brands/creators upload; home switches from seed JSON to D1 |
| 3 | **Site sections + i18n** | 5-8 | 1; layout sketches signed for brands/creators | `[lang]` routing, RTL, services, industries, brands, creators, CTAs, WhatsApp, work deep links + OG |
| 4 | **Booking core** | 6-10 | 0, 2 (admin shell) | Availability, call booking with claims, shoot request, blocked time in admin, bookings list, Resend emails EN/AR/FR, Turnstile, cron sweep |
| 5 | **Deposit (Stripe Connect)** | 9-12, test mode | 4; **gated:** pricing + fee from Koss, Houssem's agreement, his Express account | Checkout destination charge, webhook confirm, hold/expiry, refunds note in admin. Ships hidden if gates not met (no fake control) |
| 6 | **Launch** | 12-14 | all | Domain on Houssem's account, prod D1/R2/secrets, Resend domain, UAT on phones (iOS Safari + Android Chrome), Lighthouse/GPU check, Houssem reviews AR/FR (`reviewed=1`) |

**Ordering rationale:**
- Phase 1 first because it carries the most unknowns (engine edits, iOS GPU limits, video overlay alignment) and is the Core Value surface.
- Phase 2 parallel: it only shares the `WorkItem` contract with Phase 1; agree that shape on day 1.
- Booking before deposit: deposit reuses the claim/hold machinery and the email path.
- Deposit is the only phase blocked by people (pricing, fee agreement, Stripe onboarding); building it last in test mode lets v1 ship with call + shoot request even if the gates are still open.

**Research flags:**
- Phase 1: needs a spike on real iPhone hardware (texture budget, lens samples, `<video>` autoplay with sound after tap, touch-action vertical scroll).
- Phase 5: needs a check of Stripe Connect availability/capabilities for a UAE platform + UAE Express account and whether `on_behalf_of` is wanted (whose name appears on the card statement).
- Phase 0: confirm Houssem's Workers plan. Workers Free has a 10 ms CPU limit per request and a 3 MiB compressed bundle limit; a Next.js SSR bundle is likely to exceed one or both. Workers Paid has 10 MiB and 30 s default CPU. This is a cost decision for Koss/Houssem, not to be assumed.
- Phases 3, 4: standard patterns, low research need.

## Open Questions (do not invent; route to discuss)

1. What a deposit reserves: a call slot, a shoot day, or nothing (just money against a quote)? This decides whether deposits use `slot_claims` at all.
2. Slot grid and working hours for discovery calls (length, days, buffer).
3. Can a shoot day and a call collide (single calendar for Houssem) or are they separate resources?
4. Is the deposit refundable, and who absorbs refunds/disputes given that destination charges debit the platform (Koss) by default?

## Sources

- Reference code read directly: `_reference/liquid-glass-carousel/lib/carousel/engine.js`, `config.js`, `Components/CarouselSection.jsx`, `HOW-IT-WORKS.md` (HIGH)
- D1 batch is a transaction, sequential, rolls back on failure: https://developers.cloudflare.com/d1/worker-api/d1-database/ (HIGH)
- R2 Workers API (range on `get`, multipart, 7-day auto-abort, `writeHttpMetadata`, `httpEtag`): https://developers.cloudflare.com/r2/api/workers/workers-api-reference/ (HIGH)
- R2 presigned URLs do not work on custom domains; need CORS: https://developers.cloudflare.com/r2/api/s3/presigned-urls/ (HIGH)
- Workers limits (100 MB body Free/Pro, 10 ms CPU Free, 30 s default Paid): https://developers.cloudflare.com/workers/platform/limits/ (HIGH)
- Access JWT validation in Workers (`cf-access-jwt-assertion`, certs URL, AUD, `jose`): https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/ (HIGH)
- OpenNext Cloudflare (Next 16 supported, 3 MiB Free / 10 MiB Paid bundle limit): https://opennext.js.org/cloudflare ; latest release 1.20.8 (2026-10-02): https://github.com/opennextjs/opennextjs-cloudflare/releases (HIGH)
- Stripe destination charges with Checkout, application fee, `on_behalf_of`, webhook events, refunds/disputes debit platform: https://docs.stripe.com/connect/destination-charges.md?platform=web&ui=stripe-hosted (HIGH)
- Stripe on Workers needs `constructEventAsync` + SubtleCrypto provider: https://blog.cloudflare.com/announcing-stripe-support-in-workers , https://jross.me/verifying-stripe-webhook-signatures-cloudflare-workers/ (MEDIUM)
- Partial unique index semantics: SQLite (D1 is SQLite) supports `CREATE UNIQUE INDEX … WHERE` (training knowledge, standard SQLite; MEDIUM, verify in the Phase 4 test)
- GPU memory estimate for 1080×1920 RGBA + mipmaps ≈ 11 MB: arithmetic (MEDIUM)

---
*Architecture research for: WebGL video portfolio + booking on Cloudflare*
*Researched: 2026-10-03*
