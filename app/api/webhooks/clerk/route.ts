import { type WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { parseAppRole } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "CLERK_WEBHOOK_SECRET is not configured." },
        { status: 500 },
      );
    }

    const payload = await request.text();
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: "Missing Svix headers." },
        { status: 400 },
      );
    }

    const svix = new Webhook(webhookSecret);
    const event = svix.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: true });
    }

    if (event.type === "user.created" || event.type === "user.updated") {
      const user = event.data;
      const role = parseAppRole(user.public_metadata?.role);
      const email =
        user.email_addresses.find(
          (emailAddress) => emailAddress.id === user.primary_email_address_id,
        )?.email_address ?? user.email_addresses[0]?.email_address;

      if (email) {
        const { upsertUserFromClerk } = await import("@/lib/db/users");
        await upsertUserFromClerk({
          clerkId: user.id,
          email,
          contactName:
            [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
          role: role ?? "buyer",
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook error.",
      },
      { status: 400 },
    );
  }
}
