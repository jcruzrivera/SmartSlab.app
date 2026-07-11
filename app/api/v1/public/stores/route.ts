import { NextResponse } from "next/server";

import { isDbConfigured } from "@/lib/db/client";
import { listPublicStores } from "@/lib/db/stores";
import { PUBLIC_STORE_HEADERS } from "@/lib/stores/public-headers";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { stores: [] },
      { headers: PUBLIC_STORE_HEADERS },
    );
  }

  const stores = await listPublicStores();
  return NextResponse.json({ stores }, { headers: PUBLIC_STORE_HEADERS });
}
