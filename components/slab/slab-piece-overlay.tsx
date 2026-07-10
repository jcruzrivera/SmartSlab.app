"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  readSmartfinderHandoff,
  type SmartfinderHandoff,
} from "@/lib/smartfinder/handoff";
import { nestPiecesOnSlab } from "@/lib/smartfinder/nest";

type SlabPieceOverlayProps = {
  slabId: string;
  slabWidthIn: number | null;
  slabHeightIn: number | null;
  imageUrl: string | null;
  slabName: string;
};

/**
 * Silhouette overlay of SmartFinder pieces nested onto the chosen slab photo.
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

  const { placements, oversized, slabWidthIn: sw, slabHeightIn: sh } = nest;

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
        <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand-strong">
          {placements.length} placed
          {oversized.length > 0 ? ` · ${oversized.length} oversized` : ""}
        </span>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={slabName}
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
        ) : null}
        <div className="absolute inset-0 bg-slate-950/25" />
        <svg
          viewBox={`0 0 ${sw} ${sh}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Nested piece silhouettes"
        >
          <rect
            x={0}
            y={0}
            width={sw}
            height={sh}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={Math.max(sw, sh) * 0.004}
          />
          {placements.map((p, i) => (
            <g key={`${p.label}-${i}`}>
              <rect
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
                fill="rgba(27, 176, 206, 0.28)"
                stroke="#1bb0ce"
                strokeWidth={Math.max(sw, sh) * 0.006}
              />
              <text
                x={p.x + p.w / 2}
                y={p.y + p.h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={Math.min(p.w, p.h) * 0.18}
                fontWeight={600}
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
              >
                {p.label.length > 18 ? `${p.label.slice(0, 16)}…` : p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

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
