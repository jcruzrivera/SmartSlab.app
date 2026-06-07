import { and, desc, eq, inArray } from "drizzle-orm";

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
