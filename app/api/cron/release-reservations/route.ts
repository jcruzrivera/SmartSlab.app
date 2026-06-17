import { NextResponse } from "next/server";

import { isDbConfigured } from "@/lib/db/client";
import { releaseExpiredReservations } from "@/lib/db/slabs";

export const dynamic = "force-dynamic";

/**
 * Safety net for checkout reservations. Vercel Cron hits this every few minutes
 * (see vercel.json) and frees any slab whose 15-minute hold has lapsed but
 * whose Stripe webhook never arrived (network blips, etc.).
 *
 * Protected by CRON_SECRET: Vercel Cron sends it as a Bearer token automatically
 * when the env var is configured.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ released: 0 });
  }

  const released = await releaseExpiredReservations();
  return NextResponse.json({ released });
}
