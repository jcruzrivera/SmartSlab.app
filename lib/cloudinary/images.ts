import { getCloudinaryCloudName, isCloudinaryConfigured } from "@/lib/cloudinary/config";

export type ImageTransformOptions = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "scale";
  quality?: "auto" | number;
};

function buildTransformSegment(options: ImageTransformOptions): string {
  const parts: string[] = [];

  if (options.width) {
    parts.push(`w_${options.width}`);
  }
  if (options.height) {
    parts.push(`h_${options.height}`);
  }
  if (options.crop) {
    parts.push(`c_${options.crop}`);
  }

  parts.push(`q_${options.quality ?? "auto"}`, "f_auto");

  return parts.join(",");
}

function injectCloudinaryTransform(url: string, transform: string): string {
  const marker = "/upload/";
  const index = url.indexOf(marker);

  if (index === -1) {
    return url;
  }

  const prefix = url.slice(0, index + marker.length);
  const suffix = url.slice(index + marker.length);

  if (/^(w_|h_|c_|q_|f_)/.test(suffix)) {
    return url;
  }

  return `${prefix}${transform}/${suffix}`;
}

export function getOptimizedImageUrl(
  src: string | null | undefined,
  options: ImageTransformOptions = {},
): string | undefined {
  if (!src) {
    return undefined;
  }

  const cloud = getCloudinaryCloudName();

  if (!cloud || !isCloudinaryConfigured()) {
    return src;
  }

  const transform = buildTransformSegment(options);

  if (src.includes("res.cloudinary.com")) {
    return injectCloudinaryTransform(src, transform);
  }

  return `https://res.cloudinary.com/${cloud}/image/fetch/${transform}/${encodeURIComponent(src)}`;
}
