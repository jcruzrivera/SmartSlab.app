import { NextResponse } from "next/server";

import { getCurrentDbUser } from "@/lib/db/users";
import {
  countUnread,
  listNotifications,
  markAllRead,
  markRead,
} from "@/lib/db/notifications";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentDbUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [items, unread] = await Promise.all([
    listNotifications(user.id, 20),
    countUnread(user.id),
  ]);

  return NextResponse.json({
    unread,
    notifications: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })),
  });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const user = await getCurrentDbUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id?: string; all?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.all) {
    await markAllRead(user.id);
  } else if (typeof body.id === "string") {
    await markRead(body.id, user.id);
  } else {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
