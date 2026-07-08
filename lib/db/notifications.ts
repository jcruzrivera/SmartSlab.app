import { and, desc, eq, sql } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";

export type Notification = typeof notifications.$inferSelect;

export type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
};

/** Inserts a notification. Best-effort: never throws to the caller. */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  try {
    const db = getDb();
    await db.insert(notifications).values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    });
  } catch (error) {
    console.error("[notifications] create failed:", error);
  }
}

export async function listNotifications(
  userId: string,
  limit = 20,
): Promise<Notification[]> {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: desc(notifications.createdAt),
    limit,
  });
}

export async function countUnread(userId: string): Promise<number> {
  if (!isDbConfigured()) {
    return 0;
  }

  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
    );

  return row?.count ?? 0;
}

export async function markAllRead(userId: string): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const db = getDb();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
    );
}

export async function markRead(
  notificationId: string,
  userId: string,
): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const db = getDb();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
      ),
    );
}
