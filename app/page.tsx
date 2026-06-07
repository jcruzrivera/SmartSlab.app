import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-14">
      <p className="inline-flex w-fit rounded-full bg-[#1bb0ce]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0d8fa8]">
        SmartSlab v1 Foundation
      </p>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
        Slab & remnant inventory management, payments, and marketplace in one
        place.
      </h1>
      <p className="max-w-2xl text-slate-600 dark:text-slate-300">
        Phase 1 bootstrap is ready: Next.js App Router, Clerk auth provider,
        Drizzle schema for all core entities, Neon client setup, and role-based
        route protection for vendor, buyer, and admin areas.
      </p>
      <div className="mt-1 flex flex-wrap gap-3">
        <Link
          href="/sign-up"
          className="inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
        >
          Create account
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
        >
          Sign in
        </Link>
        <Link
          href="/browse"
          className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
        >
          Browse slabs
        </Link>
      </div>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-medium">Vendor Portal</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            `/dashboard` for inventory, orders, and payout workflows.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-medium">Buyer Account</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            `/account` for orders, saved slabs, and communication history.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-medium">Admin Control</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            `/admin` for users, moderation, and platform revenue oversight.
          </p>
        </div>
      </div>
    </main>
  );
}
