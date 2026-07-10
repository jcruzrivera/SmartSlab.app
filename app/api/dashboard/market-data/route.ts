import { NextResponse } from "next/server";

import { isDbConfigured } from "@/lib/db/client";
import { listSlabsByVendor } from "@/lib/db/slabs";
import { listSalesByVendor } from "@/lib/db/transactions";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { buildVendorInsights } from "@/lib/dashboard/insights";
import { assertMarketDataAccess, isPlanLimitError } from "@/lib/plan/enforce";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }

  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertMarketDataAccess(user);
  } catch (error) {
    if (isPlanLimitError(error)) {
      return NextResponse.json(error.toJSON(), { status: 403 });
    }
    return NextResponse.json(
      { error: "Could not verify plan access." },
      { status: 500 },
    );
  }

  const slabs = await listSlabsByVendor(user.id);
  const sales = await listSalesByVendor(user.id);
  const insights = buildVendorInsights({ user, slabs, sales });

  return NextResponse.json({ performance: insights.performance });
}
