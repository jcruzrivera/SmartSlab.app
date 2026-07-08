import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white">
        S
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">You are offline</h1>
      <p className="text-slate-600 dark:text-slate-300">
        SmartSlab needs a connection to load live inventory, pricing, and
        checkout. Reconnect and try again.
      </p>
      <Link
        href="/browse"
        className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand-strong"
      >
        Retry browse
      </Link>
    </main>
  );
}
