# SmartSlab

SmartSlab is a Next.js 16 full-stack marketplace and inventory platform for
natural stone slabs and remnants. Vendors publish inventory with photos, buyers
browse live listings, and the platform handles leads, checkout, and vendor
operations.

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
- Buyer workflow: browse inventory, save favorites, compare slabs, request quotes, purchase slabs, and review account history.
- Admin workflow: review vendors, listings, quote requests, orders, and edit listings from an admin panel.

---

## Version status

### Marketplace operations and admin workflow (current working version)

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

- Environment variables are read at server start. Restart dev server after editing `.env.local`.
- Public routes are intended to remain usable without full auth setup, but
  dashboard, account, admin, payments, and protected workflows need working
  Clerk credentials.
- Stripe, Blob, and email features degrade gracefully when config is missing,
  but production should provide the real keys.
