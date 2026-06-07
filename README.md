# SmartSlab

SmartSlab is a Next.js 16 full-stack marketplace and inventory platform for stone slabs and remnants.

## Stack

- Next.js 16 App Router + TypeScript strict mode
- Tailwind CSS v4
- Clerk authentication and role-aware route protection
- Neon Postgres + Drizzle ORM
- React Query + Zustand foundation

## Current bootstrap scope

- App shell, base routes, and SmartSlab brand defaults
- Drizzle schema for core domain entities (users, locations, materials, slabs, images, transactions, messages, reviews)
- Neon DB client and Drizzle config
- Clerk sign-in/sign-up and role onboarding flow (`/sign-in`, `/sign-up`, `/onboarding`)
- Next.js `proxy.ts` with Clerk-based role protection for `/dashboard`, `/account`, and `/admin` when Clerk is configured
- Onboarding API endpoint to save user role in Clerk metadata
- Clerk webhook endpoint (`/api/webhooks/clerk`) to sync users into Neon
- Environment variable template in `.env.example`
- RLS bootstrap SQL in `drizzle/0000_bootstrap_rls.sql`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
Copy-Item .env.example .env.local
```

3. Run development server:

```bash
npm run dev
```

4. Generate Drizzle migrations after schema updates:

```bash
npm run db:generate
```

## Notes

- Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`. This repo uses `proxy.ts`.
- RLS policies are permissive bootstrap policies and must be tightened before production launch.
