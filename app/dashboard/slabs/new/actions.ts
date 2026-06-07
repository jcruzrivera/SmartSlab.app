"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isDbConfigured } from "@/lib/db/client";
import { createSlab } from "@/lib/db/slabs";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";

const createSlabSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  type: z.enum(["full_slab", "remnant"]),
  materialId: z.string().uuid().optional(),
  finish: z.enum([
    "polished",
    "honed",
    "leathered",
    "brushed",
    "sandblasted",
    "other",
  ]),
  colorFamily: z.string().trim().max(60).optional(),
  brandSupplier: z.string().trim().max(120).optional(),
  widthCm: z.coerce.number().positive().optional(),
  heightCm: z.coerce.number().positive().optional(),
  thicknessCm: z.coerce.number().positive().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  quantity: z.coerce.number().int().positive().default(1),
  isNegotiable: z.boolean().default(false),
  notes: z.string().trim().max(2000).optional(),
  imageUrls: z.array(z.string().url()).max(6).default([]),
});

export type CreateSlabState = {
  error?: string;
};

function optional(value: FormDataEntryValue | null): string | undefined {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : undefined;
}

export async function createSlabAction(
  _prevState: CreateSlabState,
  formData: FormData,
): Promise<CreateSlabState> {
  if (!isDbConfigured()) {
    return { error: "The marketplace database is not configured yet." };
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return { error: "You must be signed in to publish a listing." };
  }

  const parsed = createSlabSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    materialId: optional(formData.get("materialId")),
    finish: formData.get("finish"),
    colorFamily: optional(formData.get("colorFamily")),
    brandSupplier: optional(formData.get("brandSupplier")),
    widthCm: optional(formData.get("widthCm")),
    heightCm: optional(formData.get("heightCm")),
    thicknessCm: optional(formData.get("thicknessCm")),
    price: formData.get("price"),
    quantity: optional(formData.get("quantity")) ?? 1,
    isNegotiable: formData.get("isNegotiable") === "on",
    notes: optional(formData.get("notes")),
    imageUrls: formData
      .getAll("imageUrls")
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please review the form fields.",
    };
  }

  const data = parsed.data;

  try {
    await createSlab({
      vendorId: user.id,
      name: data.name,
      type: data.type,
      materialId: data.materialId,
      finish: data.finish,
      colorFamily: data.colorFamily,
      brandSupplier: data.brandSupplier,
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
