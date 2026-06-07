import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

type UpsertUserInput = {
  clerkId: string;
  email: string;
  contactName?: string | null;
  role?: "admin" | "vendor" | "buyer" | "both";
};

export async function upsertUserFromClerk(input: UpsertUserInput) {
  await db
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
        role: input.role ?? "buyer",
        updatedAt: new Date(),
      },
    });
}
