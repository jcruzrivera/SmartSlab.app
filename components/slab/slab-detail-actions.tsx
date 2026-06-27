"use client";

import { BuyButton } from "@/components/payments/buy-button";
import { CompareButton } from "@/components/slab/compare-button";
import { FavoriteButton } from "@/components/slab/favorite-button";
import { QuoteRequestForm } from "@/components/slab/quote-request-form";

export type SlabDetailActionsProps = {
  slabId: string;
  isFavorite: boolean;
  checkoutEnabled: boolean;
  defaultName?: string | null;
  defaultEmail?: string | null;
  defaultPhone?: string | null;
};

export function SlabDetailActions({
  slabId,
  isFavorite,
  checkoutEnabled,
  defaultName,
  defaultEmail,
  defaultPhone,
}: SlabDetailActionsProps) {
  return (
    <>
      <div className="flex flex-wrap gap-3">
        {checkoutEnabled ? (
          <BuyButton slabId={slabId} />
        ) : (
          <button
            disabled
            className="inline-flex h-11 w-fit cursor-not-allowed items-center rounded-lg bg-slate-300 px-5 text-sm font-medium text-white"
          >
            Checkout coming soon
          </button>
        )}
        <FavoriteButton slabId={slabId} isFavorite={isFavorite} />
        <CompareButton slabId={slabId} />
      </div>
      <QuoteRequestForm
        slabId={slabId}
        defaultName={defaultName}
        defaultEmail={defaultEmail}
        defaultPhone={defaultPhone}
      />
    </>
  );
}
