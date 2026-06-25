import { desc, eq, or } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { messages } from "@/lib/db/schema";

export type MessageWithRelations = typeof messages.$inferSelect & {
  sender: {
    id: string;
    contactName: string | null;
    companyName: string | null;
    email: string;
  } | null;
  recipient: {
    id: string;
    contactName: string | null;
    companyName: string | null;
    email: string;
  } | null;
  slab: { id: string; name: string } | null;
};

export async function listMessagesForUser(
  userId: string,
): Promise<MessageWithRelations[]> {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db.query.messages.findMany({
    where: or(eq(messages.senderId, userId), eq(messages.recipientId, userId)),
    orderBy: desc(messages.createdAt),
    limit: 100,
    with: {
      sender: {
        columns: {
          id: true,
          contactName: true,
          companyName: true,
          email: true,
        },
      },
      recipient: {
        columns: {
          id: true,
          contactName: true,
          companyName: true,
          email: true,
        },
      },
      slab: { columns: { id: true, name: true } },
    },
  });

  return rows as MessageWithRelations[];
}

export async function createMessage(input: {
  senderId: string;
  recipientId: string;
  slabId?: string | null;
  content: string;
}): Promise<void> {
  const db = getDb();
  await db.insert(messages).values({
    senderId: input.senderId,
    recipientId: input.recipientId,
    slabId: input.slabId ?? null,
    content: input.content,
  });
}
