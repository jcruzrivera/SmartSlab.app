import type { MetadataRoute } from "next";

import { isDbConfigured } from "@/lib/db/client";
import { listMaterials } from "@/lib/db/materials";
import { listPublicSlabs } from "@/lib/db/slabs";

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://smart-slab-app.vercel.app"
  ).replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = baseUrl();
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: `${origin}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${origin}/browse`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${origin}/compare`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${origin}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  if (!isDbConfigured()) {
    return routes;
  }

  const [materials, slabs] = await Promise.all([
    listMaterials(),
    listPublicSlabs({ limit: 500 }),
  ]);

  return [
    ...routes,
    ...materials.map((material) => ({
      url: `${origin}/browse?material=${material.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...slabs.map((slab) => ({
      url: `${origin}/slab/${slab.id}`,
      lastModified: slab.updatedAt ?? slab.createdAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
