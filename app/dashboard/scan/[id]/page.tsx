import { redirect } from "next/navigation";

import { ScanActions } from "@/components/inventory/scan-actions";
import { SlabPhoto } from "@/components/media/slab-photo";
import { Badge, slabStatusVariant } from "@/components/ui/badge";
import { getOptimizedImageUrl } from "@/lib/cloudinary/images";
import { isDbConfigured } from "@/lib/db/client";
import { getSlabForVendor } from "@/lib/db/slabs";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { formatDimensions } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function QuickActionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isDbConfigured()) {
    redirect("/dashboard/slabs");
  }

  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    redirect("/sign-in");
  }

  const slab = await getSlabForVendor(id, user.id);
  if (!slab) {
    redirect("/dashboard/slabs");
  }

  const primaryImage =
    slab.images.find((image) => image.isPrimary)?.url ?? slab.images[0]?.url;
  const thumbUrl = primaryImage
    ? (getOptimizedImageUrl(primaryImage, {
        width: 200,
        height: 200,
        crop: "fill",
      }) ?? primaryImage)
    : null;

  return (
    <section className="mx-auto w-full max-w-md px-4 py-6">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
          {thumbUrl ? (
            <SlabPhoto
              src={thumbUrl}
              alt={slab.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
              Sin foto
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {slab.name}
          </h1>
          <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-300">
            {slab.material?.name ?? "Piedra"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {formatDimensions(slab.widthIn, slab.heightIn, slab.thicknessCm)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant={slabStatusVariant[slab.status] ?? "muted"}
              className="capitalize"
            >
              {slab.status}
            </Badge>
            {slab.shortCode ? (
              <span className="font-mono text-xs tracking-widest text-slate-500 dark:text-slate-400">
                {slab.shortCode}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <ScanActions
        slabId={slab.id}
        initialQuantity={slab.quantity}
        initialStatus={slab.status}
      />
    </section>
  );
}
