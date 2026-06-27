<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Single product: **SmartSlab**, one Next.js 16 (App Router) full-stack app at the repo
root. Package manager is **npm** (Node 22). Standard scripts live in `package.json`
and setup steps in `README.md` — use those; only the non-obvious caveats below are
documented here.

### Running
- Dev server: `npm run dev` (port 3000). Lint: `npm run lint`. Build: `npm run build`.
- Env vars are read at server start — **restart `npm run dev` after editing `.env.local`**.

### External services
The app talks to **Neon Postgres (with the `pgvector` extension)**, **Clerk** (auth),
**Stripe Connect** (payments), **Cloudinary** (image upload + delivery), and optionally
**Vercel Blob** (legacy upload fallback). It is built to
degrade gracefully: the public homepage (`/`) and `/browse` render without any of
these configured, but everything else needs real credentials. Provide them as
secrets (`DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (required for optimized images in the browser),
`BLOB_READ_WRITE_TOKEN`, …) for full E2E.

### Non-obvious gotchas
- **Runtime DB driver is `@neondatabase/serverless` over HTTP**, not TCP. It derives
  the SQL endpoint by replacing the first DNS label of the `DATABASE_URL` host with
  `api.` and POSTing to `https://<that-host>/sql`. So a plain local Postgres TCP DSN
  will NOT work at runtime — you need a real Neon database or a local Neon-HTTP proxy.
- **`drizzle-kit` (`db:push`, `db:studio`) uses the Neon WEBSOCKET driver** and cannot
  talk to a plain local Postgres. To apply the schema to a local/standard Postgres,
  run the SQL files in `drizzle/*.sql` directly via `psql` (the `--> statement-breakpoint`
  lines are just SQL comments). `npm run db:setup` (enable `pgvector`) goes through the
  HTTP path and needs the proxy / a real Neon DB.
- Pages that call Clerk `auth()` — the slab detail page `/slab/[id]`, `/dashboard/*`,
  `/account`, `/admin` — return HTTP 500 without valid Clerk keys. Only `/` and
  `/browse` are safe to load unauthenticated.
- **Offline DB option (no real Neon):** install Postgres + `postgresql-16-pgvector`,
  add `127.0.0.1 api.localtest.me db.localtest.me` to `/etc/hosts`, run a small
  Neon-HTTP `/sql` proxy on `:443` (backed by local Postgres) with a self-signed cert,
  set `DATABASE_URL=postgres://<user>:<pw>@db.localtest.me:5432/<db>`, and start
  `next dev` with `NODE_EXTRA_CA_CERTS` pointing at that cert. This is how the public
  marketplace was demonstrated end-to-end when no Neon secret was available.
