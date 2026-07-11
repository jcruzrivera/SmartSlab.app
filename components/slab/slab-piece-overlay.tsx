"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  readSmartfinderHandoff,
  type SmartfinderHandoff,
} from "@/lib/smartfinder/handoff";
import { nestPiecesOnSlab } from "@/lib/smartfinder/nest";
import { getSlabMetric } from "@/lib/smartfinder/slabMetric";
import { SlabLayoutViz } from "@/components/smartfinder/slab-layout-viz";

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

/**
 * Silhouette overlay of SmartFinder pieces nested onto the chosen slab.
 * Uses photo background when aspect is usable; otherwise a to-scale cut layout.
 * Only renders when arriving from SmartFinder (`?sf=1`) with session handoff.
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
  const [handoff, setHandoff] = useState<SmartfinderHandoff | null>(null);

  useEffect(() => {
    if (!fromSmartfinder) {
      setHandoff(null);
      return;
    }
    setHandoff(readSmartfinderHandoff(slabId));
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

  const { placements, oversized, placed, slabWidthIn: sw, slabHeightIn: sh } =
    nest;

  const slabAreaSqft = (sw * sh) / 144;
  const neededAreaSqft = handoff.pieces.reduce(
    (sum, p) => sum + (p.widthIn * p.heightIn) / 144,
    0,
  );
  const metric = getSlabMetric(slabAreaSqft, neededAreaSqft, placed);

  return (
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
          <span className={`text-xs font-semibold ${METRIC_TONE_CLASS[metric.tone]}`}>
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
  );
}
