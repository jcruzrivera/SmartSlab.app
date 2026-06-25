import { desc, eq } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import {
  quoteRequests,
  quoteStatusEnum,
  slabs,
  slabStatusEnum,
  transactions,
  users,
} from "@/lib/db/schema";
import type { SlabStatus } from "@/lib/db/slabs";
import type { QuoteStatus } from "@/lib/db/quotes";

export type AdminOverview = {
  users: (typeof users.$inferSelect)[];
  slabs: Awaited<ReturnType<typeof listAdminSlabs>>;
  quotes: Awaited<ReturnType<typeof listAdminQuotes>>;
  transactions: Awaited<ReturnType<typeof listAdminTransactions>>;
};

export async function listAdminUsers() {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  return db.query.users.findMany({
    orderBy: desc(users.createdAt),
    limit: 50,
  });
}

export async function listAdminSlabs() {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  return db.query.slabs.findMany({
    orderBy: desc(slabs.createdAt),
    limit: 100,
    with: {
      material: { columns: { name: true, slug: true } },
      vendor: {
        columns: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          isVerified: true,
        },
      },
    },
  });
}

export async function listAdminQuotes() {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  return db.query.quoteRequests.findMany({
    orderBy: desc(quoteRequests.createdAt),
    limit: 100,
    with: {
      slab: { columns: { id: true, name: true } },
      vendor: { columns: { id: true, companyName: true, email: true } },
      buyer: { columns: { id: true, companyName: true, contactName: true, email: true } },
    },
  });
}

export async function listAdminTransactions() {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  return db.query.transactions.findMany({
    orderBy: desc(transactions.createdAt),
    limit: 100,
    with: {
      slab: { columns: { id: true, name: true } },
      vendor: { columns: { id: true, companyName: true, email: true } },
      buyer: { columns: { id: true, companyName: true, contactName: true, email: true } },
    },
  });
}

export async function setAdminVendorVerification(
  userId: string,
  verified: boolean,
): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({ isVerified: verified, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function setAdminSlabStatus(
  slabId: string,
  status: SlabStatus,
): Promise<void> {
  if (!slabStatusEnum.enumValues.includes(status)) {
    throw new Error("Invalid listing status.");
  }

  const db = getDb();
  await db
    .update(slabs)
    .set({ status, updatedAt: new Date() })
    .where(eq(slabs.id, slabId));
}

export async function setAdminQuoteStatus(
  quoteId: string,
  status: QuoteStatus,
): Promise<void> {
  if (!quoteStatusEnum.enumValues.includes(status)) {
    throw new Error("Invalid quote status.");
  }

  const db = getDb();
  await db
    .update(quoteRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(quoteRequests.id, quoteId));
}
