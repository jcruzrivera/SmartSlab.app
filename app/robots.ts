import type { MetadataRoute } from "next";

import { getConfiguredAppUrl } from "@/lib/url";

function baseUrl(): string {
  return getConfiguredAppUrl();
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
