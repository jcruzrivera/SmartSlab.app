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

export async function listPurchasesByBuyer(
  buyerId: string,
): Promise<Transaction[]> {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.buyerId, buyerId))
    .orderBy(desc(transactions.createdAt));
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
