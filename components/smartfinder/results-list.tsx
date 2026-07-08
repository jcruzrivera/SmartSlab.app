"use client";

import Link from "next/link";

import type { SmartFinderResult } from "@/app/account/smartfinder/actions";
import type { Piece } from "@/lib/smartfinder/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

type ResultsListProps = {
  results: SmartFinderResult[];
  totalMatches: number;
  limited: boolean;
  loading: boolean;
  pieces: Piece[];
  onBack: () => void;
  onStartOver: () => void;
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FitBadge({ fits, score }: { fits: boolean; score: number }) {
  if (fits) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Fits · {score}/100
      </span>
    );
  }

  if (score >= 30) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        Partial · {score}/100
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      {score}/100
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-500"
      : score >= 40
        ? "bg-amber-500"
        : "bg-slate-400";

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  );
}

function formatPrice(value: string | null): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatLocation(city: string | null, state: string | null): string | null {
  const parts = [city, state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function Skeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex animate-pulse flex-col gap-4 rounded-2xl border border-slate-200 p-5 sm:flex-row dark:border-slate-800"
        >
          <div className="h-32 w-full rounded-xl bg-slate-200 sm:w-44 dark:bg-slate-800" />
          <div className="flex flex-1 flex-col gap-3">
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="flex gap-6">
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ResultsList({
  results,
  totalMatches,
  limited,
  loading,
  pieces,
  onBack,
  onStartOver,
}: ResultsListProps) {
  const pieceSummary = pieces.map((p) => p.label).join(", ");
  const totalSqft = pieces.reduce((s, p) => s + (p.widthIn * p.heightIn) / 144, 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Matching slabs</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {pieceSummary} — {totalSqft.toFixed(1)} sq ft needed
        </p>
      </div>

      {/* Loading */}
      {loading && <Skeleton />}

      {/* Empty state */}
      {!loading && results.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="font-medium text-slate-600 dark:text-slate-300">
            No slabs match your requirements
          </p>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your piece dimensions or reducing the number of pieces.
            New inventory is added regularly.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {results.length} of {totalMatches} matching slab{totalMatches !== 1 ? "s" : ""}
          </p>

          {results.map((result, index) => {
            const location = formatLocation(result.city, result.state);

            return (
              <div
                key={result.slabId}
                className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md sm:flex-row dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Image */}
                <Link
                  href={`/slab/${result.slabId}`}
                  className="relative block h-32 w-full flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-44 dark:bg-slate-800"
                >
                  {result.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.imageUrl}
                      alt={result.slabName}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      No photo
                    </div>
                  )}
                  <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-200">
                    {index + 1}
                  </span>
                </Link>

                {/* Details */}
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-strong">
                      {result.materialName ?? "Stone"}
                    </span>
                    {result.colorFamily && (
                      <span className="text-xs text-slate-400">| {result.colorFamily}</span>
                    )}
                    <FitBadge fits={result.fits} score={result.fitScore} />
                  </div>

                  <Link
                    href={`/slab/${result.slabId}`}
                    className="line-clamp-1 text-base font-semibold tracking-tight transition hover:text-brand-strong"
                  >
                    {result.slabName}
                  </Link>

                  <ScoreBar score={result.fitScore} />

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Slab: <strong className="text-slate-700 dark:text-slate-200">{result.slabSqft} sq ft</strong>
                    </span>
                    <span>
                      Needed: <strong className="text-slate-700 dark:text-slate-200">{result.totalPieceSqft} sq ft</strong>
                    </span>
                    <span>
                      Waste:{" "}
                      <strong
                        className={
                          result.wastePercent <= 20
                            ? "text-emerald-600 dark:text-emerald-400"
                            : result.wastePercent <= 40
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-500"
                        }
                      >
                        {result.wastePercent}%
                      </strong>
                    </span>
                    {location && <span>{location}</span>}
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-lg font-semibold">{formatPrice(result.price)}</span>
                    <div className="flex gap-2">
                      <Link
                        href={`/slab/${result.slabId}`}
                        className="inline-flex h-8 items-center rounded-lg border border-brand px-3 text-xs font-medium text-brand-strong transition hover:bg-brand hover:text-white"
                      >
                        View slab
                      </Link>
                    </div>
                  </div>

                  {result.oversizedPieces.length > 0 && (
                    <p className="text-xs text-red-500">
                      Pieces too large for this slab: {result.oversizedPieces.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subscription gate */}
      {!loading && limited && (
        <div className="relative overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 to-brand-strong/5 p-8 text-center">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand/10 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-brand-strong/10 blur-2xl" />
          <div className="relative">
            <p className="text-sm font-semibold text-brand-strong">
              +{totalMatches - results.length} more matching slabs
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">
              Subscribe to unlock all results
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Free accounts see the top 3 matches. Subscribers get full access
              to all matching slabs, advanced filtering, and priority support.
            </p>
            <button
              type="button"
              disabled
              className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-6 text-sm font-medium text-white opacity-70"
            >
              Coming soon
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Edit pieces
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Start over
        </button>
        <Link
          href="/browse"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Browse all slabs
        </Link>
      </div>
    </div>
  );
}
