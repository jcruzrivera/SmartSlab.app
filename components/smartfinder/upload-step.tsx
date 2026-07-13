"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Piece } from "@/lib/smartfinder/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

type UploadStepProps = {
  imageUrl: string | null;
  /** Use an image purely as an on-device visual reference (no AI, no upload). */
  onImageSelected: (url: string | null) => void;
  /** Pieces auto-filled by AI from an uploaded plan/photo. */
  onPiecesExtracted: (pieces: Piece[], imageUrl: string | null) => void;
  onSkip: () => void;
};

const ACCEPT = ".pdf,.dxf,image/jpeg,image/png,image/webp,image/gif";
const MAX_FILE_BYTES = 12 * 1024 * 1024;

function isDxf(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".dxf") ||
    file.type === "application/dxf" ||
    file.type === "application/x-dxf" ||
    file.type === "image/vnd.dxf"
  );
}

function isImage(file: File): boolean {
  return file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".dxf");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function UploadStep({
  imageUrl,
  onImageSelected,
  onPiecesExtracted,
  onSkip,
}: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(imageUrl);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [dxfSupported, setDxfSupported] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/smartfinder/extract-pieces", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { configured: false, dxfSupported: true }))
      .then((data: { configured?: boolean; dxfSupported?: boolean }) => {
        if (!active) return;
        setAiConfigured(Boolean(data.configured));
        setDxfSupported(data.dxfSupported !== false);
      })
      .catch(() => {
        if (active) {
          setAiConfigured(false);
          setDxfSupported(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleFile = useCallback(
    (selected: File | undefined) => {
      if (!selected) return;
      setError(null);
      if (selected.size > MAX_FILE_BYTES) {
        setError("File is too large (max 12 MB).");
        return;
      }
      // Without AI: images (reference) + DXF (geometric). With AI/unknown: all plan types.
      if (
        aiConfigured === false &&
        !isImage(selected) &&
        !(dxfSupported && isDxf(selected))
      ) {
        setError("Upload an image (JPG, PNG, WebP) or a DXF file.");
        return;
      }
      setPreview((prev) => {
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return isImage(selected) ? URL.createObjectURL(selected) : null;
      });
      setFile(selected);
    },
    [aiConfigured, dxfSupported],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFile(e.target.files?.[0]);
    },
    [handleFile],
  );

  const handleRemove = useCallback(() => {
    setPreview((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setFile(null);
    setError(null);
  }, []);

  const handleExtract = useCallback(async () => {
    if (!file) return;
    setExtracting(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/smartfinder/extract-pieces", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as {
        pieces?: Piece[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not read the file. Try another one.");
        return;
      }
      if (!data.pieces || data.pieces.length === 0) {
        setError(
          "No stone pieces were detected in that file. You can add them manually.",
        );
        return;
      }
      onPiecesExtracted(data.pieces, isImage(file) ? preview : null);
    } catch {
      setError("Something went wrong analyzing the file. Please try again.");
    } finally {
      setExtracting(false);
    }
  }, [file, onPiecesExtracted, preview]);

  const handleUseAsReference = useCallback(() => {
    onImageSelected(preview);
  }, [onImageSelected, preview]);

  const showAi = aiConfigured !== false;
  const canExtract =
    Boolean(file) &&
    (aiConfigured === true ||
      (Boolean(file && isDxf(file)) && dxfSupported) ||
      // While probing config, allow extract attempt for any selected file.
      aiConfigured === null);
  const acceptTypes =
    aiConfigured === false
      ? dxfSupported
        ? ".dxf,image/jpeg,image/png,image/webp,image/gif"
        : "image/jpeg,image/png,image/webp,image/gif"
      : ACCEPT;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          {showAi
            ? "Upload your plan to auto-fill pieces"
            : "Upload a photo of your space"}
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {showAi
            ? "Add a shop drawing, cut list, CAD export or photo and SmartFinder will read the dimensions and pre-fill your pieces. Supports PDF, DXF, JPG, PNG."
            : "Add a photo for context, or a DXF CAD export — SmartFinder reads closed outlines from DXF without AI."}
        </p>
      </div>

      {file ? (
        <div className="w-full">
          {preview ? (
            <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Uploaded plan"
                className="aspect-[16/10] w-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white backdrop-blur transition hover:bg-black/80"
                aria-label="Remove file"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand-strong">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatBytes(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                aria-label="Remove file"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          className={`flex w-full cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-8 py-16 text-center transition ${
            dragging
              ? "border-brand bg-brand/10"
              : "border-slate-300 bg-slate-50 hover:border-brand/50 hover:bg-brand/5 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand/40"
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15 text-brand-strong">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-200">
              {showAi ? "Drag & drop your plan here" : "Drag & drop your file here"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {showAi
                ? "or click to browse — PDF, DXF, JPG, PNG"
                : "or click to browse — DXF, JPG, PNG, WebP"}
            </p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleInputChange}
        className="hidden"
      />

      {error ? (
        <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {/* Actions */}
      <div className="flex w-full flex-col items-center gap-3">
        {file && canExtract ? (
          <button
            type="button"
            onClick={handleExtract}
            disabled={extracting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-6 text-sm font-medium text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {extracting ? (
              <>
                <svg
                  className="animate-spin"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Reading your plan…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {file && isDxf(file)
                  ? "Extract pieces from DXF"
                  : "Auto-fill pieces with AI"}
              </>
            )}
          </button>
        ) : null}

        <div className="flex flex-col items-center gap-2 sm:flex-row">
          {file && preview ? (
            <button
              type="button"
              onClick={handleUseAsReference}
              className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-6 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Use as reference photo
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-6 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Skip — define pieces manually
          </button>
        </div>
      </div>

      {file && canExtract ? (
        <p className="max-w-md text-center text-xs text-slate-400">
          {file && isDxf(file)
            ? "DXF outlines are read geometrically on the server. Always review the pieces before searching."
            : "Files are sent securely to our AI provider only to read dimensions. Always review the auto-filled pieces before searching."}
        </p>
      ) : null}
    </div>
  );
}
