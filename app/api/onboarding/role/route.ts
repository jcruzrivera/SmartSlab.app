import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getClerkUserId } from "@/lib/auth/session";

import { parseAppRole } from "@/lib/auth/roles";

const roleSchema = z.object({
  role: z.enum(["buyer", "vendor", "both"]),
});

export async function POST(request: Request) {
  try {
    const userId = await getClerkUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = roleSchema.parse(await request.json());
    const client = await clerkClient();

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: body.role,
      },
    });

    if (process.env.DATABASE_URL) {
      const usersResponse = await client.users.getUserList({
        userId: [userId],
        limit: 1,
      });
      const user = usersResponse.data[0];

      if (user) {
        const primaryEmail =
          user.emailAddresses.find(
            (email) => email.id === user.primaryEmailAddressId,
          )?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

        if (primaryEmail) {
          const { upsertUserFromClerk } = await import("@/lib/db/users");
          await upsertUserFromClerk({
            clerkId: user.id,
            email: primaryEmail,
            contactName:
              [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
            role: parseAppRole(body.role) ?? "buyer",
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid request.",
      },
      { status: 400 },
    );
  }
}
