"use client";

import { useState } from "react";

type SlabPhotoProps = {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

/**
 * Renders a photo using URLs computed on the server. Never transforms URLs
 * on the client — only falls back if the primary src fails to load.
 */
export function SlabPhoto({
  src,
  fallbackSrc,
  alt,
  className,
  loading = "lazy",
}: SlabPhotoProps) {
  const [displaySrc, setDisplaySrc] = useState(src);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-slate-800 ${className ?? ""}`}
      >
        No photo
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displaySrc}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => {
        if (fallbackSrc && displaySrc !== fallbackSrc) {
          setDisplaySrc(fallbackSrc);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
