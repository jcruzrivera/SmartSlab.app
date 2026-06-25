import type { MetadataRoute } from "next";

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://smart-slab-app.vercel.app"
  ).replace(/\/$/, "");
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
