"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isDbConfigured } from "@/lib/db/client";
import { createSlab } from "@/lib/db/slabs";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { buildAddressQuery, geocodeAddress } from "@/lib/geo/geocode";
import { parseSlabFormData } from "@/lib/validations/slab-form";

export type SlabFormState = {
  error?: string;
};

export async function createSlabAction(
  _prevState: SlabFormState,
  formData: FormData,
): Promise<SlabFormState> {
  if (!isDbConfigured()) {
    return { error: "The marketplace database is not configured yet." };
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return { error: "You must be signed in to publish a listing." };
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
    await createSlab({
      vendorId: user.id,
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
      widthCm: data.widthCm,
      heightCm: data.heightCm,
      thicknessCm: data.thicknessCm,
      price: data.price,
      quantity: data.quantity,
      isNegotiable: data.isNegotiable,
      notes: data.notes,
      imageUrls: data.imageUrls,
    });
  } catch {
    return {
      error: "Could not save the listing. Please try again.",
    };
  }

  revalidatePath("/dashboard/slabs");
  revalidatePath("/browse");
  redirect("/dashboard/slabs");
}
