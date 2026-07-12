# SmartSlab

SmartSlab is a Next.js 16 full-stack **B2B** marketplace and inventory platform for
natural stone slabs and remnants. Vendors publish inventory with photos; fabricators,
designers, and contractors browse live listings; the platform handles leads,
checkout, and vendor operations.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS v4
- Clerk authentication
- Neon Postgres + Drizzle ORM
- Stripe Connect
- Vercel Blob
- React Query + Zustand

## Core product areas

- Public marketplace: homepage, browse, slab detail, compare, SEO sitemap, and robots.
- Vendor workflow: create, edit, duplicate, hide, import, sell, receive quote leads, and reply to messages.
- Buyer workflow: browse inventory, save favorites, compare slabs, request quotes, purchase slabs, and review account history (trade accounts — fabricators, designers, contractors).
- Admin workflow: review vendors, listings, quote requests, orders, and edit listings from an admin panel.

---

## Version status

### Brand icons (favicon / PWA / header)

Master mark: `public/brand/smartslab-mark.svg` (S/ on brand gradient).
Regenerate favicon, apple-touch (180), and PWA icons with:

```bash
npm run brand:icons
```

Outputs: `app/favicon.ico`, `app/apple-icon.png`, `app/icon.png`,
`public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`.
Header/footer use the vector `SmartSlabLogo` component for retina clarity.

---

### SmartFinder AI piece extraction (current working version)

SmartFinder can now read a project drawing and pre-fill the "Define your pieces"
step automatically, instead of forcing manual entry.

#### What was added

- **File upload + AI extraction** — the SmartFinder step 1 accepts **PDF, DXF,
  and images (JPG/PNG/WebP)**. The file is analyzed by vision AI, which returns
  the list of stone pieces (`label`, `widthIn`, `heightIn`, converted to inches)
  and pre-fills step 2 for the user to review and adjust.
  - Images/PDF go through vision (Anthropic reads PDF natively; OpenAI PDFs use
    the Responses API). DXF is parsed as text.
- **New files**
  - `lib/ai/piece-extraction.ts` — provider-agnostic extraction (OpenAI +
    Anthropic), JSON parsing, unit conversion, validation (max 20 pieces,
    1–600 in).
  - `app/api/smartfinder/extract-pieces/route.ts` — `POST` (multipart, auth,
    12 MB limit, type detection) returns pieces; `GET` reports whether AI is
    configured.
- **Reworked** `components/smartfinder/upload-step.tsx` (drop zone, extract
  button, loading/error states, privacy note) and wired
  `smartfinder-flow.tsx` / `piece-editor.tsx` (auto-fill notice prompting
  review).
- **Graceful degradation** — with no AI key, step 1 falls back to the original
  local reference-photo behavior and manual entry; nothing breaks.

#### Configuration

Requires `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY` (already set in the Vercel
project). For local testing, add one to `.env.local` and restart the dev server.
Optional model overrides: `ANTHROPIC_VISION_MODEL`, `OPENAI_VISION_MODEL`.

#### Privacy note

Uploading a plan/photo for AI auto-fill sends that file to the configured AI
provider to read dimensions (it is not stored by the app). The manual flow
never uploads anything.

---

### Public Stores API & How it works refresh (current)

WordPress storefronts at `smartslab.app/tienda/{slug}` consume public JSON from
this app. Vendors get a `store_slug` / `store_public` profile; inventory is
allowlisted (available + not deleted only).

#### API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/public/stores` | Directory of public stores with `slab_count` |
| `GET /api/v1/public/stores/[slug]` | Vendor summary + public slabs (strict field allowlist) |

Both return `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`
and `Access-Control-Allow-Origin: *`. Unknown/private slugs →
`404 { "error": { "code": "not_found" } }`.

#### Database

Migration: `drizzle/0008_store_slug.sql` (`store_slug`, `store_public`,
`store_slug_locked` on `users`). On Neon production:

```bash
npm run db:apply-store-slug
npm run db:backfill-store-slugs
```

Vendors manage slug (edit once) and public toggle under **Account**. Browse
cards show a locale-aware **Buy now** CTA (`lib/i18n/buy-now.ts`).

#### How it works page (`/how-it-works`)

- Features updated for SmartFinder, public storefronts, Buy now checkout,
  compare/save, remnants, and CSV/plans.
- Light and dark contrast fixed: titles and section headers use theme-aware
  colors (no white-on-light / low-contrast navy labels).

---

### Vendor subscriptions & plan limits (current)

Vendors start on **Free** and can upgrade to **Pro** or **Premium** via Stripe Billing
(`/api/billing/checkout`). Display prices (see `lib/billing/plan-prices.ts`):

| Plan | Monthly | Annual |
| --- | --- | --- |
| **Pro** | $49/month | $39/mo, billed annually |
| **Premium** | $149/month | $119/mo, billed annually |

Plan limits (`lib/plan/limits.ts`): inventory caps, monthly SmartFinder searches
(Free **9** / Pro **99** / Premium unlimited), and Premium-only Market Data.
Enforcement runs on slab create/import, SmartFinder search, and the Market Data
dashboard. SmartFinder ranks **your available/private inventory first** (never
free-capped), then marketplace listings, and can preview piece silhouettes on
the slab detail page.

**Stripe env vars** (also in `.env.example`):

- `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`
- `STRIPE_PRICE_PREMIUM_MONTHLY`, `STRIPE_PRICE_PREMIUM_ANNUAL`

**Database migration** — subscription columns live in
`drizzle/0007_user_subscription_plan.sql`. On an existing Neon database, apply with:

```bash
npm run db:apply-subscription
```

This idempotent script adds `user_plan` / `plan_status` enums and columns on
`users` (`plan`, `plan_status`, `stripe_customer_id`, `stripe_subscription_id`,
`plan_renews_at`, `smartfinder_searches_used`, `smartfinder_reset_at`). Run it
against the same `DATABASE_URL` Vercel uses for production.

Webhook events to configure in Stripe: `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`,
`invoice.payment_failed`.

UI: pricing at `/how-it-works#pricing`, **Manage plan** in the vendor dashboard nav.

#### Existing vendors who already had slabs

After `npm run db:apply-subscription`, **no listing data is changed**. The migration
only adds plan columns on `users` with safe defaults:

| Field | Default for existing rows |
| --- | --- |
| `plan` | `free` |
| `plan_status` | `none` |
| `smartfinder_searches_used` | `0` |
| `stripe_customer_id` / `stripe_subscription_id` | `NULL` (until checkout) |

**What stays the same**

- Every slab already in the database remains as-is (status, photos, price, visibility).
- Public browse, checkout, sales history, and dashboard access work unchanged.
- Vendors who connected Stripe Connect keep their payout setup.

**What changes going forward (enforcement only on new actions)**

- **Inventory cap** — counted on create, CSV import, and duplicate. Existing slabs
  are not removed. A vendor on **Free** with more than 49 slabs **keeps them all**
  but cannot publish new ones until they upgrade or delete listings to get under
  the cap.
- **SmartFinder** — monthly search counter starts at 0; Free gets **9** searches/month
  (Pro 99, Premium unlimited). Results prioritize the signed-in vendor's own
  available listings before marketplace matches.
- **Market Data** — Premium only; Free/Pro see the upgrade prompt.

Paid plans apply only after Stripe checkout and webhook sync (`plan_status` →
`active`). Until then, everyone runs as **Free**.

---

### Design system, branding & UX pass (previous version)

This version made the whole product visually coherent around a single source of
truth for branding, added the reusable UI primitives the app was missing, and
closed a notable UX gap (no way to sign out). No business logic or page
structure was changed — it is a design-foundation + polish pass.

#### What was completed

- **Brand design tokens** — the SmartSlab cyan is now defined in Tailwind v4
  `@theme` (`app/globals.css`) as `brand` / `brand-strong` plus a `brand-50…900`
  scale. Utilities like `bg-brand`, `text-brand-strong`, `ring-brand` now work
  app-wide. Previously `--primary` existed but was never wired into the theme,
  so the hex was copy-pasted everywhere.
- **Branding migration** — replaced the hardcoded `[#1bb0ce]` / `[#0d8fa8]`
  Tailwind arbitrary values with the `brand` / `brand-strong` tokens across
  ~65 files. Real hex values (transactional email, `manifest.ts`, `viewport.ts`,
  Clerk `colorPrimary`) were intentionally left untouched.
- **Reusable UI primitives** (`components/ui/`):
  - `Button` / `buttonClasses` — variants (`primary`, `secondary`, `outline`,
    `ghost`, `danger`) and sizes (`sm`/`md`/`lg`) with built-in accessible focus.
  - `Badge` — status variants + `slabStatusVariant` map so slab status pills
    look identical everywhere.
  - `Card` — the standard surface (radius / border / light-dark background).
  - `lib/cn.ts` — dependency-free className joiner.
- **Global accessibility & polish** (`app/globals.css`) — coherent brand
  `focus-visible` rings, brand-tinted text selection, subtle scrollbars, and
  smooth in-page scrolling that respects `prefers-reduced-motion`.
- **Sign out** — new `components/site/user-menu.tsx`: a signed-in avatar
  dropdown (Dashboard, Account, SmartFinder, and **Sign out** via Clerk). The
  app previously had no sign-out control anywhere. It replaces the loose
  "Account" header link and declutters the header on mobile.

#### Files added in this version

- `components/ui/button.tsx`
- `components/ui/badge.tsx`
- `components/ui/card.tsx`
- `components/site/user-menu.tsx`
- `lib/cn.ts`

#### Validation

- `npm run lint` — only pre-existing warnings/error remain (`mobile-nav.tsx`
  set-state-in-effect and unused `_prevState`/`_formData` in some actions);
  nothing new was introduced.
- `npm run build` — passes (exit 0, all routes compile).

#### Related fix shipped alongside

- Checkout: `RESERVATION_MINUTES` raised from 15 to 30 in `lib/db/slabs.ts` so
  the Stripe Checkout Session `expires_at` (kept in sync with the slab
  reservation) satisfies Stripe's 30-minute minimum. Previously every checkout
  failed with `expires_at must be at least 30 minutes`.

---

### Marketplace operations and admin workflow (previous working version)

This version focused on closing the main production loop:

Visitor enters without login -> browses inventory -> opens slab ->
requests quote or buys -> vendor receives lead or order -> admin supervises.

### What was completed

- Added `Request Quote` flow on the slab detail page.
- Added favorites and compare workflow for buyers.
- Added buyer and vendor messaging surfaces.
- Added a usable admin console with listings, vendors, leads, and orders.
- Added admin listing edit page using the same listing form.
- Added buyer account sections for favorites and quote requests.
- Added SEO support through `sitemap.ts`, `robots.ts`, and slab metadata.
- Cleaned many damaged text strings and normalized visible copy in touched files.

### Continuity note

Work was paused and resumed during the same feature pass. To reduce handoff
risk between future sessions, this README records:

- what was implemented
- which files changed
- what still needs verification
- what blocked full validation in this environment

### Files modified in this version

- `app/(public)/slab/[slug]/page.tsx`
- `app/account/page.tsx`
- `app/actions/marketplace.ts`
- `app/admin/actions.ts`
- `app/admin/page.tsx`
- `app/admin/slabs/[id]/edit/page.tsx`
- `app/api/slabs/compare/route.ts`
- `app/compare/page.tsx`
- `app/dashboard/leads/page.tsx`
- `app/dashboard/messages/page.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/sales/page.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `components/site/site-footer.tsx`
- `components/site/site-header.tsx`
- `components/slab/compare-button.tsx`
- `components/slab/compare-table.tsx`
- `components/slab/favorite-button.tsx`
- `components/slab/quote-request-form.tsx`
- `components/slab/slab-card.tsx`
- `components/slab/slab-form.tsx`
- `drizzle/0004_marketplace_ops.sql`
- `drizzle/meta/_journal.json`
- `lib/db/admin.ts`
- `lib/db/favorites.ts`
- `lib/db/messages.ts`
- `lib/db/quotes.ts`
- `lib/db/schema.ts`
- `lib/db/slabs.ts`
- `lib/email.ts`
- `lib/format.ts`

### New data model added in this version

- `quote_requests`
- `favorites`
- reuse of existing `messages`

### New user-facing routes added in this version

- `/compare`
- `/dashboard/leads`
- `/dashboard/messages`
- `/admin/slabs/[id]/edit`
- `/api/slabs/compare`

### What still needs final verification

- Run `npm install` cleanly with all dev dependencies present.
- Run `npm run lint`.
- Run `npm run build`.
- Apply database migration `0004_marketplace_ops.sql`.
- Verify admin pages, compare, quote request flow, favorites, and messages against a real database.

### Validation status in this environment

Validation is partially blocked here by local package installation issues:

- `npm install` advanced but did not complete reliably.
- `eslint` is still missing from `node_modules/.bin`.
- npm reported network and permission related failures while downloading some packages.

Because of that, full `lint` and `build` verification could not be completed in
this session.

---

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment config:

```bash
Copy-Item .env.example .env.local
```

3. Configure required variables for the full app:

- `DATABASE_URL`
- `NEXT_CLERK_PUBLISHABLE_KEY` (server-only; passed to Clerk in `app/layout.tsx`)
- `CLERK_SECRET_KEY`

For **Vercel production**, use Clerk **Production** keys (`pk_live_…` / `sk_live_…`), not Development (`pk_test_…`). Development instances (`*.accounts.dev`) block cross-origin requests from your live domain and cause CORS errors in the browser console. In the Clerk dashboard, add `https://smart-slab-app.vercel.app` (and your custom domain) under **Configure → Domains**.

Optional (SmartSlab also sets these in code):

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `BLOB_READ_WRITE_TOKEN`
- `NEXT_PUBLIC_APP_URL`
- `PLATFORM_FEE_PERCENT`

4. Apply schema:

```bash
npm run db:init
```

If upgrading an existing database that predates vendor subscriptions, also run:

```bash
npm run db:apply-subscription
```

If this version is being applied to an existing environment, also ensure the new
migration for marketplace operations is present in the database:

```bash
npm run db:push
```

5. Run the app:

```bash
npm run dev
```

## Notes

- **Positioning:** SmartSlab is B2B-first — marketing copy targets fabricators,
  distributors, designers, and contractors, not residential homeowners.
- Environment variables are read at server start. Restart dev server after editing `.env.local`.
- Public routes are intended to remain usable without full auth setup, but
  dashboard, account, admin, payments, and protected workflows need working
  Clerk credentials.
- Stripe, Blob, and email features degrade gracefully when config is missing,
  but production should provide the real keys.
