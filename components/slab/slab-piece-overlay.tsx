"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { SlabLayoutViz } from "@/components/smartfinder/slab-layout-viz";
import { pieceAreaSqft } from "@/lib/smartfinder/geometry";
import {
  readSmartfinderHandoff,
  saveSmartfinderHandoff,
  seedSmartfinderPieces,
  type SmartfinderHandoff,
} from "@/lib/smartfinder/handoff";
import { nestPiecesOnSlab } from "@/lib/smartfinder/nest";
import { getSlabMetric } from "@/lib/smartfinder/slabMetric";
import { suggestSlabsForRemaining } from "@/lib/smartfinder/suggest-remaining";
import type { Piece, SmartFinderResult } from "@/lib/smartfinder/types";

const METRIC_TONE_CLASS = {
  good: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-rose-500 dark:text-rose-400",
} as const;

type SlabPieceOverlayProps = {
  slabId: string;
  slabWidthIn: number | null;
  slabHeightIn: number | null;
  imageUrl: string | null;
  slabName: string;
};

function formatPrice(value: string | null): string {
  if (!value) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function SuggestionRow({
  result,
  remaining,
  cta,
}: {
  result: SmartFinderResult;
  remaining: Piece[];
  cta: string;
}) {
  const href = `/slab/${result.slabId}?sf=1`;

  function handleNavigate() {
    saveSmartfinderHandoff(result.slabId, remaining);
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <Link
        href={href}
        onClick={handleNavigate}
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800"
      >
        {result.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
            No photo
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={href}
          onClick={handleNavigate}
          className="block truncate text-sm font-medium text-slate-900 hover:text-brand-strong dark:text-slate-100"
        >
          {result.slabName}
        </Link>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {result.materialName ?? "Stone"}
          {result.widthIn && result.heightIn
            ? ` · ${result.widthIn}×${result.heightIn}"`
            : ""}
          {result.price ? ` · ${formatPrice(result.price)}` : ""}
        </p>
      </div>
      <Link
        href={href}
        onClick={handleNavigate}
        className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-strong"
      >
        {cta}
      </Link>
    </li>
  );
}

function RemainingPiecesCard({
  remaining,
  currentSlabId,
  handoff,
}: {
  remaining: Piece[];
  currentSlabId: string;
  handoff: SmartfinderHandoff;
}) {
  const suggestions = useMemo(
    () =>
      suggestSlabsForRemaining({
        remaining,
        currentSlabId,
        ownResults: handoff.ownResults,
        marketResults: handoff.marketResults,
        limit: 3,
      }),
    [remaining, currentSlabId, handoff.ownResults, handoff.marketResults],
  );

  const remainingSqft = remaining.reduce((s, p) => s + pieceAreaSqft(p), 0);
  const labels = remaining.map((p) => p.label).join(", ");

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7500/ingest/1fdc5bd2-46b8-42a5-a225-d8250050fbca", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "c6a998",
      },
      body: JSON.stringify({
        sessionId: "c6a998",
        runId: "remaining-card",
        hypothesisId: "H1",
        location: "slab-piece-overlay.tsx:RemainingPiecesCard",
        message: "Remaining pieces suggestions computed",
        data: {
          remainingCount: remaining.length,
          remainingLabels: remaining.map((p) => p.label),
          ownSuggestions: suggestions.own.length,
          marketSuggestions: suggestions.market.length,
          hadCachedOwn: (handoff.ownResults?.length ?? 0) > 0,
          hadCachedMarket: (handoff.marketResults?.length ?? 0) > 0,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [remaining, suggestions, handoff.ownResults, handoff.marketResults]);
  // #endregion

  return (
    <section className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50/80 p-4 dark:border-amber-700/50 dark:bg-amber-950/30">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
          Still need another slab
        </p>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
          These pieces didn&apos;t fit here:{" "}
          <span className="font-medium">{labels}</span>
          {remainingSqft > 0 ? (
            <span className="text-slate-500">
              {" "}
              ({remainingSqft.toFixed(1)} sq ft)
            </span>
          ) : null}
          . Use another slab from your inventory, or buy one.
        </p>
      </div>

      {suggestions.own.length > 0 ? (
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            From your inventory
          </h3>
          <ul className="flex flex-col gap-2">
            {suggestions.own.map((result) => (
              <SuggestionRow
                key={result.slabId}
                result={result}
                remaining={remaining}
                cta="Use this"
              />
            ))}
          </ul>
        </div>
      ) : (
        <p className="mb-4 rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          No other slab in your inventory fits the remaining pieces.
        </p>
      )}

      {suggestions.market.length > 0 ? (
        <div className="mb-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Buy on the marketplace
          </h3>
          <ul className="flex flex-col gap-2">
            {suggestions.market.map((result) => (
              <SuggestionRow
                key={result.slabId}
                result={result}
                remaining={remaining}
                cta="View / buy"
              />
            ))}
          </ul>
        </div>
      ) : (
        <p className="mb-3 rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          No marketplace match in this search for the leftover pieces.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/account/smartfinder"
          onClick={() => {
            seedSmartfinderPieces(remaining);
          }}
          className="inline-flex h-9 items-center rounded-lg bg-brand px-3 text-xs font-semibold text-white transition hover:bg-brand-strong"
        >
          Search again for remaining pieces
        </Link>
        <Link
          href="/browse"
          className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          Browse marketplace
        </Link>
      </div>
    </section>
  );
}

/**
 * Silhouette overlay of SmartFinder pieces nested onto the chosen slab.
 * Uses photo background when aspect is usable; otherwise a to-scale cut layout.
 * Only renders when arriving from SmartFinder (`?sf=1`) with session handoff.
 * When pieces remain unplaced, shows a second card with own-inventory then
 * marketplace suggestions (no extra search quota).
 */
export function SlabPieceOverlay({
  slabId,
  slabWidthIn,
  slabHeightIn,
  imageUrl,
  slabName,
}: SlabPieceOverlayProps) {
  const searchParams = useSearchParams();
  const fromSmartfinder = searchParams.get("sf") === "1";

  const handoff = useMemo(() => {
    if (!fromSmartfinder) return null;
    return readSmartfinderHandoff(slabId);
  }, [fromSmartfinder, slabId]);

  const nest = useMemo(() => {
    if (
      !handoff ||
      slabWidthIn == null ||
      slabHeightIn == null ||
      !Number.isFinite(slabWidthIn) ||
      !Number.isFinite(slabHeightIn)
    ) {
      return null;
    }
    return nestPiecesOnSlab(slabWidthIn, slabHeightIn, handoff.pieces);
  }, [handoff, slabWidthIn, slabHeightIn]);

  if (!fromSmartfinder || !handoff || !nest) {
    return null;
  }

  const { placements, oversized, unplaced, placed, slabWidthIn: sw, slabHeightIn: sh } =
    nest;

  const slabAreaSqft = (sw * sh) / 144;
  const neededAreaSqft = handoff.pieces.reduce(
    (sum, p) => sum + pieceAreaSqft(p),
    0,
  );
  const metric = getSlabMetric(slabAreaSqft, neededAreaSqft, placed);

  return (
    <div className="flex flex-col gap-0">
      <section className="rounded-2xl border border-brand/30 bg-white p-4 dark:border-brand/40 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-strong">
              SmartFinder layout
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Piece silhouettes nested on this slab
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-semibold ${METRIC_TONE_CLASS[metric.tone]}`}
            >
              {metric.label}: {metric.value}
            </span>
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand-strong">
              {placements.length} placed
              {oversized.length > 0 ? ` · ${oversized.length} oversized` : ""}
            </span>
          </div>
        </div>

        <SlabLayoutViz
          slabWidthIn={sw}
          slabHeightIn={sh}
          pieces={placements}
          photoUrl={imageUrl}
          slabName={slabName}
        />

        {oversized.length > 0 ? (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
            Could not place on this slab: {oversized.join(", ")}
          </p>
        ) : (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Preview uses a simple shelf layout (pieces may be rotated 90°). Use
            this to confirm fit before requesting a quote.
          </p>
        )}
      </section>

      {unplaced.length > 0 ? (
        <RemainingPiecesCard
          remaining={unplaced}
          currentSlabId={slabId}
          handoff={handoff}
        />
      ) : null}
    </div>
  );
}
