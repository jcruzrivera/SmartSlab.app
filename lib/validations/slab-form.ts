import { z } from "zod";

export const slabFormSchema = z.object({
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
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(60).optional(),
  zip: z.string().trim().max(20).optional(),
  widthCm: z.coerce.number().positive().optional(),
  heightCm: z.coerce.number().positive().optional(),
  thicknessCm: z.coerce.number().positive().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  quantity: z.coerce.number().int().positive().default(1),
  isNegotiable: z.boolean().default(false),
  notes: z.string().trim().max(2000).optional(),
  imageUrls: z.array(z.string().url()).max(6).default([]),
});

export type SlabFormValues = z.infer<typeof slabFormSchema>;

function optional(value: FormDataEntryValue | null): string | undefined {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : undefined;
}

export function parseSlabFormData(formData: FormData) {
  return slabFormSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    materialId: optional(formData.get("materialId")),
    finish: formData.get("finish"),
    colorFamily: optional(formData.get("colorFamily")),
    brandSupplier: optional(formData.get("brandSupplier")),
    city: optional(formData.get("city")),
    state: optional(formData.get("state")),
    zip: optional(formData.get("zip")),
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
}
