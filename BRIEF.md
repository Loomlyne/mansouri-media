# Mansouri Media — project brief

Input for `/gsd-new-project`. Decisions are Koss's answers of 2026-10-03; open items are marked OPEN.

## Who

- Client: **Houssem Mansouri** (spelling from his CV and Drive; the folder name "Houssam Mansory" is not his spelling). Filmmaker / content creator, Dubai. Founder of **Mansouri Media**.
- Site is the **agency, Mansouri Media**, with Houssem as founder/director.
- Contact (from CV, approved): WhatsApp +971 50 50 8 5753, houssemansouri96@gmail.com. Booking emails go there.
- Slogan (his doc): "WE MAKE YOUR VIDEOS REMEMBERED."
- Two CTAs from his doc: 1. Start your project (booking) 2. WhatsApp us.

## Base

- Carousel: https://github.com/Yousuf-developer/liquid-glass-carousel @ `6d770c9`, MIT (Yousuf Soomro) — keep the licence notice. Copy in `_reference/liquid-glass-carousel/` without the demo images (Behance, not licensed) and the font (Lay Grotesk, Due Studio, paid — not used).
- Stack in the reference: Next.js 16 (App Router), React 19, three.js 0.184, GSAP 3.15, lil-gui, Tailwind 4. Engine is framework-free (`lib/carousel/engine.js`, 1,255 lines); all tunables in `config.js`.

## Decisions

| Area | Decision |
|---|---|
| Work shown | Video, editing and photography; **most work is vertical 9:16 Instagram video** — every surface must show vertical work well (panels keep natural aspect; focus view plays 9:16 full-height) |
| Carousel panels | Poster stills in the ring; clicking opens focus view and the film plays |
| Mobile | Full mobile version: lighter touch carousel with same look + full booking (original blocks <1025px — must change) |
| Font | Free open-licence grotesk close to Lay Grotesk (candidates: Host Grotesk, Inter Tight, Geist); must also cover Arabic + French |
| Colours | Original white canvas; text in his plum; his gold as the single accent; glass ring tinted gold instead of blue |
| Languages | English + Arabic (RTL) + French. Claude drafts AR/FR, Houssem checks before launch |
| Services | All six from his doc: ads management · social media · scriptwriting, filming & editing · web & app development (delivered by Koss via Mansouri Media) · PR · influencers |
| Filters | By industry, matching his Vimeo folders: All / Fashion / Beauty & clinics / Real estate / Products / Ads / Content (his list also names studio production, perfumes) |
| Brand logos | 33 client logos in Drive. Placement: explore several directions (sketch) |
| Influencers | 21 creators in Drive (incl. Mbappé, Pogba, Hakimi, Kamaru Usman, Katia Aveiro, Anthony Anderson, Kevin Levrone). **Use the Drive photos as given** (Koss's call). Placement: explore several directions (sketch) |
| Results numbers | 40+ brands, 400M+ impressions, 3x ROI, 0→1M followers: shown **only with proof** from Houssem; section stays out until then |
| Booking | Visitor picks any of three: free discovery call · shoot date request (service + date + location → he quotes) · paid deposit |
| Booking store | Cloudflare D1 + Resend (not Notion). Flow modelled on Koussay-Portfolio's `/booking` |
| Payments | Houssem's own Stripe account, payout to his bank, no Connect, no commission (changed after research 2026-10-03) |
| Workers plan | Free for now, Paid later |
| Resend | Koss's account |
| Logo heading | "Brands I've filmed for" |
| Video hosting | R2: MP4 1080×1920 H.264 + poster frame per film, Houssem exports web-ready |
| Uploads | Private `/admin`: upload video/photo → R2, set title/client/industry; bookings + blocked time also there |
| Admin login | Cloudflare Access, one-time email code to his Gmail |
| Hosting | **Houssem's own Cloudflare account** (own wrangler login, like ALMAR — never the default Vamos login) |
| Domain | `mansourimedia.com` — free per whois 2026-10-03; he buys it in his Cloudflare (Registrar) |
| Deadline | First version within 2 weeks (by ~2026-10-17), then iterate |

## OPEN (do not invent)

1. Deposit amounts, which services take a deposit, Koss's commission % — pricing discussion with Koss first.
2. Houssem's agreement to the platform fee.
3. Proof for the results numbers.
4. Logo and influencer section layout — explore directions.
5. Which Vimeo films go in v1, and the originals (Vimeo downloads need his account or his exported files).
6. Logos are mostly low-res JPG/PNG — clean versions (SVG) to source.
7. Bio, "why Mansouri Media", testimonials, client stories — none yet.
8. Houssem's Cloudflare account + Stripe account creation (his steps).

## Source material

- Drive "mansouri media" (owner houssemansouri96@gmail.com): https://drive.google.com/drive/folders/1IUyh36Sxkr2INbcpIQ7woEQ8nwwNx3RB — downloaded to `_source/` (gitignored): `brands/` 34 files, `influencers/` 21, `logo/` 2, `steps.txt`, `resume.png`.
- Vimeo user 110194767 ("houssem mansouri — Visual Effects Producer, Director & Cinematographer"):
  - Content https://vimeo.com/showcase/8833498
  - Clinics & beauty https://vimeo.com/user/110194767/folder/30496466
  - Fashion https://vimeo.com/showcase/10807770
  - Products https://vimeo.com/user/110194767/folder/30496627
  - Ads https://vimeo.com/user/110194767/folder/18587467
- Industries (his doc): fashion, real estate, cosmetics, content, studio production, clinics, perfumes.
- CV: Senior Videographer/Editor at DMT Abu Dhabi (via Kizmet, 2025–), Content Creator/SMM at Visioneers (2022–25), Alfan Group, NDI. BA 2D/3D animation, ESAD Tunis.

## Design inventory (from the reference + his logo)

**Brand colours (sampled from `logo.png`)**: gold `#C48C3C` · plum `#251B26` (logo bg centre) → `#0E070F` (vignette edge) · white `#FFFFFF`.
**Logo**: lowercase geometric "mansouri" wordmark, spaced caps "MEDIA", gold square above the i.

**Reference look**: white page + `renderer.setClearColor(0xffffff)`, panel placeholder `#dddddd`, text black / white with `mix-blend-exclusion`, single font, sizes `text-sm`/`text-base` only. Overlay: brand+desc top 15%, `01/12` counter bottom 15%, trailing "View"/"Drag" cursor label, "Close" top-right (2vh / 4vw).

**Layout + scroll (`CONFIG`)**: panel height 450px, gap 12, EASE .09, WHEEL 1.4, DRAG 1.6, FRICTION .865, snap after 120ms idle with SNAP_EASE .05, speed shrink up to 25% at 60px/frame.
**Touch (`INTERACT`)**: 1:1 drag, TOUCH_EASE .22, tap slop 12px (mouse 6px).
**Lens (`LENS`)**: ellipse rotated 65°, sizeX .565 / sizeY 1 of viewport height, dispersion 11 (16 samples), glow 4.2, white nova .24, ring radius .49 width .014 colour `#009dff` (→ gold), shimmer 12 waves at 3.5 speed, white rim line 1.4 at .488.
**Motion vocabulary**: GSAP eases power2/3/4.out, expo.inOut. Focus: others drop 1.4vh center-out (0.7s, stagger .06), main card ×1.18 (0.9s), lens fades .85s. Entry: rise from below at 80px (1.0s, stagger .07) → grow to full (2.15s expo.inOut, edges first) → lens bloom 1.4s. UI text: 0.4s power3.out; reveal 1.6s with .18 stagger.
