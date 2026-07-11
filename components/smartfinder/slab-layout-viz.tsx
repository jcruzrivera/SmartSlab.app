"use client";

import { useEffect, useState } from "react";

import { isPhotoUsableAsBackground } from "@/lib/smartfinder/photoUsable";

export type LayoutPiece = {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type SlabLayoutVizProps = {
  slabWidthIn: number;
  slabHeightIn: number;
  pieces: LayoutPiece[];
  photoUrl?: string | null;
  slabName?: string;
};

export function SlabLayoutViz({
  slabWidthIn,
  slabHeightIn,
  pieces,
  photoUrl,
  slabName = "Slab",
}: SlabLayoutVizProps) {
  const [photoNatural, setPhotoNatural] = useState<{
    w: number;
    h: number;
  } | null>(null);

  useEffect(() => {
    if (!photoUrl) {
      setPhotoNatural(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setPhotoNatural({ w: img.naturalWidth, h: img.naturalHeight });
      }
    };
    img.onerror = () => {
      if (!cancelled) setPhotoNatural(null);
    };
    img.src = photoUrl;

    return () => {
      cancelled = true;
    };
  }, [photoUrl]);

  const usePhoto =
    !!photoUrl &&
    photoNatural != null &&
    isPhotoUsableAsBackground({
      naturalWidth: photoNatural.w,
      naturalHeight: photoNatural.h,
      slabWidthIn,
      slabHeightIn,
    });

  const strokeBase = Math.max(slabWidthIn, slabHeightIn);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{ aspectRatio: `${slabWidthIn} / ${slabHeightIn}` }}
    >
      {usePhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl!}
          alt={slabName}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700" />
      )}

      <svg
        viewBox={`0 0 ${slabWidthIn} ${slabHeightIn}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Nested piece silhouettes"
      >
        <rect
          x={0}
          y={0}
          width={slabWidthIn}
          height={slabHeightIn}
          fill="none"
          stroke={usePhoto ? "rgba(255,255,255,0.35)" : "#334155"}
          strokeWidth={usePhoto ? strokeBase * 0.004 : strokeBase * 0.006}
        />

        {pieces.map((p, i) => (
          <g key={`${p.label}-${i}`}>
            <rect
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              fill={
                usePhoto ? "rgba(27,176,206,0.28)" : "rgba(27,176,206,0.55)"
              }
              stroke="#1bb0ce"
              strokeWidth={strokeBase * 0.006}
            />
            <text
              x={p.x + p.w / 2}
              y={p.y + p.h / 2}
              fill={usePhoto ? "#fff" : "#0f172a"}
              fontSize={Math.min(p.w, p.h) * 0.18}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="middle"
              style={
                usePhoto
                  ? { textShadow: "0 1px 2px rgba(0,0,0,0.6)" }
                  : undefined
              }
            >
              {p.label.length > 18 ? `${p.label.slice(0, 16)}…` : p.label}
            </text>
          </g>
        ))}
      </svg>

      {!usePhoto ? (
        <span className="absolute bottom-1 right-2 text-[10px] uppercase tracking-wide text-slate-700 dark:text-slate-200">
          To-scale cut layout · {slabWidthIn}&quot;×{slabHeightIn}&quot;
        </span>
      ) : null}
    </div>
  );
}
