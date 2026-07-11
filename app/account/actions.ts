"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isDbConfigured } from "@/lib/db/client";
import {
  getOrCreateCurrentDbUser,
  updateStoreSettings,
  updateUserProfile,
} from "@/lib/db/users";

const profileSchema = z.object({
  companyName: z.string().trim().max(120).optional(),
  contactName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(60).optional(),
  zip: z.string().trim().max(20).optional(),
  country: z.string().trim().max(60).optional(),
});

export type ProfileState = {
  error?: string;
  success?: boolean;
};

function optional(value: FormDataEntryValue | null): string | undefined {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : undefined;
}

function isVendorRole(role: string): boolean {
  return role === "vendor" || role === "both";
}

export async function updateProfileAction(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  if (!isDbConfigured()) {
    return { error: "The database is not configured yet." };
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const parsed = profileSchema.safeParse({
    companyName: optional(formData.get("companyName")),
    contactName: optional(formData.get("contactName")),
    phone: optional(formData.get("phone")),
    address: optional(formData.get("address")),
    city: optional(formData.get("city")),
    state: optional(formData.get("state")),
    zip: optional(formData.get("zip")),
    country: optional(formData.get("country")),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please review the form.",
    };
  }

  try {
    await updateUserProfile(user.id, parsed.data);

    if (isVendorRole(user.role)) {
      const storePublicRaw = formData.get("storePublic");
      const storePublic =
        storePublicRaw === "on" ||
        storePublicRaw === "true" ||
        storePublicRaw === "1";
      const storeSlug = optional(formData.get("storeSlug")) ?? null;

      await updateStoreSettings(user.id, {
        storePublic,
        storeSlug,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not save your profile. Please try again.";
    return { error: message };
  }

  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { success: true };
}
