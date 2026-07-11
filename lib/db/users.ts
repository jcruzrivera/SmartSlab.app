import { eq } from "drizzle-orm";

import { getClerkUser, getClerkUserId } from "@/lib/auth/session";
import { getDb, isDbConfigured } from "@/lib/db/client";
import { storeSlugExists } from "@/lib/db/stores";
import { users } from "@/lib/db/schema";
import { parseAppRole, type AppRole } from "@/lib/auth/roles";
import {
  buildStoreSlugSource,
  ensureUniqueStoreSlug,
  isReservedStoreSlug,
  normalizeStoreSlug,
} from "@/lib/stores/slug";

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

function isVendorRole(role: string): boolean {
  return role === "vendor" || role === "both";
}

/**
 * Assigns a store_slug when the vendor does not have one yet.
 * Never overwrites an existing slug.
 */
export async function ensureVendorStoreSlug(
  userId: string,
): Promise<string | null> {
  if (!isDbConfigured()) {
    return null;
  }

  const db = getDb();
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      role: true,
      companyName: true,
      contactName: true,
      storeSlug: true,
    },
  });

  if (!user || !isVendorRole(user.role)) {
    return user?.storeSlug ?? null;
  }

  if (user.storeSlug) {
    return user.storeSlug;
  }

  const source = buildStoreSlugSource(user);
  const slug = await ensureUniqueStoreSlug(source, (candidate) =>
    storeSlugExists(candidate),
  );

  const [row] = await db
    .update(users)
    .set({ storeSlug: slug, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ storeSlug: users.storeSlug });

  return row?.storeSlug ?? slug;
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
          contactName: mergeContactName(
            input.contactName,
            existingByClerk.contactName,
          ),
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
          contactName: mergeContactName(
            input.contactName,
            existingByEmail.contactName,
          ),
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

export async function setStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const db = getDb();
  await db
    .update(users)
    .set({ stripeCustomerId, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

type UserPlan = (typeof users.$inferSelect)["plan"];
type PlanStatus = (typeof users.$inferSelect)["planStatus"];

function parseUserPlan(value: string | undefined): UserPlan {
  if (value === "pro" || value === "premium") {
    return value;
  }
  return "free";
}

function mapStripeSubscriptionStatus(stripeStatus: string): PlanStatus {
  if (stripeStatus === "active" || stripeStatus === "trialing") {
    return "active";
  }
  if (stripeStatus === "past_due") {
    return "past_due";
  }
  return "canceled";
}

/** Syncs plan fields from a Stripe subscription webhook event. */
export async function syncUserSubscription(input: {
  clerkId: string;
  stripeSubscriptionId: string;
  stripeStatus: string;
  planMetadata?: string;
  currentPeriodEnd: number;
}): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const planStatus = mapStripeSubscriptionStatus(input.stripeStatus);
  const plan =
    planStatus === "active" || planStatus === "past_due"
      ? parseUserPlan(input.planMetadata)
      : "free";

  const db = getDb();
  await db
    .update(users)
    .set({
      plan,
      planStatus,
      stripeSubscriptionId: input.stripeSubscriptionId,
      planRenewsAt: new Date(input.currentPeriodEnd * 1000),
      updatedAt: new Date(),
    })
    .where(eq(users.clerkId, input.clerkId));
}

/** Downgrades a user to free when their subscription ends. */
export async function cancelUserSubscription(clerkId: string): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const db = getDb();
  await db
    .update(users)
    .set({
      plan: "free",
      planStatus: "canceled",
      stripeSubscriptionId: null,
      planRenewsAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkId, clerkId));
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
  const existing = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, role: true, storeSlug: true },
  });

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

  if (existing && isVendorRole(existing.role) && !existing.storeSlug) {
    await ensureVendorStoreSlug(userId);
  }
}

export type StoreSettingsInput = {
  storePublic: boolean;
  storeSlug?: string | null;
};

/**
 * Updates storefront visibility and optionally the slug (once).
 * Throws with a user-facing message on validation failure.
 */
export async function updateStoreSettings(
  userId: string,
  input: StoreSettingsInput,
): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const db = getDb();
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      role: true,
      storeSlug: true,
      storeSlugLocked: true,
      storePublic: true,
    },
  });

  if (!user || !isVendorRole(user.role)) {
    throw new Error("Only vendors can manage a public store.");
  }

  const patch: {
    storePublic: boolean;
    storeSlug?: string;
    storeSlugLocked?: boolean;
    updatedAt: Date;
  } = {
    storePublic: input.storePublic,
    updatedAt: new Date(),
  };

  const requested = input.storeSlug?.trim();
  if (requested) {
    const normalized = normalizeStoreSlug(requested);

    if (isReservedStoreSlug(normalized)) {
      throw new Error("That store URL is reserved. Please choose another.");
    }

    if (user.storeSlugLocked && normalized !== user.storeSlug) {
      throw new Error("Your store URL can only be changed once.");
    }

    if (normalized !== user.storeSlug) {
      const taken = await storeSlugExists(normalized, userId);
      if (taken) {
        throw new Error("That store URL is already taken.");
      }

      patch.storeSlug = normalized;
      patch.storeSlugLocked = true;
    }
  }

  await db.update(users).set(patch).where(eq(users.id, userId));

  if (!user.storeSlug && !patch.storeSlug) {
    await ensureVendorStoreSlug(userId);
  }
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
