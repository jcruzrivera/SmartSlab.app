import { NextResponse } from "next/server";

import { CANONICAL_APP_ORIGIN } from "@/lib/app-origin";
import { isDbConfigured } from "@/lib/db/client";
import { getPublicStoreBySlug } from "@/lib/db/stores";
import { PUBLIC_STORE_HEADERS } from "@/lib/stores/public-headers";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 48;

function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: { code: "unauthorized" } },
    { status: 401, headers: PUBLIC_STORE_HEADERS },
  );
}

/**
 * Data source for the embeddable storefront widget (see /embed.js). The `key`
 * is the vendor's PUBLIC store slug — not a secret — so this is intentionally
 * unauthenticated and CORS-open. A missing or unknown/private slug returns 401
 * ("not allowed to embed") rather than leaking whether a slug exists.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (!isDbConfigured()) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const key = (searchParams.get("key") ?? "").trim();

  if (!key) {
    return unauthorized();
  }

  const store = await getPublicStoreBySlug(key);

  if (!store) {
    return unauthorized();
  }

  const material = (searchParams.get("material") ?? "").trim().toLowerCase();

  const parsedLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const slabs = store.slabs
    .filter((slab) => (material ? slab.material === material : true))
    .slice(0, limit)
    .map((slab) => ({
      ...slab,
      url: `${CANONICAL_APP_ORIGIN}/slab/${slab.id}?utm_source=embed`,
    }));

  return NextResponse.json(
    {
      store: store.vendor,
      store_url: CANONICAL_APP_ORIGIN,
      slabs,
    },
    { headers: PUBLIC_STORE_HEADERS },
  );
}
