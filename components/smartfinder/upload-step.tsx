"use client";

import { useCallback, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

type UploadStepProps = {
  imageUrl: string | null;
  onImageSelected: (url: string | null) => void;
  onSkip: () => void;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function UploadStep({ imageUrl, onImageSelected, onSkip }: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(imageUrl);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || !file.type.startsWith("image/")) return;
      // Revoke any previous object URL to avoid memory leaks
      if (preview) URL.revokeObjectURL(preview);
      const url = URL.createObjectURL(file);
      setPreview(url);
    },
    [preview],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFile(e.target.files?.[0]);
    },
    [handleFile],
  );

  const handleConfirm = useCallback(() => {
    onImageSelected(preview);
  }, [onImageSelected, preview]);

  const handleRemove = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }, [preview]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Upload a photo of your space
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Add a photo of the room you&apos;re designing (kitchen, bathroom, etc.)
          to help you visualize the stone in context. This photo stays on your
          device and is never uploaded.
        </p>
      </div>

      {/* Drop zone / preview */}
      {preview ? (
        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Uploaded space"
            className="aspect-[16/10] w-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white backdrop-blur transition hover:bg-black/80"
            aria-label="Remove photo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex w-full cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-8 py-16 text-center transition ${
            dragging
              ? "border-[#1bb0ce] bg-[#1bb0ce]/10"
              : "border-slate-300 bg-slate-50 hover:border-[#1bb0ce]/50 hover:bg-[#1bb0ce]/5 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-[#1bb0ce]/40"
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1bb0ce]/15 text-[#0d8fa8]">
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
              Drag &amp; drop your photo here
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              or click to browse — JPG, PNG, WebP
            </p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Actions */}
      <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {preview && (
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex h-11 items-center rounded-lg bg-[#1bb0ce] px-6 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
          >
            Continue with photo
          </button>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-6 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Skip — define pieces only
        </button>
      </div>
    </div>
  );
}
