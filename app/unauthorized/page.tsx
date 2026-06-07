import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center gap-5 px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Access denied</h1>
      <p className="text-slate-600 dark:text-slate-300">
        Your account does not have permission to open this route.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[#1bb0ce] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
      >
        Return home
      </Link>
    </main>
  );
}
