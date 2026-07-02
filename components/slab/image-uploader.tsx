"use client";

import { useRef, useState } from "react";

import type { SlabImageAnalysis } from "@/lib/ai/slab-analysis";

const MAX_IMAGES = 6;

type ImageUploaderProps = {
  initialUrls?: string[];
  enableAnalysis?: boolean;
  onAnalysis?: (analysis: SlabImageAnalysis) => void;
  onUrlsChange?: (urls: string[]) => void;
};

export function ImageUploader({
  initialUrls = [],
  enableAnalysis = false,
  onAnalysis,
  onUrlsChange,
}: ImageUploaderProps) {
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisNote, setAnalysisNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const analyzedUrlRef = useRef<string | null>(null);

  const remaining = MAX_IMAGES - urls.length;

  function commitUrls(next: string[]) {
    setUrls(next);
    onUrlsChange?.(next);
  }

  async function analyzeImage(imageUrl: string) {
    if (!enableAnalysis || !onAnalysis || analyzedUrlRef.current === imageUrl) {
      return;
    }

    analyzedUrlRef.current = imageUrl;
    setIsAnalyzing(true);
    setAnalysisNote(null);

    try {
      const response = await fetch("/api/slabs/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = (await response.json()) as {
        analysis?: SlabImageAnalysis;
        configured?: boolean;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 503) {
          setAnalysisNote("Add OPENAI_API_KEY or ANTHROPIC_API_KEY to auto-fill details.");
          return;
        }
        throw new Error(data.error ?? "Analysis failed.");
      }

      if (data.analysis && Object.keys(data.analysis).length > 0) {
        onAnalysis(data.analysis);
        const priceHint =
          data.analysis.suggestedPriceUsd && data.analysis.suggestedPriceUsd > 0
            ? ` Suggested price: $${data.analysis.suggestedPriceUsd.toLocaleString("en-US")}.`
            : "";
        setAnalysisNote(
          `Details suggested from your photo — review before publishing.${priceHint}`,
        );
      }
    } catch (analysisError) {
      setAnalysisNote(
        analysisError instanceof Error
          ? analysisError.message
          : "Could not analyze photo.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !data.url) {
      throw new Error(data.error ?? "Could not upload image.");
    }

    return data.url;
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    setError(null);
    const files = Array.from(fileList).slice(0, remaining);

    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push(await uploadFile(file));
      }

      const next = [...urls, ...uploaded];
      commitUrls(next);
      if (enableAnalysis && urls.length === 0 && uploaded[0]) {
        void analyzeImage(uploaded[0]);
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : String(uploadError);
      const isTokenError = /token/i.test(message);
      setError(
        isTokenError
          ? "Photo storage is not configured yet. Paste an image URL below instead."
          : message || "Could not upload image.",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }
    }
  }

  function addManualUrl() {
    const value = manualUrl.trim();
    if (!value) {
      return;
    }

    try {
      new URL(value);
    } catch {
      setError("Please enter a valid image URL.");
      return;
    }

    if (urls.length >= MAX_IMAGES) {
      return;
    }

    setError(null);
    const next = [...urls, value];
    commitUrls(next);
    if (enableAnalysis && urls.length === 0) {
      void analyzeImage(value);
    }
    setManualUrl("");
  }

  function removeUrl(target: string) {
    commitUrls(urls.filter((url) => url !== target));
    if (analyzedUrlRef.current === target) {
      analyzedUrlRef.current = null;
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {urls.map((url) => (
        <input key={url} type="hidden" name="imageUrls" value={url} />
      ))}

      {urls.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Slab"
                className="h-full w-full object-cover"
              />
              {index === 0 ? (
                <span className="absolute left-1 top-1 rounded bg-[#1bb0ce] px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Cover
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => removeUrl(url)}
                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {remaining > 0 ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              void handleFiles(event.dataTransfer.files);
            }}
            className="flex min-h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-[#1bb0ce] hover:bg-[#1bb0ce]/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/50"
          >
            <span className="text-3xl" aria-hidden>
              📷
            </span>
            <span className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-100">
              {isUploading ? "Uploading…" : "Add photos"}
            </span>
            <span className="mt-1 text-sm text-slate-500">
              Tap, drag &amp; drop, or choose from gallery · up to {MAX_IMAGES}
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => void handleFiles(event.target.files)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handleFiles(event.target.files)}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Gallery
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => cameraInputRef.current?.click()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Camera
            </button>
            <span className="self-center text-xs text-slate-500">
              {remaining} photo{remaining === 1 ? "" : "s"} left
            </span>
          </div>

          <details className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
            <summary className="cursor-pointer text-sm text-slate-600 dark:text-slate-300">
              Paste image URL instead
            </summary>
            <div className="mt-2 flex gap-2">
              <input
                type="url"
                value={manualUrl}
                onChange={(event) => setManualUrl(event.target.value)}
                placeholder="https://…"
                className="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#1bb0ce] dark:border-slate-700 dark:bg-slate-900"
              />
              <button
                type="button"
                onClick={addManualUrl}
                className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Add
              </button>
            </div>
          </details>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Maximum of {MAX_IMAGES} photos reached.
        </p>
      )}

      {isAnalyzing ? (
        <p className="rounded-lg bg-[#1bb0ce]/10 px-3 py-2 text-sm text-[#0d8fa8]">
          Analyzing photo for listing details…
        </p>
      ) : null}

      {analysisNote ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {analysisNote}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40">
          {error}
        </p>
      ) : null}
    </div>
  );
}
