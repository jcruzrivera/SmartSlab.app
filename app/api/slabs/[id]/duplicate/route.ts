import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { slabImages, slabs } from "@/lib/db/schema";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";

export const dynamic = "force-dynamic";

/**
 * Duplicates one of the vendor's own listings as a hidden draft so they can
 * tweak the dimensions/price before publishing. Quantity and sale state reset.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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

  const { id } = await params;
  const db = getDb();

  const original = await db.query.slabs.findFirst({
    where: and(eq(slabs.id, id), eq(slabs.vendorId, user.id)),
    with: { images: true },
  });

  if (!original) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const [duplicate] = await db
    .insert(slabs)
    .values({
      vendorId: original.vendorId,
      locationId: original.locationId,
      materialId: original.materialId,
      type: original.type,
      sku: original.sku,
      name: `${original.name} (copy)`,
      widthIn: original.widthIn,
      heightIn: original.heightIn,
      thicknessCm: original.thicknessCm,
      weightKg: original.weightKg,
      finish: original.finish,
      colorFamily: original.colorFamily,
      brandSupplier: original.brandSupplier,
      city: original.city,
      state: original.state,
      zip: original.zip,
      lat: original.lat,
      lng: original.lng,
      roomUse: original.roomUse,
      aestheticTags: original.aestheticTags,
      price: original.price,
      pricePerSqft: original.pricePerSqft,
      notes: original.notes,
      isNegotiable: original.isNegotiable,
      // Reset sale/availability state for the new draft.
      status: "hidden",
      quantity: 1,
      quantitySold: 0,
      reservedBy: null,
      reservedUntil: null,
    })
    .returning({ id: slabs.id });

  if (original.images.length > 0) {
    await db.insert(slabImages).values(
      original.images.map((image) => ({
        slabId: duplicate.id,
        url: image.url,
        isPrimary: image.isPrimary,
      })),
    );
  }

  return NextResponse.json({ id: duplicate.id });
}
