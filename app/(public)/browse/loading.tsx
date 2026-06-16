export default function BrowseLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-4">
        <div className="h-9 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:flex lg:flex-col lg:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-24 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </aside>

        <section>
          <div className="mb-4 h-9 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
              >
                <div className="aspect-[4/3] w-full animate-pulse bg-slate-200 dark:bg-slate-800" />
                <div className="flex flex-col gap-2 p-4">
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
