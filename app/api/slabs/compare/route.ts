import { NextResponse } from "next/server";

import { listPublicSlabsByIds } from "@/lib/db/slabs";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);

  const slabs = await listPublicSlabsByIds(ids);
  return NextResponse.json({ slabs });
}
