import { and, asc, count, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { materials, slabImages, slabs, users } from "@/lib/db/schema";

export type PublicStoreSummary = {
  slug: string;
  store_name: string;
  city: string | null;
  state: string | null;
  slab_count: number;
};

export type PublicStoreVendor = {
  slug: string;
  store_name: string;
  city: string | null;
  state: string | null;
};

export type PublicStoreSlab = {
  id: string;
  name: string;
  material: string | null;
  type: string;
  width_in: number | null;
  height_in: number | null;
  thickness_cm: number | null;
  price_usd: number;
  image_url: string | null;
  quantity: number;
};

export type PublicStoreDetail = {
  vendor: PublicStoreVendor;
  slabs: PublicStoreSlab[];
};

function storeName(row: {
  companyName: string | null;
  contactName: string | null;
}): string {
  return row.companyName?.trim() || row.contactName?.trim() || "Store";
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Directory of public vendor storefronts with at least one available slab. */
export async function listPublicStores(): Promise<PublicStoreSummary[]> {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();

  const rows = await db
    .select({
      slug: users.storeSlug,
      companyName: users.companyName,
      contactName: users.contactName,
      city: users.city,
      state: users.state,
      slabCount: count(slabs.id),
    })
    .from(users)
    .innerJoin(
      slabs,
      and(
        eq(slabs.vendorId, users.id),
        eq(slabs.status, "available"),
        isNull(slabs.deletedAt),
      ),
    )
    .where(and(eq(users.storePublic, true), isNotNull(users.storeSlug)))
    .groupBy(
      users.id,
      users.storeSlug,
      users.companyName,
      users.contactName,
      users.city,
      users.state,
    )
    .orderBy(desc(count(slabs.id)));

  return rows
    .filter((row): row is typeof row & { slug: string } => Boolean(row.slug))
    .map((row) => ({
      slug: row.slug,
      store_name: storeName(row),
      city: row.city,
      state: row.state,
      slab_count: Number(row.slabCount),
    }));
}

/** Single public store + allowlisted inventory. Null when not found / private. */
export async function getPublicStoreBySlug(
  slug: string,
): Promise<PublicStoreDetail | null> {
  if (!isDbConfigured() || !slug.trim()) {
    return null;
  }

  const db = getDb();

  const vendor = await db.query.users.findFirst({
    where: and(eq(users.storeSlug, slug), eq(users.storePublic, true)),
    columns: {
      id: true,
      storeSlug: true,
      companyName: true,
      contactName: true,
      city: true,
      state: true,
    },
  });

  if (!vendor?.storeSlug) {
    return null;
  }

  const inventory = await db
    .select({
      id: slabs.id,
      name: slabs.name,
      type: slabs.type,
      widthIn: slabs.widthIn,
      heightIn: slabs.heightIn,
      thicknessCm: slabs.thicknessCm,
      price: slabs.price,
      quantity: slabs.quantity,
      quantitySold: slabs.quantitySold,
      materialSlug: materials.slug,
    })
    .from(slabs)
    .leftJoin(materials, eq(materials.id, slabs.materialId))
    .where(
      and(
        eq(slabs.vendorId, vendor.id),
        eq(slabs.status, "available"),
        isNull(slabs.deletedAt),
      ),
    )
    .orderBy(desc(slabs.createdAt));

  const slabIds = inventory.map((row) => row.id);
  const imageBySlab = new Map<string, string>();

  if (slabIds.length > 0) {
    const images = await db
      .select({
        slabId: slabImages.slabId,
        url: slabImages.url,
        isPrimary: slabImages.isPrimary,
        createdAt: slabImages.createdAt,
      })
      .from(slabImages)
      .where(inArray(slabImages.slabId, slabIds))
      .orderBy(desc(slabImages.isPrimary), asc(slabImages.createdAt));

    for (const image of images) {
      if (!imageBySlab.has(image.slabId)) {
        imageBySlab.set(image.slabId, image.url);
      }
    }
  }

  return {
    vendor: {
      slug: vendor.storeSlug,
      store_name: storeName(vendor),
      city: vendor.city,
      state: vendor.state,
    },
    slabs: inventory.map((row) => ({
      id: row.id,
      name: row.name,
      material: row.materialSlug ?? null,
      type: row.type,
      width_in: toNumber(row.widthIn),
      height_in: toNumber(row.heightIn),
      thickness_cm: toNumber(row.thicknessCm),
      price_usd: toNumber(row.price) ?? 0,
      image_url: imageBySlab.get(row.id) ?? null,
      quantity: Math.max(0, row.quantity - row.quantitySold),
    })),
  };
}

export async function storeSlugExists(
  slug: string,
  excludeUserId?: string,
): Promise<boolean> {
  if (!isDbConfigured()) {
    return false;
  }

  const db = getDb();
  const row = await db.query.users.findFirst({
    where: eq(users.storeSlug, slug),
    columns: { id: true },
  });

  if (!row) {
    return false;
  }

  if (excludeUserId && row.id === excludeUserId) {
    return false;
  }

  return true;
}
