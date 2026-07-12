import { and, eq, gt, sql } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { inventoryEvents, slabs } from "@/lib/db/schema";

export type UsageEventType = "used" | "sold_offline";

export type InventoryActionResult = {
  quantity: number;
  status: string;
};

// NOTE: The Neon HTTP driver does not support interactive transactions, so we
// can't wrap the quantity change and the audit-log insert in one transaction.
// The quantity mutation itself is a single guarded UPDATE (atomic, same pattern
// as reserveSlabForCheckout), which is the part that must not race. The event
// row is written immediately after and is best-effort audit history.

/**
 * Records a "used" or "sold_offline" event: atomically decrements quantity by 1
 * (only while quantity > 0), flips status to `sold` when it reaches 0, and logs
 * an inventory_events row. Returns null when the slab isn't the vendor's or has
 * nothing left to decrement.
 */
export async function recordUsage(
  slabId: string,
  vendorId: string,
  type: UsageEventType,
  note?: string,
): Promise<InventoryActionResult | null> {
  const db = getDb();

  const [updated] = await db
    .update(slabs)
    .set({
      quantity: sql`${slabs.quantity} - 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(slabs.id, slabId),
        eq(slabs.vendorId, vendorId),
        gt(slabs.quantity, 0),
      ),
    )
    .returning({ quantity: slabs.quantity });

  if (!updated) {
    return null;
  }

  let status = "available";

  if (updated.quantity <= 0) {
    const [sold] = await db
      .update(slabs)
      .set({ status: "sold", updatedAt: new Date() })
      .where(and(eq(slabs.id, slabId), eq(slabs.vendorId, vendorId)))
      .returning({ status: slabs.status });
    status = sold?.status ?? "sold";
  } else {
    const [row] = await db
      .select({ status: slabs.status })
      .from(slabs)
      .where(eq(slabs.id, slabId));
    status = row?.status ?? "available";
  }

  await db.insert(inventoryEvents).values({
    slabId,
    vendorId,
    eventType: type,
    quantityDelta: -1,
    note: note?.trim() || null,
  });

  return { quantity: updated.quantity, status };
}

/**
 * Manual quantity correction. `delta` may be positive or negative; the result
 * is clamped at 0. A slab that lands on 0 is marked `sold`; one that comes back
 * above 0 from a `sold`/`hidden` state is reopened as `available`. Logs an
 * `adjusted` event with the actual delta applied.
 */
export async function adjustQuantity(
  slabId: string,
  vendorId: string,
  delta: number,
  note?: string,
): Promise<InventoryActionResult | null> {
  if (!Number.isInteger(delta) || delta === 0) {
    return null;
  }

  const db = getDb();

  const [current] = await db
    .select({ quantity: slabs.quantity, status: slabs.status })
    .from(slabs)
    .where(and(eq(slabs.id, slabId), eq(slabs.vendorId, vendorId)));

  if (!current) {
    return null;
  }

  const nextQuantity = Math.max(0, current.quantity + delta);
  const appliedDelta = nextQuantity - current.quantity;

  if (appliedDelta === 0) {
    return { quantity: current.quantity, status: current.status };
  }

  let nextStatus = current.status;
  if (nextQuantity === 0) {
    nextStatus = "sold";
  } else if (current.status === "sold" || current.status === "hidden") {
    nextStatus = "available";
  }

  const [updated] = await db
    .update(slabs)
    .set({
      quantity: nextQuantity,
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(and(eq(slabs.id, slabId), eq(slabs.vendorId, vendorId)))
    .returning({ quantity: slabs.quantity, status: slabs.status });

  if (!updated) {
    return null;
  }

  await db.insert(inventoryEvents).values({
    slabId,
    vendorId,
    eventType: "adjusted",
    quantityDelta: appliedDelta,
    note: note?.trim() || null,
  });

  return { quantity: updated.quantity, status: updated.status };
}

export function isDbReady(): boolean {
  return isDbConfigured();
}
