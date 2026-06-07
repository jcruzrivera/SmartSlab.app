"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";

const MAX_IMAGES = 6;

export function ImageUploader() {
  const [urls, setUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_IMAGES - urls.length;

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
        const result = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        uploaded.push(result.url);
      }
      setUrls((prev) => [...prev, ...uploaded]);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : String(uploadError);
      const isTokenError = /token/i.test(message);
      setError(
        isTokenError
          ? "Photo storage isn't set up yet (Vercel Blob). Paste an image URL below to add photos for now."
          : message || "Could not upload image. You can paste an image URL instead.",
      );
    } finally {
      setIsUploading(false);
      if (galleryInputRef.current) {
        galleryInputRef.current.value = "";
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
    setUrls((prev) => [...prev, value]);
    setManualUrl("");
  }

  function removeUrl(target: string) {
    setUrls((prev) => prev.filter((url) => url !== target));
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
              className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Slab" className="h-full w-full object-cover" />
              {index === 0 ? (
                <span className="absolute left-1 top-1 rounded bg-[#1bb0ce] px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Cover
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => removeUrl(url)}
                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {remaining > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 transition hover:border-[#1bb0ce] dark:border-slate-700 ${
                isUploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => handleFiles(event.target.files)}
              />
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Gallery / files
              </span>
              <span className="mt-0.5 text-xs">JPG · PNG · WEBP · 10MB</span>
            </label>

            <label
              className={`flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 transition hover:border-[#1bb0ce] dark:border-slate-700 ${
                isUploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => handleFiles(event.target.files)}
              />
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Take photo
              </span>
              <span className="mt-0.5 text-xs">Use device camera</span>
            </label>
          </div>

          {isUploading ? (
            <p className="text-xs text-slate-500">Uploading… please wait.</p>
          ) : (
            <p className="text-xs text-slate-500">{remaining} photo(s) left</p>
          )}

          <div className="flex gap-2">
            <input
              type="url"
              value={manualUrl}
              onChange={(event) => setManualUrl(event.target.value)}
              placeholder="…or paste an image URL"
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
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Maximum of {MAX_IMAGES} photos reached.
        </p>
      )}

      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40">
          {error}
        </p>
      ) : null}
    </div>
  );
}
