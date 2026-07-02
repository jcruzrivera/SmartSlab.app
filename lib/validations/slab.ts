import { z } from "zod";

export const slabFormSchema = z.object({
  name: z.string().min(2).max(120),
  sku: z.string().max(80).optional(),
  type: z.enum(["full_slab", "remnant"]),
  materialId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  finish: z.enum([
    "polished",
    "honed",
    "leathered",
    "brushed",
    "sandblasted",
    "other",
  ]),
  colorFamily: z.string().max(60).optional(),
  widthIn: z.coerce.number().positive().optional(),
  heightIn: z.coerce.number().positive().optional(),
  thicknessCm: z.coerce.number().positive().optional(),
  price: z.coerce.number().min(0),
  quantity: z.coerce.number().int().positive().default(1),
  isNegotiable: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

export type SlabFormValues = z.infer<typeof slabFormSchema>;
