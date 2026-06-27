import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BuyButton } from "@/components/payments/buy-button";
import { SlabPhoto } from "@/components/media/slab-photo";
import { CompareButton } from "@/components/slab/compare-button";
import { FavoriteButton } from "@/components/slab/favorite-button";
import { QuoteRequestForm } from "@/components/slab/quote-request-form";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { isDbConfigured } from "@/lib/db/client";
import { isFavoriteSlab } from "@/lib/db/favorites";
import { getSlabById, getVendorContactForSlab } from "@/lib/db/slabs";
import { getCurrentDbUser } from "@/lib/db/users";
import {
  formatDimensions,
  formatPrice,
  formatPricePrecise,
  formatSqft,
} from "@/lib/format";
import { fulfillCheckoutSession } from "@/lib/payments/fulfill";
import { isStripeConfigured } from "@/lib/stripe";
import { getOrigin } from "@/lib/url";
import { getOptimizedImageUrl } from "@/lib/cloudinary/images";

export const dynamic = "force-dynamic";

type SlabDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    paid?: string;
    canceled?: string;
    session_id?: string;
  }>;
};

const finishLabels: Record<string, string> = {
  polished: "Polished",
  honed: "Honed",
  leathered: "Leathered",
  brushed: "Brushed",
  sandblasted: "Sandblasted",
  other: "Other",
};

export async function generateMetadata({
  params,
}: Pick<SlabDetailPageProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  const slab = await getSlabById(slug);

  if (!slab) {
    return { title: "Slab not found | SmartSlab" };
  }

  const material = slab.material?.name ?? "Stone";
  const location = [slab.city, slab.state].filter(Boolean).join(", ");
  const title = `${slab.name} | ${material} slab | SmartSlab`;
  const description = [
    `${material} ${slab.type === "remnant" ? "remnant" : "slab"}`,
    location ? `available in ${location}` : null,
    slab.colorFamily ? `color: ${slab.colorFamily}` : null,
  ]
    .filter(Boolean)
    .join(" - ");
  const image =
    slab.images.find((item) => item.isPrimary)?.url ?? slab.images[0]?.url;
  const ogImage = getOptimizedImageUrl(image, { width: 1200, crop: "limit" });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: "website",
    },
  };
}

export default async function SlabDetailPage({
  params,
  searchParams,
}: SlabDetailPageProps) {
  const { slug } = await params;
  const { paid, canceled, session_id: sessionId } = await searchParams;

  if (!isDbConfigured()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Browse", href: "/browse" },
            { label: "Listing" },
          ]}
        />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Listing unavailable
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          The marketplace database is not connected yet, so this listing cannot
          be loaded.
        </p>
        <Link
          href="/browse"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
        >
          Back to browse
        </Link>
      </main>
    );
  }

  if (paid && sessionId) {
    try {
      const origin = await getOrigin();
      await fulfillCheckoutSession(sessionId, origin);
    } catch {
      // Webhook remains the source of truth if fallback verification fails.
    }
  }

  const slab = await getSlabById(slug);

  if (!slab) {
    notFound();
  }

  const primaryImage =
    slab.images.find((image) => image.isPrimary)?.url ?? slab.images[0]?.url;
  const primaryImageUrl = primaryImage
    ? getOptimizedImageUrl(primaryImage, {
        width: 1200,
        height: 900,
        crop: "fill",
      }) ?? primaryImage
    : null;
  const gallery = slab.images.filter((image) => image.url !== primaryImage);
  const vendorName = slab.vendor?.companyName ?? "SmartSlab vendor";

  let viewer = null;
  let vendorContact = null;
  let favorite = false;

  try {
    viewer = await getCurrentDbUser();
    vendorContact = await getVendorContactForSlab(slab.id, viewer?.id ?? null);
    favorite = viewer ? await isFavoriteSlab(viewer.id, slab.id) : false;
  } catch {
    // Keep the listing usable if auth or account lookups fail transiently.
  }

  const isOwner = viewer?.id === slab.vendorId;
  const viewerName = viewer?.companyName ?? viewer?.contactName ?? null;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Browse", href: "/browse" },
          { label: slab.name },
        ]}
      />

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            {primaryImageUrl ? (
              <SlabPhoto
                src={primaryImageUrl}
                alt={slab.name}
                loading="eager"
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
              {gallery.slice(0, 4).map((image) => {
                const thumbUrl =
                  getOptimizedImageUrl(image.url, {
                    width: 240,
                    height: 240,
                    crop: "fill",
                  }) ?? image.url;

                return (
                  <SlabPhoto
                    key={image.id}
                    src={thumbUrl}
                    alt={slab.name}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#0d8fa8]">
              {slab.material?.name ?? "Stone"}
              <span className="text-slate-400">
                | {slab.type === "remnant" ? "Remnant" : "Full slab"}
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
            <Detail label="Total area">
              {formatSqft(slab.widthCm, slab.heightCm) ?? "Not provided"}
            </Detail>
            <Detail label="Finish">
              {finishLabels[slab.finish] ?? slab.finish}
            </Detail>
            <Detail label="Color family">
              {slab.colorFamily ?? "Not provided"}
            </Detail>
            <Detail label="Quantity">{String(slab.quantity)}</Detail>
            {slab.brandSupplier ? (
              <Detail label="Brand / supplier">{slab.brandSupplier}</Detail>
            ) : null}
            {slab.type === "full_slab" && slab.status === "available" ? (
              <Detail label="In stock">
                {slab.quantity} slab{slab.quantity === 1 ? "" : "s"}
              </Detail>
            ) : null}
          </dl>

          {slab.notes ? (
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {slab.notes}
            </p>
          ) : null}

          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-sm font-medium">
              {vendorContact
                ? `Sold by ${vendorName}`
                : "Sold by a verified SmartSlab vendor"}
            </p>

            {vendorContact ? (
              <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm dark:border-slate-700">
                <p className="font-medium text-emerald-600 dark:text-emerald-400">
                  Contact details unlocked
                </p>
                {vendorContact.contactName ? (
                  <p>{vendorContact.contactName}</p>
                ) : null}
                {vendorContact.phone ? <p>{vendorContact.phone}</p> : null}
                <p>{vendorContact.email}</p>
                {vendorContact.address ? (
                  <p className="text-slate-500">
                    {[
                      vendorContact.address,
                      vendorContact.city,
                      vendorContact.state,
                      vendorContact.zip,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-3 border-t border-slate-200 pt-3 text-sm text-slate-500 dark:border-slate-700">
                The vendor name, phone, and exact location are shared securely
                once your payment is processed through SmartSlab.
              </div>
            )}
          </div>

          {paid ? (
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Payment received. The vendor contact details are now unlocked
              below.
            </div>
          ) : null}
          {canceled ? (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              Checkout canceled. You can try again whenever you are ready.
            </div>
          ) : null}

          {isOwner ? (
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/dashboard/slabs/${slab.id}/edit`}
                className="inline-flex h-11 items-center rounded-lg bg-[#1bb0ce] px-5 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
              >
                Edit listing
              </Link>
              <Link
                href="/dashboard/slabs"
                className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-5 text-sm font-medium transition hover:border-[#1bb0ce] hover:text-[#0d8fa8] dark:border-slate-700"
              >
                Manage inventory
              </Link>
            </div>
          ) : slab.status === "available" ? (
            <>
              <div className="flex flex-wrap gap-3">
                {isStripeConfigured() ? (
                  <BuyButton slabId={slab.id} />
                ) : (
                  <button
                    disabled
                    className="inline-flex h-11 w-fit cursor-not-allowed items-center rounded-lg bg-slate-300 px-5 text-sm font-medium text-white"
                  >
                    Checkout coming soon
                  </button>
                )}
                <FavoriteButton slabId={slab.id} isFavorite={favorite} />
                <CompareButton slabId={slab.id} />
              </div>
              <QuoteRequestForm
                slabId={slab.id}
                defaultName={viewerName}
                defaultEmail={viewer?.email}
                defaultPhone={viewer?.phone}
              />
            </>
          ) : slab.status === "reserved" ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              Reserved. A buyer is completing checkout. Check back in a few
              minutes if it falls through.
            </div>
          ) : slab.status === "sold" ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              This slab has been sold
            </div>
          ) : (
            <span className="inline-flex h-11 w-fit items-center rounded-lg bg-slate-200 px-5 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              No longer available
            </span>
          )}
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
