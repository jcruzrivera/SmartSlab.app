import type { FitResult, SmartFinderResult } from "@/lib/smartfinder/types";

export function toSmartFinderResult(
  result: FitResult,
  options: { isOwnListing: boolean } = { isOwnListing: false },
): SmartFinderResult {
  const { slab } = result;
  const primaryImage =
    slab.images.find((img) => img.isPrimary)?.url ?? slab.images[0]?.url ?? null;

  return {
    slabId: slab.id,
    slabName: slab.name,
    materialName: slab.material?.name ?? null,
    colorFamily: slab.colorFamily,
    vendorCompany: slab.vendor?.companyName ?? null,
    vendorId: slab.vendorId,
    isOwnListing: options.isOwnListing,
    imageUrl: primaryImage,
    price: slab.price,
    pricePerSqft: slab.pricePerSqft,
    type: slab.type,
    widthIn: slab.widthIn,
    heightIn: slab.heightIn,
    city: slab.city,
    state: slab.state,
    fitScore: result.fitScore,
    totalPieceSqft: result.totalPieceSqft,
    slabSqft: result.slabSqft,
    wastePercent: result.wastePercent,
    fits: result.fits,
    oversizedPieces: result.oversizedPieces,
    pricePerUsableSqft: result.pricePerUsableSqft,
    isNegotiable: slab.isNegotiable,
    quantity: slab.quantity,
  };
}
