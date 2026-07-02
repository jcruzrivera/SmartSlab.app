"use server";

import { revalidatePath } from "next/cache";

import {
  setAdminQuoteStatus,
  setAdminSlabStatus,
  setAdminVendorVerification,
} from "@/lib/db/admin";
import { isDbConfigured } from "@/lib/db/client";
import { getSlabById, updateSlab } from "@/lib/db/slabs";
import { getCurrentDbUser } from "@/lib/db/users";
import { buildAddressQuery, geocodeAddress } from "@/lib/geo/geocode";
import type { QuoteStatus } from "@/lib/db/quotes";
import type { SlabStatus } from "@/lib/db/slabs";
import { parseSlabFormData } from "@/lib/validations/slab-form";

async function requireAdmin(): Promise<boolean> {
  if (!isDbConfigured()) {
    return false;
  }

  const user = await getCurrentDbUser();
  return user?.role === "admin";
}

export async function setVendorVerificationAction(
  formData: FormData,
): Promise<void> {
  if (!(await requireAdmin())) {
    return;
  }

  const userId = formData.get("userId");
  const verified = formData.get("verified") === "true";

  if (typeof userId !== "string") {
    return;
  }

  await setAdminVendorVerification(userId, verified);
  revalidatePath("/admin");
}

export async function setListingStatusAction(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) {
    return;
  }

  const slabId = formData.get("slabId");
  const status = formData.get("status");

  if (typeof slabId !== "string" || typeof status !== "string") {
    return;
  }

  await setAdminSlabStatus(slabId, status as SlabStatus);
  revalidatePath("/admin");
  revalidatePath("/browse");
  revalidatePath(`/slab/${slabId}`);
}

export async function setQuoteStatusAction(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) {
    return;
  }

  const quoteId = formData.get("quoteId");
  const status = formData.get("status");

  if (typeof quoteId !== "string" || typeof status !== "string") {
    return;
  }

  await setAdminQuoteStatus(quoteId, status as QuoteStatus);
  revalidatePath("/admin");
  revalidatePath("/dashboard/leads");
}

export type AdminSlabFormState = {
  error?: string;
};

export async function updateAdminSlabAction(
  _prevState: AdminSlabFormState,
  formData: FormData,
): Promise<AdminSlabFormState> {
  if (!(await requireAdmin())) {
    return { error: "Admin access is required." };
  }

  const slabId = formData.get("slabId");
  if (typeof slabId !== "string" || slabId.length === 0) {
    return { error: "Missing listing reference." };
  }

  const slab = await getSlabById(slabId);
  if (!slab) {
    return { error: "Listing not found." };
  }

  const parsed = parseSlabFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please review the form fields.",
    };
  }

  const data = parsed.data;
  const point = await geocodeAddress(
    buildAddressQuery({ city: data.city, state: data.state, zip: data.zip }),
  );

  try {
    await updateSlab(slabId, slab.vendorId, {
      name: data.name,
      type: data.type,
      materialId: data.materialId,
      finish: data.finish,
      colorFamily: data.colorFamily,
      brandSupplier: data.brandSupplier,
      city: data.city,
      state: data.state,
      zip: data.zip,
      lat: point?.lat,
      lng: point?.lng,
      roomUse: data.roomUse,
      aestheticTags: data.aestheticTags,
      widthIn: data.widthIn,
      heightIn: data.heightIn,
      thicknessCm: data.thicknessCm,
      price: data.price,
      quantity: data.quantity,
      isNegotiable: data.isNegotiable,
      notes: data.notes,
      imageUrls: data.imageUrls,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not update the listing.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/browse");
  revalidatePath(`/slab/${slabId}`);
  revalidatePath(`/admin/slabs/${slabId}/edit`);
  return {};
}
