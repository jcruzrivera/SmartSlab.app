import { eq } from "drizzle-orm";

import { getClerkUser, getClerkUserId } from "@/lib/auth/session";
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  );
}

function mergeContactName(
  incoming: string | null | undefined,
  existing: string | null | undefined,
): string | undefined {
  const next = incoming?.trim();
  if (next) {
    return next;
  }
  return existing ?? undefined;
}

/**
 * Creates or updates the app user row for a Clerk account. Re-links by email when
 * a production Clerk user signs in with an address that still has a dev-era row
 * (avoids users_email_unique / 23505).
 */
export async function upsertUserFromClerk(
  input: UpsertUserInput,
): Promise<DbUser | null> {
  if (!isDbConfigured()) {
    return null;
  }

  const db = getDb();
  const email = normalizeEmail(input.email);
  const contactName = mergeContactName(input.contactName, undefined);

  try {
    const existingByClerk = await db.query.users.findFirst({
      where: eq(users.clerkId, input.clerkId),
    });

    if (existingByClerk) {
      const [row] = await db
        .update(users)
        .set({
          email,
          contactName: mergeContactName(input.contactName, existingByClerk.contactName),
          ...(input.role ? { role: input.role } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, input.clerkId))
        .returning();

      return row ?? existingByClerk;
    }

    const existingByEmail = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingByEmail) {
      const [row] = await db
        .update(users)
        .set({
          clerkId: input.clerkId,
          contactName: mergeContactName(input.contactName, existingByEmail.contactName),
          ...(input.role ? { role: input.role } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.email, email))
        .returning();

      return row ?? existingByEmail;
    }

    const [row] = await db
      .insert(users)
      .values({
        clerkId: input.clerkId,
        email,
        contactName,
        role: input.role ?? "buyer",
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          clerkId: input.clerkId,
          contactName: mergeContactName(input.contactName, undefined),
          ...(input.role ? { role: input.role } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return row ?? null;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const reconciled =
        (await db.query.users.findFirst({
          where: eq(users.clerkId, input.clerkId),
        })) ??
        (await db.query.users.findFirst({
          where: eq(users.email, email),
        }));

      if (reconciled) {
        return reconciled;
      }
    }

    console.error("[upsertUserFromClerk] failed", error);
    return null;
  }
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

  try {
    const userId = await getClerkUserId();

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

    const clerkUser = await getClerkUser();

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
  } catch (error) {
    console.error("[getOrCreateCurrentDbUser] failed", error);
    return null;
  }
}

export async function setStripeAccountId(
  userId: string,
  stripeAccountId: string,
): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const db = getDb();
  await db
    .update(users)
    .set({ stripeAccountId, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function setVendorVerified(
  stripeAccountId: string,
  isVerified: boolean,
): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const db = getDb();
  await db
    .update(users)
    .set({ isVerified, updatedAt: new Date() })
    .where(eq(users.stripeAccountId, stripeAccountId));
}

export type UserProfileInput = {
  companyName?: string | null;
  contactName?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
};

export async function updateUserProfile(
  userId: string,
  input: UserProfileInput,
): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const db = getDb();
  await db
    .update(users)
    .set({
      companyName: input.companyName ?? null,
      contactName: input.contactName ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      zip: input.zip ?? null,
      country: input.country ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function getDbUserById(id: string): Promise<DbUser | null> {
  if (!isDbConfigured()) {
    return null;
  }

  const db = getDb();
  const row = await db.query.users.findFirst({ where: eq(users.id, id) });
  return row ?? null;
}

export async function getCurrentDbUser(): Promise<DbUser | null> {
  if (!isDbConfigured()) {
    return null;
  }

  try {
    const userId = await getClerkUserId();

    if (!userId) {
      return null;
    }

    const db = getDb();
    const existing = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    return existing ?? null;
  } catch (error) {
    console.error("[getCurrentDbUser] failed", error);
    return null;
  }
}
