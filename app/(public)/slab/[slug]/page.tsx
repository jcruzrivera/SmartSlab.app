import Link from "next/link";
import { notFound } from "next/navigation";

import { getSlabById } from "@/lib/db/slabs";
import { isDbConfigured } from "@/lib/db/client";
import {
  formatDimensions,
  formatLocation,
  formatPrice,
  formatPricePrecise,
} from "@/lib/format";

export const dynamic = "force-dynamic";

type SlabDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const finishLabels: Record<string, string> = {
  polished: "Polished",
  honed: "Honed",
  leathered: "Leathered",
  brushed: "Brushed",
  sandblasted: "Sandblasted",
  other: "Other",
};

export default async function SlabDetailPage({ params }: SlabDetailPageProps) {
  const { slug } = await params;

  if (!isDbConfigured()) {
    notFound();
  }

  const slab = await getSlabById(slug);

  if (!slab) {
    notFound();
  }

  const primaryImage =
    slab.images.find((image) => image.isPrimary)?.url ?? slab.images[0]?.url;
  const gallery = slab.images.filter((image) => image.url !== primaryImage);
  const location = formatLocation(slab.vendor?.city, slab.vendor?.state);
  const vendorName =
    slab.vendor?.companyName ?? slab.vendor?.contactName ?? "SmartSlab vendor";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Link
        href="/browse"
        className="text-sm font-medium text-slate-500 transition hover:text-[#0d8fa8]"
      >
        ← Back to browse
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage}
                alt={slab.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                No photo provided
              </div>
            )}
          </div>
          {gallery.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {gallery.slice(0, 4).map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.id}
                  src={image.url}
                  alt={slab.name}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#0d8fa8]">
              {slab.material?.name ?? "Stone"}
              <span className="text-slate-400">
                · {slab.type === "remnant" ? "Remnant" : "Full slab"}
              </span>
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {slab.name}
            </h1>
          </div>

          <div className="flex items-end gap-3">
            <span className="text-3xl font-semibold">
              {formatPrice(slab.price)}
            </span>
            {slab.pricePerSqft ? (
              <span className="pb-1 text-sm text-slate-500">
                {formatPricePrecise(slab.pricePerSqft)}/sqft
              </span>
            ) : null}
            {slab.isNegotiable ? (
              <span className="mb-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Negotiable
              </span>
            ) : null}
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800">
            <Detail label="Dimensions">
              {formatDimensions(slab.widthCm, slab.heightCm, slab.thicknessCm)}
            </Detail>
            <Detail label="Finish">
              {finishLabels[slab.finish] ?? slab.finish}
            </Detail>
            <Detail label="Color family">{slab.colorFamily ?? "—"}</Detail>
            <Detail label="Quantity">{slab.quantity}</Detail>
            {slab.brandSupplier ? (
              <Detail label="Brand / supplier">{slab.brandSupplier}</Detail>
            ) : null}
          </dl>

          {slab.notes ? (
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {slab.notes}
            </p>
          ) : null}

          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-sm font-medium">Sold by {vendorName}</p>
            {location ? (
              <p className="mt-1 text-sm text-slate-500">{location}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex h-11 items-center rounded-lg bg-[#1bb0ce] px-5 text-sm font-medium text-white transition hover:bg-[#0d8fa8]">
              Request quote
            </button>
            <button className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-5 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900">
              Save
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
