"use client";

import { useState } from "react";

import { getOptimizedImageUrl } from "@/lib/cloudinary/images";

type SlabImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "scale";
  loading?: "lazy" | "eager";
  fallback?: React.ReactNode;
};

export function SlabImage({
  src,
  alt,
  className,
  width = 800,
  height,
  crop = "fill",
  loading = "lazy",
  fallback,
}: SlabImageProps) {
  const [failed, setFailed] = useState(false);
  const optimized = getOptimizedImageUrl(src, { width, height, crop });

  if (!optimized || failed) {
    return (
      fallback ?? (
        <div
          className={`flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-slate-800 ${className ?? ""}`}
        >
          No photo
        </div>
      )
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimized}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
