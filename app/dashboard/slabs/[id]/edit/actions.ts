"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isDbConfigured } from "@/lib/db/client";
import {
  deleteSlabForVendor,
  getSlabForVendor,
  setSlabStatus,
  updateSlab,
} from "@/lib/db/slabs";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { parseSlabFormData } from "@/lib/validations/slab-form";

export type SlabFormState = {
  error?: string;
};

export async function updateSlabAction(
  _prevState: SlabFormState,
  formData: FormData,
): Promise<SlabFormState> {
  if (!isDbConfigured()) {
    return { error: "The marketplace database is not configured yet." };
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const slabId = formData.get("slabId");

  if (typeof slabId !== "string" || slabId.length === 0) {
    return { error: "Missing listing reference." };
  }

  const existing = await getSlabForVendor(slabId, user.id);

  if (!existing) {
    return { error: "Listing not found." };
  }

  if (existing.status === "sold") {
    return { error: "Sold listings cannot be edited." };
  }

  const parsed = parseSlabFormData(formData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please review the form fields.",
    };
  }

  const data = parsed.data;

  try {
    await updateSlab(slabId, user.id, {
      name: data.name,
      type: data.type,
      materialId: data.materialId,
      finish: data.finish,
      colorFamily: data.colorFamily,
      brandSupplier: data.brandSupplier,
      city: data.city,
      state: data.state,
      zip: data.zip,
      widthCm: data.widthCm,
      heightCm: data.heightCm,
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
          : "Could not update the listing. Please try again.",
    };
  }

  revalidatePath("/dashboard/slabs");
  revalidatePath("/browse");
  revalidatePath(`/slab/${slabId}`);
  revalidatePath(`/dashboard/slabs/${slabId}/edit`);
  redirect("/dashboard/slabs");
}

export async function toggleSlabVisibilityAction(
  _prevState: SlabFormState,
  formData: FormData,
): Promise<SlabFormState> {
  if (!isDbConfigured()) {
    return { error: "The marketplace database is not configured yet." };
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const slabId = formData.get("slabId");

  if (typeof slabId !== "string" || slabId.length === 0) {
    return { error: "Missing listing reference." };
  }

  const existing = await getSlabForVendor(slabId, user.id);

  if (!existing) {
    return { error: "Listing not found." };
  }

  if (existing.status === "sold") {
    return { error: "Sold listings cannot be changed." };
  }

  const nextStatus = existing.status === "available" ? "hidden" : "available";

  try {
    await setSlabStatus(slabId, user.id, nextStatus);
  } catch {
    return { error: "Could not update listing visibility." };
  }

  revalidatePath("/dashboard/slabs");
  revalidatePath("/browse");
  revalidatePath(`/slab/${slabId}`);
  revalidatePath(`/dashboard/slabs/${slabId}/edit`);
  redirect(`/dashboard/slabs/${slabId}/edit`);
}

export async function deleteSlabAction(
  _prevState: SlabFormState,
  formData: FormData,
): Promise<SlabFormState> {
  if (!isDbConfigured()) {
    return { error: "The marketplace database is not configured yet." };
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const slabId = formData.get("slabId");

  if (typeof slabId !== "string" || slabId.length === 0) {
    return { error: "Missing listing reference." };
  }

  try {
    await deleteSlabForVendor(slabId, user.id);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not delete the listing.",
    };
  }

  revalidatePath("/dashboard/slabs");
  revalidatePath("/browse");
  redirect("/dashboard/slabs");
}
