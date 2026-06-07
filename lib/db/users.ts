import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { parseAppRole, type AppRole } from "@/lib/auth/roles";

export type DbUser = typeof users.$inferSelect;

type UpsertUserInput = {
  clerkId: string;
  email: string;
  contactName?: string | null;
  role?: AppRole;
};

export async function upsertUserFromClerk(
  input: UpsertUserInput,
): Promise<DbUser | null> {
  if (!isDbConfigured()) {
    return null;
  }

  const db = getDb();
  const [row] = await db
    .insert(users)
    .values({
      clerkId: input.clerkId,
      email: input.email,
      contactName: input.contactName ?? undefined,
      role: input.role ?? "buyer",
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email: input.email,
        contactName: input.contactName ?? undefined,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row ?? null;
}

/**
 * Returns the database user for the current Clerk session, creating it on the
 * fly if it does not exist yet. Returns null when unauthenticated or when the
 * database is not configured.
 */
export async function getOrCreateCurrentDbUser(): Promise<DbUser | null> {
  if (!isDbConfigured()) {
    return null;
  }

  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const db = getDb();
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (existing) {
    return existing;
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email =
    clerkUser.emailAddresses.find(
      (entry) => entry.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    return null;
  }

  const role =
    parseAppRole(clerkUser.publicMetadata?.role as string | undefined) ??
    "buyer";

  return upsertUserFromClerk({
    clerkId: clerkUser.id,
    email,
    contactName:
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      null,
    role,
  });
}

export async function getCurrentDbUser(): Promise<DbUser | null> {
  if (!isDbConfigured()) {
    return null;
  }

  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const db = getDb();
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  return existing ?? null;
}
