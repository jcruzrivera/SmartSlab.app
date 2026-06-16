# SmartSlab

SmartSlab is a Next.js 16 full-stack marketplace and inventory platform for
natural stone slabs and remnants. Vendors publish their inventory with photos,
buyers browse and pay securely, and the platform keeps a commission on every
sale.

## Stack

- Next.js 16 App Router + TypeScript (strict mode)
- Tailwind CSS v4
- Clerk authentication with role-aware onboarding
- Neon Postgres + Drizzle ORM
- Stripe Connect (Express) for marketplace payments and payouts
- Vercel Blob for image storage
- React Query + Zustand foundation

## Main features

- Public marketplace: product-focused homepage, an advanced browse/search
  experience (text search, multi-filters, faceted counts, shareable URLs, and
  distance-based geolocation), and detailed slab pages.
- Vendor tools: create, edit, hide/unhide and delete listings, manage inventory,
  upload photos (camera or gallery), and track sales and earnings.
- Buyer tools: account profile, purchase history, and secure checkout.
- Privacy by design: a vendor's exact address and phone are only revealed to a
  buyer after payment is processed, so the platform is never bypassed.
- Mobile-friendly navigation (hamburger menu) and a global footer.

---

## Changelog (in plain language)

Versions are listed newest first. Each entry maps to a release commit.

### Search · Phase 3 — Geolocation, distance and richer tags (unreleased)

Made the marketplace location-aware and added two new ways to describe a slab.

- **Buyer geolocation.** On `/browse` the app figures out roughly where the
  buyer is — first from an approximate IP location (Vercel edge headers via the
  new `/api/geo` endpoint), then, if the buyer allows it, from precise browser
  location. A friendly banner explains the choice ("Use my location" / "Keep
  {city}"). Coordinates are kept only in the browser (localStorage + memory),
  never written to the URL or sent to our servers.
- **Distance everywhere.** Slab cards show "12 mi away" when location is known
  (and fall back to "City, State" otherwise). A new **Distance** filter (25 / 50
  / 100 / 250 mi / Any) appears only once a location is available, and a new
  **Nearest first** sort orders results by proximity. Distance math runs in the
  browser using the Haversine formula.
- **Slab coordinates.** When a vendor saves a listing, the public
  city/state/ZIP is geocoded to coordinates (free OpenStreetMap Nominatim) and
  stored on the slab, so it can appear in nearby searches. The exact address
  stays private as before.
- **Room / application and Aesthetic.** Listings can now be tagged with where
  they fit (Kitchen, Bathroom, Vanity, Bar, Outdoor, Flooring, Wall, Fireplace,
  Island) and how they look (Veined, Subtle, Solid, Sparkling, Speckled,
  Concrete, Wood, Bookmatched). Both are editable in the upload/edit form and
  are filterable in the sidebar with live counts.
- **Database.** Added `lat`, `lng`, `room_use` and `aesthetic_tags` to the
  `slabs` table (additive, nullable migration `0002`). Existing listings keep
  working; they gain coordinates the next time they are saved.

> Note: the original spec referenced Next.js's old `request.geo`, which no
> longer exists in Next.js 16. The IP fallback uses Vercel's `x-vercel-ip-*`
> headers instead.

### Search · Phase 2 — Advanced search and filters (`3aa9802`)

Replaced the simple material tabs on `/browse` with a full search module while
keeping the page server-rendered and every search shareable via its URL.

- **Search bar** with keyboard-navigable autocomplete (debounced) and a clear
  button; searches across name, color, brand, material and notes.
- **Filter sidebar**: material, slab type, color swatches, finish, thickness
  (in cm), brand/supplier, price range, minimum square footage, availability
  and negotiable-only — all combinable and reflected in the URL.
- **Faceted counts** next to each option (e.g. "Quartz (5)"), active filter
  **chips** with one-click removal, a **sort** dropdown, a **mobile filter
  sheet**, and a loading skeleton.
- **Thickness in centimeters.** Slab thickness now uses cm (the regional
  standard) across the form and listing displays, while width and height stay in
  inches.

### Edit listings (`63bc847`)

Vendors can now fully manage a listing after creating it: add or remove photos,
update any field (dimensions, price, location, notes), **hide** a listing from
the marketplace or **publish** it again, and **delete** it. Deletion is blocked
for listings that are already sold or have a checkout in progress. A new "Edit"
action was added to the inventory table.

### Mobile navigation and footer (`c1b2b55`)

Added a hamburger menu for easy navigation on phones (Home, Browse, Sell a slab,
Dashboard, Payments, and account links) and a site-wide footer with marketplace,
category, and account links.

### Payments with Stripe Connect (`74032f0`)

Introduced the full payment flow:

- Vendors connect a Stripe Express account from **Dashboard → Payments** and see
  their payout status (not started / pending / active).
- Buyers pay through Stripe Checkout. The platform automatically keeps its
  commission (`PLATFORM_FEE_PERCENT`, default 10%) and the rest goes to the
  vendor.
- A Stripe webhook marks the order as paid, which reserves the slab and unlocks
  the vendor's contact details for that buyer.

### Public location and private contact (`40cd1ee`)

Listings now show a public location (city, state, ZIP), while the vendor's exact
address, phone and email stay private. Those details are only revealed to a
buyer once they have a paid transaction for that slab.

### Clearer upload errors (`261b0a4`)

When image storage is not configured yet, the upload box shows a friendly
message and invites the user to paste an image URL instead of failing silently.

### Inches and total square footage (`6925679`)

Slab dimensions are captured and displayed in inches. The form shows a live
"Total Sqft" value (width × height ÷ 144), and the same area appears on slab
cards and detail pages. Price per square foot is computed with the correct
inch-based formula. Photos can be captured directly from the device camera or
chosen from the gallery.

### Image uploads (`a3db0bf`)

Vendors can attach up to six photos per slab using Vercel Blob, with a cover
photo, previews, removal, and an image-URL fallback.

### Onboarding loop fix (`a283d32`)

Fixed an issue where new users were stuck bouncing back to the onboarding page.
The middleware now only checks that a user is signed in, and role checks happen
on the server pages using the database. This removed the dependency on a
customized Clerk session token.

### Database setup (`770a8a2`)

Added the initial database migration plus helper scripts (`db:setup`,
`db:init`) to enable the `pgvector` extension and create all tables on Neon.

### Functional marketplace MVP (`e44e1d4`)

Turned the project from a skeleton into a working marketplace: real browse page
with material filters, real slab detail pages, a vendor dashboard, a
create-listing form with a server action, and a product-focused homepage. Added
a resilient database layer and query helpers.

### Production hardening (`b925ff6`, `c91f187`, `33f0b8c`)

Made the app resilient to missing or invalid environment variables so the
production deployment never crashes globally. Clerk is loaded conditionally and
the middleware "fails open" if configuration is incomplete.

### Auth and onboarding foundation (`5b5bf12`)

Shipped Clerk sign-in/sign-up, role onboarding (buyer / vendor / both), the
onboarding API endpoint, and the Clerk webhook that syncs users into Neon.

### Project bootstrap (`b8b1517`)

Initial SmartSlab Next.js foundation: app shell, base routes, brand defaults,
Drizzle schema for core entities, and the Neon database client.

---

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file and fill in the values:

```bash
Copy-Item .env.example .env.local
```

Required for core features:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — authentication
- `DATABASE_URL` — Neon Postgres connection string
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob (image uploads)
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_WEBHOOK_SECRET` — payments
- `NEXT_PUBLIC_APP_URL`, `PLATFORM_FEE_PERCENT`

3. Set up the database (enables `pgvector` and creates tables):

```bash
npm run db:init
```

4. Run the development server:

```bash
npm run dev
```

> Note: environment variables are read at server start. After editing
> `.env.local`, **restart `npm run dev`** so new values (like Stripe or Blob
> tokens) take effect. In production, add the same variables in Vercel and
> **redeploy**.

## Database scripts

- `npm run db:generate` — generate a migration from the schema
- `npm run db:migrate` (via Drizzle) — apply migrations
- `npm run db:setup` — enable the `pgvector` extension
- `npm run db:init` — setup + push the schema
- `npm run db:studio` — open Drizzle Studio

## Payments setup (Stripe Connect)

1. In Stripe, enable **Connect** (test mode to start).
2. Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Create a webhook endpoint pointing to `/api/webhooks/stripe` for the
   `checkout.session.completed` and `account.updated` events, then set
   `STRIPE_WEBHOOK_SECRET`.
4. Vendors connect their account from **Dashboard → Payments**.

## Notes

- Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`. This repo uses
  `proxy.ts`.
- You can verify image-upload configuration by visiting `/api/upload` in the
  browser; it reports whether the Blob token is loaded and whether your session
  is recognized (without exposing the token).
