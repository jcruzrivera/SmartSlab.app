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
 * multiple times from webhook retries. Returns true only when this call is the
 * one that transitioned the transaction to "paid" (so the caller can fire
 * notifications exactly once).
 */
export async function markTransactionPaid(
  transactionId: string,
): Promise<boolean> {
  if (!isDbConfigured()) {
    return false;
  }

  const db = getDb();
  const tx = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
  });

  if (!tx || tx.status === "paid") {
    return false;
  }

  await db
    .update(transactions)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(transactions.id, transactionId));

  // Decrement the slab's available quantity. Multi-quantity full slabs return
  // to "available" with one fewer unit; the listing closes ("sold") only when
  // the last unit is gone. Clear the checkout reservation either way.
  const slab = await db.query.slabs.findFirst({
    where: eq(slabs.id, tx.slabId),
    columns: { quantity: true, quantitySold: true },
  });

  const remaining = Math.max(0, (slab?.quantity ?? 1) - 1);

  await db
    .update(slabs)
    .set({
      quantity: remaining,
      quantitySold: (slab?.quantitySold ?? 0) + 1,
      status: remaining === 0 ? "sold" : "available",
      reservedBy: null,
      reservedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(slabs.id, tx.slabId));

  return true;
}

/**
 * Cancels a still-pending transaction and frees its reserved slab. Used when a
 * checkout session expires, the payment fails, or session creation errors out.
 * No-op once the transaction has already been paid.
 */
export async function releaseTransaction(transactionId: string): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const db = getDb();
  const tx = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
  });

  if (!tx || tx.status !== "pending") {
    return;
  }

  await db
    .update(transactions)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(transactions.id, transactionId));

  await db
    .update(slabs)
    .set({
      status: "available",
      reservedBy: null,
      reservedUntil: null,
      updatedAt: new Date(),
    })
    .where(and(eq(slabs.id, tx.slabId), eq(slabs.status, "reserved")));
}

export type TransactionEmailData = {
  slabName: string;
  slabId: string;
  total: string;
  vendorPayout: string;
  platformFee: string;
  buyer: { email: string; name: string | null };
  vendor: {
    email: string;
    name: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
};

/**
 * Loads everything needed to email both parties about a completed order.
 */
export async function getTransactionEmailData(
  transactionId: string,
): Promise<TransactionEmailData | null> {
  if (!isDbConfigured()) {
    return null;
  }

  const db = getDb();
  const tx = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
    with: {
      slab: { columns: { id: true, name: true } },
      buyer: { columns: { email: true, contactName: true, companyName: true } },
      vendor: {
        columns: {
          email: true,
          contactName: true,
          companyName: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zip: true,
        },
      },
    },
  });

  if (!tx || !tx.buyer || !tx.vendor) {
    return null;
  }

  return {
    slabName: tx.slab?.name ?? "Slab",
    slabId: tx.slab?.id ?? tx.slabId,
    total: tx.total,
    vendorPayout: tx.vendorPayout,
    platformFee: tx.platformFee,
    buyer: {
      email: tx.buyer.email,
      name: tx.buyer.contactName ?? tx.buyer.companyName ?? null,
    },
    vendor: {
      email: tx.vendor.email,
      name: tx.vendor.companyName ?? tx.vendor.contactName ?? null,
      phone: tx.vendor.phone,
      address: tx.vendor.address,
      city: tx.vendor.city,
      state: tx.vendor.state,
      zip: tx.vendor.zip,
    },
  };
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
