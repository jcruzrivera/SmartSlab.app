import type { MetadataRoute } from "next";

import { CANONICAL_APP_ORIGIN } from "@/lib/app-origin";

function baseUrl(): string {
  return CANONICAL_APP_ORIGIN;
}

export default function robots(): MetadataRoute.Robots {
  const origin = baseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/browse", "/slab", "/faq", "/legal"],
      disallow: ["/admin", "/account", "/dashboard", "/api", "/checkout"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
