import { NextResponse } from "next/server";

import { isDbConfigured } from "@/lib/db/client";
import { getPublicStoreBySlug } from "@/lib/db/stores";
import { PUBLIC_STORE_HEADERS } from "@/lib/stores/public-headers";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;

  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: { code: "not_found" } },
      { status: 404, headers: PUBLIC_STORE_HEADERS },
    );
  }

  const store = await getPublicStoreBySlug(slug);

  if (!store) {
    return NextResponse.json(
      { error: { code: "not_found" } },
      { status: 404, headers: PUBLIC_STORE_HEADERS },
    );
  }

  return NextResponse.json(store, { headers: PUBLIC_STORE_HEADERS });
}
