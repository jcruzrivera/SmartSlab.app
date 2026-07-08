"use client";

import { useCallback, useState } from "react";
import { PIECE_PRESETS, type Piece } from "@/lib/smartfinder/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

type PieceEditorProps = {
  initialPieces: Piece[];
  imageUrl: string | null;
  autoFilled?: boolean;
  onSearch: (pieces: Piece[]) => void;
  onBack: () => void;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function totalSqft(pieces: Piece[]): number {
  return pieces.reduce((sum, p) => sum + (p.widthIn * p.heightIn) / 144, 0);
}

let nextId = 1;

type PieceRow = Piece & { key: number };

function toPieceRow(p: Piece): PieceRow {
  return { ...p, key: nextId++ };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PieceEditor({
  initialPieces,
  imageUrl,
  autoFilled = false,
  onSearch,
  onBack,
}: PieceEditorProps) {
  const [pieces, setPieces] = useState<PieceRow[]>(
    initialPieces.length > 0 ? initialPieces.map(toPieceRow) : [],
  );

  const addPiece = useCallback(() => {
    setPieces((prev) => [...prev, toPieceRow({ label: "", widthIn: 0, heightIn: 0 })]);
  }, []);

  const addPreset = useCallback((preset: (typeof PIECE_PRESETS)[number]) => {
    setPieces((prev) => [
      ...prev,
      toPieceRow({ label: preset.label, widthIn: preset.widthIn, heightIn: preset.heightIn }),
    ]);
  }, []);

  const updatePiece = useCallback((key: number, field: keyof Piece, value: string | number) => {
    setPieces((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)),
    );
  }, []);

  const removePiece = useCallback((key: number) => {
    setPieces((prev) => prev.filter((p) => p.key !== key));
  }, []);

  const isValid =
    pieces.length > 0 &&
    pieces.every((p) => p.label.trim() && p.widthIn > 0 && p.heightIn > 0);

  const sqft = totalSqft(pieces);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    onSearch(
      pieces.map(({ label, widthIn, heightIn }) => ({ label, widthIn, heightIn })),
    );
  }, [isValid, onSearch, pieces]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* Header with optional photo thumbnail */}
      <div className="flex items-start gap-4">
        {imageUrl && (
          <div className="hidden h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 sm:block dark:border-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Your space" className="h-full w-full object-cover" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Define your pieces</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Add the stone pieces you need for your project. SmartFinder will search the
            inventory for slabs that can accommodate all of them.
          </p>
        </div>
      </div>

      {/* AI auto-fill notice */}
      {autoFilled && pieces.length > 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-4 text-sm">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="mt-0.5 flex-shrink-0 text-brand-strong"
          >
            <path
              d="M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-slate-700 dark:text-slate-200">
            <span className="font-semibold">Auto-filled from your plan.</span>{" "}
            Please review each piece and adjust the labels and dimensions before
            searching — AI estimates can be imperfect.
          </p>
        </div>
      ) : null}

      {/* Quick presets */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Quick add
        </p>
        <div className="flex flex-wrap gap-2">
          {PIECE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => addPreset(preset)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand-strong dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {preset.label}
              <span className="text-slate-400">
                {preset.widthIn}×{preset.heightIn}&quot;
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Piece list */}
      <div className="flex flex-col gap-3">
        {pieces.map((piece, index) => (
          <div
            key={piece.key}
            className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-sm sm:flex-row sm:items-end dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Label */}
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Piece {index + 1}
              </label>
              <input
                type="text"
                value={piece.label}
                onChange={(e) => updatePiece(piece.key, "label", e.target.value)}
                placeholder="e.g. Kitchen counter"
                className="h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700"
              />
            </div>

            {/* Width */}
            <div className="w-28">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Width (in)
              </label>
              <input
                type="number"
                min="1"
                max="600"
                step="0.5"
                value={piece.widthIn || ""}
                onChange={(e) => updatePiece(piece.key, "widthIn", Number(e.target.value))}
                placeholder="96"
                className="h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700"
              />
            </div>

            {/* Height */}
            <div className="w-28">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Height (in)
              </label>
              <input
                type="number"
                min="1"
                max="600"
                step="0.5"
                value={piece.heightIn || ""}
                onChange={(e) => updatePiece(piece.key, "heightIn", Number(e.target.value))}
                placeholder="26"
                className="h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700"
              />
            </div>

            {/* Area display */}
            <div className="flex items-end gap-2">
              <span className="mb-2 whitespace-nowrap text-xs text-slate-400">
                {piece.widthIn > 0 && piece.heightIn > 0
                  ? `${((piece.widthIn * piece.heightIn) / 144).toFixed(1)} sq ft`
                  : "—"}
              </span>
              <button
                type="button"
                onClick={() => removePiece(piece.key)}
                aria-label={`Remove ${piece.label || "piece"}`}
                className="mb-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {/* Add custom piece */}
        <button
          type="button"
          onClick={addPiece}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 text-sm font-medium text-slate-500 transition hover:border-brand hover:text-brand-strong dark:border-slate-700 dark:hover:border-brand"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add custom piece
        </button>
      </div>

      {/* Summary + actions */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-brand/5 to-transparent p-5 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {pieces.length} piece{pieces.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xl font-semibold tracking-tight">
              {sqft > 0 ? `${sqft.toFixed(1)} sq ft` : "0.0 sq ft"}{" "}
              <span className="text-sm font-normal text-slate-400">total area</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-sm font-medium text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Find matching slabs
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
