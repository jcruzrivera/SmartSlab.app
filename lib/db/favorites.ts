import { and, desc, eq } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { favorites } from "@/lib/db/schema";
import type { SlabWithRelations } from "@/lib/db/slabs";

export async function isFavoriteSlab(
  userId: string | null | undefined,
  slabId: string,
): Promise<boolean> {
  if (!isDbConfigured() || !userId) {
    return false;
  }

  const db = getDb();
  const row = await db.query.favorites.findFirst({
    where: and(eq(favorites.userId, userId), eq(favorites.slabId, slabId)),
  });

  return Boolean(row);
}

export async function toggleFavoriteSlab(
  userId: string,
  slabId: string,
): Promise<boolean> {
  const db = getDb();
  const existing = await db.query.favorites.findFirst({
    where: and(eq(favorites.userId, userId), eq(favorites.slabId, slabId)),
  });

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
    return false;
  }

  await db.insert(favorites).values({ userId, slabId }).onConflictDoNothing();
  return true;
}

export type FavoriteWithSlab = typeof favorites.$inferSelect & {
  slab: SlabWithRelations | null;
};

export async function listFavoritesByUser(
  userId: string,
): Promise<FavoriteWithSlab[]> {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db.query.favorites.findMany({
    where: eq(favorites.userId, userId),
    orderBy: desc(favorites.createdAt),
    with: {
      slab: {
        with: {
          images: true,
          material: { columns: { id: true, name: true, slug: true } },
          vendor: { columns: { id: true, companyName: true } },
        },
      },
    },
  });

  return rows as FavoriteWithSlab[];
}
