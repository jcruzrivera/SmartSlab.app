import { createSlab } from "@/lib/db/slabs";
import { buildAddressQuery, geocodeAddress } from "@/lib/geo/geocode";
import type { SlabFormValues } from "@/lib/validations/slab-form";

export async function createSlabFromParsedForm(
  vendorId: string,
  data: SlabFormValues,
): Promise<string> {
  const point = await geocodeAddress(
    buildAddressQuery({ city: data.city, state: data.state, zip: data.zip }),
  );

  return createSlab({
    vendorId,
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
}
