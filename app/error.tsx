"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const message = error.message ?? "";
    const isChunkError =
      error.name === "ChunkLoadError" ||
      message.includes("Loading chunk") ||
      message.includes("Failed to load chunk");

    if (isChunkError) {
      const lastReload = sessionStorage.getItem("smartslab-chunk-reload");
      const now = Date.now();

      if (!lastReload || now - Number(lastReload) > 10_000) {
        sessionStorage.setItem("smartslab-chunk-reload", String(now));
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        This listing could not be displayed. Try again or return to browse.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong"
        >
          Try again
        </button>
        <a
          href="/browse"
          className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:border-brand hover:text-brand-strong dark:border-slate-700"
        >
          Back to browse
        </a>
      </div>
    </main>
  );
}
