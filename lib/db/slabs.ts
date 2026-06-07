import { and, desc, eq } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { ensureMaterials } from "@/lib/db/materials";
import {
  finishTypeEnum,
  slabImages,
  slabs,
  slabStatusEnum,
  slabTypeEnum,
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
    contactName: string | null;
    city: string | null;
    state: string | null;
  } | null;
};

const slabRelations = {
  images: true,
  material: {
    columns: { id: true, name: true, slug: true },
  },
  vendor: {
    columns: {
      id: true,
      companyName: true,
      contactName: true,
      city: true,
      state: true,
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
  widthCm?: number,
  heightCm?: number,
): string | undefined {
  if (!widthCm || !heightCm || widthCm <= 0 || heightCm <= 0) {
    return undefined;
  }

  const sqft = (widthCm * heightCm) / 929.0304;

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
