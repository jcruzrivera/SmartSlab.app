import { NextResponse } from "next/server";

import { getOptimizedImageUrl } from "@/lib/cloudinary/images";
import { listPublicSlabsByIds } from "@/lib/db/slabs";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);

  const rows = await listPublicSlabsByIds(ids);
  const slabs = rows.map((slab) => ({
    ...slab,
    images: slab.images.map((image) => ({
      ...image,
      url:
        getOptimizedImageUrl(image.url, {
          width: 320,
          height: 240,
          crop: "fill",
        }) ?? image.url,
    })),
  }));

  return NextResponse.json({ slabs });
}
