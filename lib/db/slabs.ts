import { and, desc, eq, gt, inArray, lt, or, sql } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { ensureMaterials } from "@/lib/db/materials";
import {
  finishTypeEnum,
  slabImages,
  slabs,
  slabStatusEnum,
  slabTypeEnum,
  transactions,
  users,
} from "@/lib/db/schema";

export type SlabFinish = (typeof finishTypeEnum.enumValues)[number];
export type SlabKind = (typeof slabTypeEnum.enumValues)[number];
export type SlabStatus = (typeof slabStatusEnum.enumValues)[number];

export type SlabWithRelations = typeof slabs.$inferSelect & {
  images: (typeof slabImages.$inferSelect)[];
  material: { id: string; name: string; slug: string } | null;
  vendor: {
    id: string;
    companyName: string | null;
  } | null;
};

// Public projection: never expose the vendor's address, phone, or email here.
// Exact contact details are gated behind a paid transaction (see
// getVendorContactForSlab).
const slabRelations = {
  images: true,
  material: {
    columns: { id: true, name: true, slug: true },
  },
  vendor: {
    columns: {
      id: true,
      companyName: true,
    },
  },
} as const;

export type ListPublicSlabsOptions = {
  materialSlug?: string;
  limit?: number;
};

export async function listPublicSlabs(
  options: ListPublicSlabsOptions = {},
): Promise<SlabWithRelations[]> {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db.query.slabs.findMany({
    where: eq(slabs.status, "available"),
    with: slabRelations,
    orderBy: desc(slabs.createdAt),
    limit: options.limit ?? 60,
  });

  const filtered = options.materialSlug
    ? rows.filter((row) => row.material?.slug === options.materialSlug)
    : rows;

  return filtered as SlabWithRelations[];
}

export async function getSlabById(
  id: string,
): Promise<SlabWithRelations | null> {
  if (!isDbConfigured()) {
    return null;
  }

  const db = getDb();
  const row = await db.query.slabs.findFirst({
    where: eq(slabs.id, id),
    with: slabRelations,
  });

  return (row as SlabWithRelations | undefined) ?? null;
}

export async function listSlabsByVendor(
  vendorId: string,
): Promise<SlabWithRelations[]> {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db.query.slabs.findMany({
    where: eq(slabs.vendorId, vendorId),
    with: slabRelations,
    orderBy: desc(slabs.createdAt),
  });

  return rows as SlabWithRelations[];
}

export type CreateSlabInput = {
  vendorId: string;
  name: string;
  type: SlabKind;
  materialId?: string;
  finish: SlabFinish;
  colorFamily?: string;
  brandSupplier?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  roomUse?: string[];
  aestheticTags?: string[];
  widthCm?: number;
  heightCm?: number;
  thicknessCm?: number;
  price: number;
  quantity: number;
  isNegotiable: boolean;
  notes?: string;
  imageUrls?: string[];
};

function computePricePerSqft(
  price: number,
  widthIn?: number,
  heightIn?: number,
): string | undefined {
  if (!widthIn || !heightIn || widthIn <= 0 || heightIn <= 0) {
    return undefined;
  }

  // Dimensions are in inches: square feet = (w * h) / 144.
  const sqft = (widthIn * heightIn) / 144;

  if (sqft <= 0) {
    return undefined;
  }

  return (price / sqft).toFixed(2);
}

export async function getSlabForVendor(
  slabId: string,
  vendorId: string,
): Promise<SlabWithRelations | null> {
  if (!isDbConfigured()) {
    return null;
  }

  const db = getDb();
  const row = await db.query.slabs.findFirst({
    where: and(eq(slabs.id, slabId), eq(slabs.vendorId, vendorId)),
    with: slabRelations,
  });

  return (row as SlabWithRelations | undefined) ?? null;
}

export type UpdateSlabInput = Omit<CreateSlabInput, "vendorId">;

export async function updateSlab(
  slabId: string,
  vendorId: string,
  input: UpdateSlabInput,
): Promise<void> {
  const db = getDb();

  const existing = await db.query.slabs.findFirst({
    where: and(eq(slabs.id, slabId), eq(slabs.vendorId, vendorId)),
    columns: { id: true, status: true },
  });

  if (!existing) {
    throw new Error("Listing not found.");
  }

  if (existing.status === "sold") {
    throw new Error("Sold listings cannot be edited.");
  }

  await db
    .update(slabs)
    .set({
      name: input.name,
      type: input.type,
      materialId: input.materialId,
      finish: input.finish,
      colorFamily: input.colorFamily,
      brandSupplier: input.brandSupplier,
      city: input.city,
      state: input.state,
      zip: input.zip,
      lat: input.lat?.toString(),
      lng: input.lng?.toString(),
      roomUse: input.roomUse ?? [],
      aestheticTags: input.aestheticTags ?? [],
      widthCm: input.widthCm?.toString(),
      heightCm: input.heightCm?.toString(),
      thicknessCm: input.thicknessCm?.toString(),
      price: input.price.toString(),
      pricePerSqft: computePricePerSqft(
        input.price,
        input.widthCm,
        input.heightCm,
      ),
      quantity: input.quantity,
      isNegotiable: input.isNegotiable,
      notes: input.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(slabs.id, slabId), eq(slabs.vendorId, vendorId)));

  await db.delete(slabImages).where(eq(slabImages.slabId, slabId));

  const imageUrls = (input.imageUrls ?? []).filter(Boolean);

  if (imageUrls.length > 0) {
    await db.insert(slabImages).values(
      imageUrls.map((url, index) => ({
        slabId,
        url,
        isPrimary: index === 0,
      })),
    );
  }
}

export async function deleteSlabForVendor(
  slabId: string,
  vendorId: string,
): Promise<void> {
  const db = getDb();

  const existing = await db.query.slabs.findFirst({
    where: and(eq(slabs.id, slabId), eq(slabs.vendorId, vendorId)),
    columns: { id: true, status: true },
  });

  if (!existing) {
    throw new Error("Listing not found.");
  }

  if (existing.status === "sold") {
    throw new Error("Sold listings cannot be deleted.");
  }

  const pendingSale = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.slabId, slabId),
      eq(transactions.status, "pending"),
    ),
  });

  if (pendingSale) {
    throw new Error("This listing has a pending checkout and cannot be deleted.");
  }

  await db
    .delete(slabs)
    .where(and(eq(slabs.id, slabId), eq(slabs.vendorId, vendorId)));
}

export async function createSlab(input: CreateSlabInput): Promise<string> {
  const db = getDb();
  await ensureMaterials();

  const [row] = await db
    .insert(slabs)
    .values({
      vendorId: input.vendorId,
      name: input.name,
      type: input.type,
      materialId: input.materialId,
      finish: input.finish,
      colorFamily: input.colorFamily,
      brandSupplier: input.brandSupplier,
      city: input.city,
      state: input.state,
      zip: input.zip,
      lat: input.lat?.toString(),
      lng: input.lng?.toString(),
      roomUse: input.roomUse ?? [],
      aestheticTags: input.aestheticTags ?? [],
      widthCm: input.widthCm?.toString(),
      heightCm: input.heightCm?.toString(),
      thicknessCm: input.thicknessCm?.toString(),
      price: input.price.toString(),
      pricePerSqft: computePricePerSqft(
        input.price,
        input.widthCm,
        input.heightCm,
      ),
      quantity: input.quantity,
      isNegotiable: input.isNegotiable,
      notes: input.notes,
      status: "available",
    })
    .returning({ id: slabs.id });

  const slabId = row.id;

  const imageUrls = (input.imageUrls ?? []).filter(Boolean);

  if (imageUrls.length > 0) {
    await db.insert(slabImages).values(
      imageUrls.map((url, index) => ({
        slabId,
        url,
        isPrimary: index === 0,
      })),
    );
  }

  return slabId;
}

export type VendorContact = {
  contactName: string | null;
  companyName: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

// Transaction statuses that grant a buyer access to the vendor's private
// contact details (i.e. once payment has been processed by Stripe).
const PAID_STATUSES = ["paid", "shipped", "delivered"] as const;

/**
 * Returns the vendor's full contact details for a slab ONLY when the given
 * buyer has a paid transaction for it. This prevents buyers from contacting
 * vendors directly and bypassing the platform before payment.
 */
export async function getVendorContactForSlab(
  slabId: string,
  buyerId: string | null,
): Promise<VendorContact | null> {
  if (!isDbConfigured() || !buyerId) {
    return null;
  }

  const db = getDb();

  const paid = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.slabId, slabId),
      eq(transactions.buyerId, buyerId),
      inArray(transactions.status, [...PAID_STATUSES]),
    ),
  });

  if (!paid) {
    return null;
  }

  const slab = await db.query.slabs.findFirst({
    where: eq(slabs.id, slabId),
    columns: { vendorId: true },
  });

  if (!slab) {
    return null;
  }

  const vendor = await db.query.users.findFirst({
    where: eq(users.id, slab.vendorId),
    columns: {
      contactName: true,
      companyName: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });

  return vendor ?? null;
}

export async function setSlabStatus(
  slabId: string,
  vendorId: string,
  status: SlabStatus,
): Promise<void> {
  const db = getDb();
  await db
    .update(slabs)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(slabs.id, slabId), eq(slabs.vendorId, vendorId)));
}

// Minutes a checkout reservation holds a slab before it auto-expires.
export const RESERVATION_MINUTES = 15;

/**
 * Atomically reserves a slab for a buyer to prevent two people buying the same
 * physical slab at once (the double-purchase race condition).
 *
 * This is a SINGLE conditional UPDATE — the row lock PostgreSQL takes for the
 * UPDATE serializes concurrent attempts, so exactly one caller can flip an
 * `available` slab to `reserved`. (The Neon HTTP driver does not support
 * interactive `SELECT ... FOR UPDATE` transactions, so a guarded UPDATE is both
 * correct and simpler here.) The same buyer may re-reserve their own in-flight
 * reservation (e.g. clicking "Buy now" twice).
 *
 * @returns true when the reservation was acquired, false when the slab is no
 *          longer available (already reserved by someone else or sold out).
 */
export async function reserveSlabForCheckout(
  slabId: string,
  buyerId: string,
): Promise<boolean> {
  const db = getDb();
  const reserved = await db
    .update(slabs)
    .set({
      status: "reserved",
      reservedBy: buyerId,
      reservedUntil: sql`now() + interval '${sql.raw(String(RESERVATION_MINUTES))} minutes'`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(slabs.id, slabId),
        gt(slabs.quantity, 0),
        or(
          eq(slabs.status, "available"),
          and(eq(slabs.status, "reserved"), eq(slabs.reservedBy, buyerId)),
          // Expired holds (buyer abandoned checkout) become available again
          // immediately — we don't rely on the cron for this.
          and(
            eq(slabs.status, "reserved"),
            lt(slabs.reservedUntil, new Date()),
          ),
        ),
      ),
    )
    .returning({ id: slabs.id });

  return reserved.length > 0;
}

/**
 * Releases a single slab's reservation back to `available` (used when checkout
 * creation fails, a payment fails, or a Stripe session expires). No-op unless
 * the slab is currently `reserved`.
 */
export async function releaseSlabReservation(slabId: string): Promise<void> {
  const db = getDb();
  await db
    .update(slabs)
    .set({
      status: "available",
      reservedBy: null,
      reservedUntil: null,
      updatedAt: new Date(),
    })
    .where(and(eq(slabs.id, slabId), eq(slabs.status, "reserved")));
}

/**
 * Safety net for the cron job: frees every reservation whose hold has expired.
 * Returns the number of slabs released.
 */
export async function releaseExpiredReservations(): Promise<number> {
  if (!isDbConfigured()) {
    return 0;
  }

  const db = getDb();
  const released = await db
    .update(slabs)
    .set({
      status: "available",
      reservedBy: null,
      reservedUntil: null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(slabs.status, "reserved"), lt(slabs.reservedUntil, new Date())),
    )
    .returning({ id: slabs.id });

  return released.length;
}
