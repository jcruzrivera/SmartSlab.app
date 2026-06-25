"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isDbConfigured } from "@/lib/db/client";
import { toggleFavoriteSlab } from "@/lib/db/favorites";
import { createMessage } from "@/lib/db/messages";
import { createQuoteRequest, updateQuoteStatusForVendor } from "@/lib/db/quotes";
import { getSlabById } from "@/lib/db/slabs";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";

export type QuoteFormState = {
  error?: string;
  success?: string;
};

const quoteSchema = z.object({
  slabId: z.string().uuid(),
  buyerName: z.string().trim().max(120).optional(),
  buyerEmail: z.string().trim().email("Enter a valid email."),
  buyerPhone: z.string().trim().max(40).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Tell the vendor what you need.")
    .max(2000),
});

function optional(value: FormDataEntryValue | null): string | undefined {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : undefined;
}

export async function requestQuoteAction(
  _prevState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  if (!isDbConfigured()) {
    return { error: "Quote requests are not available yet." };
  }

  const parsed = quoteSchema.safeParse({
    slabId: formData.get("slabId"),
    buyerName: optional(formData.get("buyerName")),
    buyerEmail: formData.get("buyerEmail"),
    buyerPhone: optional(formData.get("buyerPhone")),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please review the form.",
    };
  }

  const data = parsed.data;
  const slab = await getSlabById(data.slabId);

  if (!slab) {
    return { error: "This listing is no longer available." };
  }

  const buyer = await getOrCreateCurrentDbUser();

  if (buyer?.id === slab.vendorId) {
    return { error: "You cannot request a quote on your own listing." };
  }

  await createQuoteRequest({
    buyerId: buyer?.id,
    vendorId: slab.vendorId,
    slabId: slab.id,
    buyerName: data.buyerName ?? buyer?.contactName ?? buyer?.companyName,
    buyerEmail: data.buyerEmail,
    buyerPhone: data.buyerPhone ?? buyer?.phone,
    message: data.message,
  });

  revalidatePath(`/slab/${slab.id}`);
  revalidatePath("/dashboard/leads");
  revalidatePath("/admin");

  return {
    success:
      "Quote request sent. The vendor can now review it from their dashboard.",
  };
}

export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const slabId = formData.get("slabId");
  if (typeof slabId !== "string" || slabId.length === 0) {
    return;
  }

  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    redirect("/sign-in");
  }

  await toggleFavoriteSlab(user.id, slabId);
  revalidatePath(`/slab/${slabId}`);
  revalidatePath("/account");
}

export async function updateVendorQuoteStatusAction(
  formData: FormData,
): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const quoteId = formData.get("quoteId");
  const status = formData.get("status");
  const user = await getOrCreateCurrentDbUser();

  if (
    !user ||
    typeof quoteId !== "string" ||
    typeof status !== "string" ||
    !["new", "contacted", "quoted", "closed", "cancelled"].includes(status)
  ) {
    return;
  }

  await updateQuoteStatusForVendor(
    quoteId,
    user.id,
    status as "new" | "contacted" | "quoted" | "closed" | "cancelled",
  );
  revalidatePath("/dashboard/leads");
  revalidatePath("/admin");
}

export async function sendMessageAction(formData: FormData): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  const user = await getOrCreateCurrentDbUser();
  const recipientId = formData.get("recipientId");
  const slabId = formData.get("slabId");
  const content = optional(formData.get("content"));

  if (
    !user ||
    typeof recipientId !== "string" ||
    recipientId.length === 0 ||
    !content ||
    content.length < 2
  ) {
    return;
  }

  await createMessage({
    senderId: user.id,
    recipientId,
    slabId: typeof slabId === "string" && slabId.length > 0 ? slabId : null,
    content,
  });

  revalidatePath("/dashboard/messages");
}
