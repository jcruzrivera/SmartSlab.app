import { NextResponse } from "next/server";
import { z } from "zod";

import { isDbConfigured } from "@/lib/db/client";
import { adjustQuantity, recordUsage } from "@/lib/db/inventory";
import { getSlabForVendor } from "@/lib/db/slabs";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slabId: z.string().uuid(),
  type: z.enum(["used", "sold_offline", "adjusted"]),
  note: z.string().max(500).optional(),
  delta: z.number().int().optional(),
});

/**
 * Records an inventory movement for one of the current vendor's slabs. Used by
 * the mobile quick-action page after a QR scan.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database is not connected." },
      { status: 503 },
    );
  }

  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { slabId, type, note, delta } = parsed.data;

  const slab = await getSlabForVendor(slabId, user.id);
  if (!slab) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (type === "adjusted") {
    if (typeof delta !== "number" || delta === 0) {
      return NextResponse.json(
        { error: "A non-zero quantity delta is required." },
        { status: 400 },
      );
    }
    const result = await adjustQuantity(slabId, user.id, delta, note);
    if (!result) {
      return NextResponse.json(
        { error: "Could not adjust this listing." },
        { status: 409 },
      );
    }
    return NextResponse.json(result);
  }

  const result = await recordUsage(slabId, user.id, type, note);
  if (!result) {
    return NextResponse.json(
      { error: "This listing has no remaining quantity." },
      { status: 409 },
    );
  }

  return NextResponse.json(result);
}
