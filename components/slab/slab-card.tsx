import Link from "next/link";

import { SlabPhoto } from "@/components/media/slab-photo";
import { Badge } from "@/components/ui/badge";
import { SlabCardActionsLoader } from "@/components/slab/slab-card-actions-loader";
import type { SlabWithRelations } from "@/lib/db/slabs";
import { getOptimizedImageUrl } from "@/lib/cloudinary/images";
import { formatLocation, formatSlabPrice, formatSqft } from "@/lib/format";
import { formatDistance } from "@/lib/search/geo";

const typeLabels: Record<string, string> = {
  full_slab: "Full slab",
  remnant: "Remnant",
};

export function SlabCard({
  slab,
  distanceMiles,
}: {
  slab: SlabWithRelations;
  distanceMiles?: number;
}) {
  const primaryImage =
    slab.images.find((image) => image.isPrimary)?.url ?? slab.images[0]?.url;
  const cardImageUrl = primaryImage
    ? getOptimizedImageUrl(primaryImage, {
        width: 640,
        height: 480,
        crop: "fill",
      }) ?? primaryImage
    : null;
  const location = formatLocation(slab.city, slab.state) ?? slab.zip ?? null;
  const sqft = formatSqft(slab.widthIn, slab.heightIn);
  const locationOrDistance =
    distanceMiles !== undefined ? formatDistance(distanceMiles) : location;
  const priceLabel = formatSlabPrice(slab.price, slab.isNegotiable);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2 focus-within:ring-offset-background dark:border-slate-800 dark:bg-slate-900">
      <Link
        href={`/slab/${slab.id}`}
        className="flex flex-1 flex-col outline-none"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {cardImageUrl ? (
            <SlabPhoto
              src={cardImageUrl}
              alt={slab.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
              No photo yet
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-200">
            {typeLabels[slab.type] ?? slab.type}
          </span>
          {slab.type === "full_slab" && slab.quantity > 1 ? (
            <span className="absolute right-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-medium text-white shadow-sm">
              {slab.quantity} available
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-brand-strong">
            {slab.material?.name ?? "Stone"}
            {slab.colorFamily ? (
              <span className="text-slate-400">| {slab.colorFamily}</span>
            ) : null}
          </div>
          <h3 className="line-clamp-1 text-base font-semibold tracking-tight">
            {slab.name}
          </h3>
          {locationOrDistance ? (
            <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
              </svg>
              {locationOrDistance}
            </p>
          ) : null}
          {sqft ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{sqft}</p>
          ) : null}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-semibold">{priceLabel}</span>
            {slab.isNegotiable && priceLabel !== "Negotiable" ? (
              <Badge variant="warning">Negotiable</Badge>
            ) : null}
          </div>
        </div>
      </Link>
      <SlabCardActionsLoader slabId={slab.id} />
    </article>
  );
}
