import { and, desc, eq } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { slabs, transactions } from "@/lib/db/schema";

export type Transaction = typeof transactions.$inferSelect;

export type CreateTransactionInput = {
  buyerId: string;
  vendorId: string;
  slabId: string;
  subtotal: number;
  platformFee: number;
  vendorPayout: number;
  total: number;
};

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(transactions)
    .values({
      buyerId: input.buyerId,
      vendorId: input.vendorId,
      slabId: input.slabId,
      status: "pending",
      subtotal: input.subtotal.toString(),
      platformFee: input.platformFee.toString(),
      vendorPayout: input.vendorPayout.toString(),
      total: input.total.toString(),
    })
    .returning({ id: transactions.id });

  return row.id;
}

export async function attachPaymentIntent(
  transactionId: string,
  paymentIntentId: string,
): Promise<void> {
  const db = getDb();
  await db
    .update(transactions)
    .set({ stripePaymentIntentId: paymentIntentId, updatedAt: new Date() })
    .where(eq(transactions.id, transactionId));
}

/**
 * Marks the transaction as paid and reserves the slab. Idempotent: safe to call
 * multiple times from webhook retries.
 */
export async function markTransactionPaid(transactionId: string): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const db = getDb();
  const tx = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
  });

  if (!tx || tx.status === "paid") {
    return;
  }

  await db
    .update(transactions)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(transactions.id, transactionId));

  await db
    .update(slabs)
    .set({ status: "sold", updatedAt: new Date() })
    .where(eq(slabs.id, tx.slabId));
}

export type SaleWithRelations = Transaction & {
  slab: { id: string; name: string } | null;
  buyer: {
    contactName: string | null;
    companyName: string | null;
    email: string;
  } | null;
};

export type PurchaseWithRelations = Transaction & {
  slab: { id: string; name: string } | null;
  vendor: { contactName: string | null; companyName: string | null } | null;
};

export async function listSalesByVendor(
  vendorId: string,
): Promise<SaleWithRelations[]> {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db.query.transactions.findMany({
    where: eq(transactions.vendorId, vendorId),
    orderBy: desc(transactions.createdAt),
    with: {
      slab: { columns: { id: true, name: true } },
      buyer: {
        columns: { contactName: true, companyName: true, email: true },
      },
    },
  });

  return rows as SaleWithRelations[];
}

export async function listPurchasesByBuyer(
  buyerId: string,
): Promise<PurchaseWithRelations[]> {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db.query.transactions.findMany({
    where: eq(transactions.buyerId, buyerId),
    orderBy: desc(transactions.createdAt),
    with: {
      slab: { columns: { id: true, name: true } },
      vendor: { columns: { contactName: true, companyName: true } },
    },
  });

  return rows as PurchaseWithRelations[];
}

export type SalesSummary = {
  totalSales: number;
  paidCount: number;
  pendingCount: number;
  grossPaid: number;
  netEarnings: number;
};

export function summarizeSales(sales: SaleWithRelations[]): SalesSummary {
  const paid = sales.filter((sale) => sale.status === "paid");

  return {
    totalSales: sales.length,
    paidCount: paid.length,
    pendingCount: sales.filter((sale) => sale.status === "pending").length,
    grossPaid: paid.reduce((sum, sale) => sum + Number(sale.total ?? 0), 0),
    netEarnings: paid.reduce(
      (sum, sale) => sum + Number(sale.vendorPayout ?? 0),
      0,
    ),
  };
}

export async function hasPaidForSlab(
  buyerId: string,
  slabId: string,
): Promise<boolean> {
  if (!isDbConfigured()) {
    return false;
  }

  const db = getDb();
  const row = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.buyerId, buyerId),
      eq(transactions.slabId, slabId),
      eq(transactions.status, "paid"),
    ),
  });

  return Boolean(row);
}
