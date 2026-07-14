"use client";

import Link from "next/link";
import { useState } from "react";

import type { Piece, SmartFinderResult } from "@/lib/smartfinder/types";
import { pieceAreaSqft } from "@/lib/smartfinder/geometry";
import { saveSmartfinderHandoff } from "@/lib/smartfinder/handoff";
import { getSlabMetric } from "@/lib/smartfinder/slabMetric";
import { startCheckout } from "@/lib/billing/start-checkout";

const METRIC_TONE_CLASS = {
  good: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-rose-500 dark:text-rose-400",
} as const;

type ResultsListProps = {
  results: SmartFinderResult[];
  ownResults: SmartFinderResult[];
  marketResults: SmartFinderResult[];
  totalMatches: number;
  limited: boolean;
  loading: boolean;
  pieces: Piece[];
  onBack: () => void;
  onStartOver: () => void;
};

function FitBadge({ fits, score }: { fits: boolean; score: number }) {
  if (fits) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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

function formatLocation(
  city: string | null,
  state: string | null,
): string | null {
  const parts = [city, state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

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
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultCard({
  result,
  index,
  pieces,
  ownResults,
  marketResults,
}: {
  result: SmartFinderResult;
  index: number;
  pieces: Piece[];
  ownResults: SmartFinderResult[];
  marketResults: SmartFinderResult[];
}) {
  const location = formatLocation(result.city, result.state);
  const href = `/slab/${result.slabId}?sf=1`;
  const metric = getSlabMetric(
    result.slabSqft,
    result.totalPieceSqft,
    result.fits,
  );

  function handleNavigate() {
    saveSmartfinderHandoff(result.slabId, pieces, {
      ownResults,
      marketResults,
    });
  }

  return (
    <div className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md sm:flex-row dark:border-slate-800 dark:bg-slate-900">
      <Link
        href={href}
        onClick={handleNavigate}
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

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-strong">
            {result.materialName ?? "Stone"}
          </span>
          {result.colorFamily ? (
            <span className="text-xs text-slate-400">| {result.colorFamily}</span>
          ) : null}
          {result.isOwnListing ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Your listing
            </span>
          ) : null}
          {result.isOwnListing && result.status === "hidden" ? (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Private
            </span>
          ) : null}
          <FitBadge fits={result.fits} score={result.fitScore} />
        </div>

        <Link
          href={href}
          onClick={handleNavigate}
          className="line-clamp-1 text-base font-semibold tracking-tight transition hover:text-brand-strong"
        >
          {result.slabName}
        </Link>

        <ScoreBar score={result.fitScore} />

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Slab:{" "}
            <strong className="text-slate-700 dark:text-slate-200">
              {result.slabSqft} sq ft
            </strong>
          </span>
          <span>
            Needed:{" "}
            <strong className="text-slate-700 dark:text-slate-200">
              {result.totalPieceSqft} sq ft
            </strong>
          </span>
          <span>
            {metric.label}:{" "}
            <strong className={METRIC_TONE_CLASS[metric.tone]}>
              {metric.value}
            </strong>
          </span>
          {location ? <span>{location}</span> : null}
        </div>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-lg font-semibold">
            {formatPrice(result.price)}
          </span>
          <Link
            href={href}
            onClick={handleNavigate}
            className="inline-flex h-8 items-center rounded-lg border border-brand px-3 text-xs font-medium text-brand-strong transition hover:bg-brand hover:text-white"
          >
            View slab
          </Link>
        </div>

        {result.oversizedPieces.length > 0 ? (
          <p className="text-xs text-red-500">
            Pieces too large for this slab: {result.oversizedPieces.join(", ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ResultSection({
  title,
  hint,
  items,
  startIndex,
  pieces,
  ownResults,
  marketResults,
}: {
  title: string;
  hint?: string;
  items: SmartFinderResult[];
  startIndex: number;
  pieces: Piece[];
  ownResults: SmartFinderResult[];
  marketResults: SmartFinderResult[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h3>
        {hint ? (
          <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
        ) : null}
      </div>
      {items.map((result, i) => (
        <ResultCard
          key={result.slabId}
          result={result}
          index={startIndex + i}
          pieces={pieces}
          ownResults={ownResults}
          marketResults={marketResults}
        />
      ))}
    </div>
  );
}

export function ResultsList({
  results,
  ownResults,
  marketResults,
  totalMatches,
  limited,
  loading,
  pieces,
  onBack,
  onStartOver,
}: ResultsListProps) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const pieceSummary = pieces.map((p) => p.label).join(", ");
  const totalSqft = pieces.reduce((s, p) => s + pieceAreaSqft(p), 0);
  const shown = results.length;
  const hasSections = ownResults.length > 0 || marketResults.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Matching slabs
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {pieceSummary} — {totalSqft.toFixed(1)} sq ft needed
        </p>
      </div>

      {loading ? <Skeleton /> : null}

      {!loading && shown === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m21 21-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="font-medium text-slate-600 dark:text-slate-300">
            No slabs match your requirements
          </p>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your piece dimensions or reducing the number of
            pieces. New inventory is added regularly.
          </p>
        </div>
      ) : null}

      {!loading && shown > 0 ? (
        <div className="flex flex-col gap-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {shown} of {totalMatches} matching slab
            {totalMatches !== 1 ? "s" : ""}
            {ownResults.length > 0
              ? ` · ${ownResults.length} from your inventory (always shown)`
              : ""}
          </p>

          {hasSections ? (
            <>
              {ownResults.length > 0 ? (
                <ResultSection
                  title="Your inventory"
                  hint="Your full slabs and remnants first — maximize your own stock before buying."
                  items={ownResults}
                  startIndex={0}
                  pieces={pieces}
                  ownResults={ownResults}
                  marketResults={marketResults}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    No usable listings in your inventory for these pieces
                  </p>
                  <p className="mt-1">
                    Publish or unhide a full slab/remnant with width and height,
                    then search again. Marketplace matches are shown below.
                  </p>
                </div>
              )}
              <ResultSection
                title="Marketplace"
                hint="Listings from other vendors that fit your pieces."
                items={marketResults}
                startIndex={ownResults.length}
                pieces={pieces}
                ownResults={ownResults}
                marketResults={marketResults}
              />
            </>
          ) : (
            results.map((result, index) => (
              <ResultCard
                key={result.slabId}
                result={result}
                index={index}
                pieces={pieces}
                ownResults={ownResults}
                marketResults={marketResults}
              />
            ))
          )}
        </div>
      ) : null}

      {!loading && limited ? (
        <div className="relative overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 to-brand-strong/5 p-8 text-center">
          <div className="relative">
            <p className="text-sm font-semibold text-brand-strong">
              +{totalMatches - shown} more matching slabs
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">
              Subscribe to unlock all results
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Your inventory is always fully listed. Free accounts see up to 3
              marketplace matches — upgrade for the full market list.
            </p>
            <button
              type="button"
              disabled={checkoutLoading}
              onClick={() => {
                setCheckoutLoading(true);
                void startCheckout("pro", "monthly");
              }}
              className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-6 text-sm font-medium text-white transition hover:bg-brand-strong disabled:opacity-70"
            >
              {checkoutLoading ? "Redirecting…" : "Upgrade to Pro"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
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
