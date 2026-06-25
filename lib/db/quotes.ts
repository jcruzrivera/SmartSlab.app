import { and, desc, eq } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { messages, quoteRequests, quoteStatusEnum } from "@/lib/db/schema";

export type QuoteStatus = (typeof quoteStatusEnum.enumValues)[number];

export type CreateQuoteRequestInput = {
  buyerId?: string | null;
  vendorId: string;
  slabId: string;
  buyerName?: string | null;
  buyerEmail: string;
  buyerPhone?: string | null;
  message: string;
};

export async function createQuoteRequest(
  input: CreateQuoteRequestInput,
): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(quoteRequests)
    .values({
      buyerId: input.buyerId ?? null,
      vendorId: input.vendorId,
      slabId: input.slabId,
      buyerName: input.buyerName ?? null,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone ?? null,
      message: input.message,
    })
    .returning({ id: quoteRequests.id });

  if (input.buyerId) {
    await db.insert(messages).values({
      senderId: input.buyerId,
      recipientId: input.vendorId,
      slabId: input.slabId,
      content: input.message,
    });
  }

  return row.id;
}

export type QuoteRequestWithRelations = typeof quoteRequests.$inferSelect & {
  slab: { id: string; name: string; price: string } | null;
  buyer: {
    id: string;
    contactName: string | null;
    companyName: string | null;
    email: string;
  } | null;
  vendor: {
    id: string;
    companyName: string | null;
    contactName: string | null;
    email: string;
  } | null;
};

const quoteRelations = {
  slab: { columns: { id: true, name: true, price: true } },
  buyer: {
    columns: {
      id: true,
      contactName: true,
      companyName: true,
      email: true,
    },
  },
  vendor: {
    columns: {
      id: true,
      companyName: true,
      contactName: true,
      email: true,
    },
  },
} as const;

export async function listQuoteRequestsByVendor(
  vendorId: string,
): Promise<QuoteRequestWithRelations[]> {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db.query.quoteRequests.findMany({
    where: eq(quoteRequests.vendorId, vendorId),
    with: quoteRelations,
    orderBy: desc(quoteRequests.createdAt),
  });

  return rows as QuoteRequestWithRelations[];
}

export async function listQuoteRequestsByBuyer(
  buyerId: string,
): Promise<QuoteRequestWithRelations[]> {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db.query.quoteRequests.findMany({
    where: eq(quoteRequests.buyerId, buyerId),
    with: quoteRelations,
    orderBy: desc(quoteRequests.createdAt),
  });

  return rows as QuoteRequestWithRelations[];
}

export async function updateQuoteStatusForVendor(
  quoteId: string,
  vendorId: string,
  status: QuoteStatus,
): Promise<void> {
  const db = getDb();
  await db
    .update(quoteRequests)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(quoteRequests.id, quoteId), eq(quoteRequests.vendorId, vendorId)));
}

