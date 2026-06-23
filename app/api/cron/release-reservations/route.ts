import { NextResponse } from "next/server";

import { isDbConfigured } from "@/lib/db/client";
import { releaseExpiredReservations } from "@/lib/db/slabs";

export const dynamic = "force-dynamic";

/**
 * Safety net for checkout reservations. Vercel Cron hits this on Hobby once
 * per day (see vercel.json). Stripe webhooks and checkout reservation logic
 * release expired holds sooner; this sweeps any stragglers.
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
