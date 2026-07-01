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

For **Vercel production**, use Clerk **Production** keys (`pk_live_…` / `sk_live_…`), not Development (`pk_test_…`). In the Clerk dashboard, add **`https://smartslab.store`** under **Configure → Domains**. The production domain must be **`smartslab.store`** — if Clerk tries to load from `clerk.smartslab.app`, the dashboard still points at the old `.app` hostname; update or remove that domain and finish DNS for `.store`.

**Domain setup (Namecheap + Vercel):** point Namecheap nameservers to Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`). Add DNS records in **Vercel → Domains → smartslab.store → DNS**, not Namecheap. The canonical storefront URL is **`https://smartslab.store`**; `www.smartslab.store` redirects to the apex in `vercel.json`.

**Clerk custom DNS (recommended):** in Vercel DNS, replace any A records on Clerk subdomains with these CNAMEs (relative to `smartslab.store`):

| Name | Target |
|------|--------|
| `accounts` | `accounts.clerk.services` |
| `clerk` | `frontend-api.clerk.services` |
| `clk._domainkey` | `dkim1.zov7sumhsqh0.clerk.services` |
| `clk2._domainkey` | `dkim2.zov7sumhsqh0.clerk.services` |
| `clkmail` | `mail.zov7sumhsqh0.clerk.services` |

Then verify the domain in Clerk. Do **not** set `NEXT_PUBLIC_CLERK_PROXY_URL` — the app does not use same-origin Clerk proxy (that path caused `/__clerk/handshake` redirect loops).

**Google OAuth (Sign in with Google):** production requires your own Google OAuth client. A `400 invalid_request` / `GeneralOAuthFlow` error almost always means the redirect URI in Google Cloud Console does not match Clerk exactly.

1. Clerk Dashboard (Production instance) → **Configure → SSO connections → Google**.
2. Enable **Use custom credentials** and copy the **Authorized Redirect URI** shown there (typically `https://accounts.smartslab.store/v1/oauth_callback` once custom DNS is verified).
3. [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials** → your OAuth 2.0 Web client (or create one).
4. **Authorized JavaScript origins** — add:
   - `https://smartslab.store`
   - `https://accounts.smartslab.store`
   - `https://clerk.smartslab.store`
5. **Authorized redirect URIs** — paste the URI from step 2 **character-for-character** (no trailing slash unless Clerk shows one).
6. Copy **Client ID** and **Client Secret** back into Clerk → Google → Save.

The Google consent screen should say the user is signing in to **SmartSlab** / `smartslab.store`, not a generic Clerk dev proxy.

**Vercel environment variables (production checklist):**

```bash
NEXT_PUBLIC_APP_URL=https://smartslab.store
NEXT_CLERK_PUBLISHABLE_KEY=pk_live_…   # same Production instance as below
CLERK_SECRET_KEY=sk_live_…
```

Optional (SmartSlab also sets domain and script URLs in code when `VERCEL_ENV=production`):

- `NEXT_PUBLIC_CLERK_DOMAIN=smartslab.store`

**Remove or align stale vars** (common source of OAuth / redirect bugs):

- Do **not** set `NEXT_PUBLIC_CLERK_PROXY_URL`.
- Remove `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` if it differs from `NEXT_CLERK_PUBLISHABLE_KEY` (legacy `.app` instance).
- Optional path-only overrides: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`.

**Auth UI in this repo:** the site header uses server `auth()` plus static links (no `SignedIn` / `useUser` in the root layout — that pattern caused React error #185). Guest favorites sync runs only on `/browse` via `app/(public)/browse/layout.tsx`.

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `BLOB_READ_WRITE_TOKEN`
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

## Progressive Web App (PWA)

SmartSlab ships with installable PWA support for mobile and desktop browsers.

### What is included

- `app/manifest.ts` — Web App Manifest (`/manifest.webmanifest`) with name,
  theme colors, icons, and shortcuts to Browse, Compare, and Dashboard.
- `public/sw.js` — production service worker that caches static assets and
  serves `/offline` when navigation fails without a network connection.
- `app/offline/page.tsx` — offline fallback screen.
- `components/pwa/register-service-worker.tsx` — registers the service worker
  in production builds only.
- `public/icons/icon-192.png` and `public/icons/icon-512.png` — install icons
  generated from the app logo.

### Install behavior

- **Android (Chrome):** open the site, then use *Install app* from the browser
  menu.
- **iOS (Safari):** tap *Share* → *Add to Home Screen*.
- **Desktop (Chrome / Edge):** use the install icon in the address bar when
  offered.

The installed app opens in standalone mode with `start_url` set to `/browse`.

### PWA verification checklist

1. Deploy over HTTPS (required for service workers and install prompts).
2. Run a production build locally:

```bash
npm run build
npm run start
```

3. Open the site in Chrome DevTools → **Application** → **Manifest** and confirm:
   - manifest loads without errors
   - icons include 192×192 and 512×512 entries
   - `display: standalone` and `theme_color: #1bb0ce`
4. In **Service Workers**, confirm `/sw.js` is registered after page load.
5. Toggle **Offline** in DevTools and reload a navigation route — you should
   see `/offline` instead of a browser error page.

### PWA notes

- The service worker registers only when `NODE_ENV=production` (not during
  `npm run dev`).
- Live inventory, auth, checkout, and vendor dashboards still require network
  access; the PWA improves installability and resilience, not full offline
  marketplace browsing.
- Replace `public/icons/icon-192.png` and `public/icons/icon-512.png` with
  true 192×192 and 512×512 exports if you want pixel-perfect install icons.

## Notes

- Environment variables are read at server start. Restart dev server after editing `.env.local`.
- Public routes are intended to remain usable without full auth setup, but
  dashboard, account, admin, payments, and protected workflows need working
  Clerk credentials.
- Stripe, Blob, and email features degrade gracefully when config is missing,
  but production should provide the real keys.
