"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";

/**
 * Records WordPress storefront-driven slab views when utm_source=wp_store.
 */
export function WpStoreUtmTracker({
  slabId,
  utmSource,
}: {
  slabId: string;
  utmSource?: string;
}) {
  useEffect(() => {
    if (utmSource !== "wp_store") {
      return;
    }

    track("slab_view", {
      utm_source: "wp_store",
      slab_id: slabId,
    });
  }, [slabId, utmSource]);

  return null;
}
