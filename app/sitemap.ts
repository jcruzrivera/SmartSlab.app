import type { MetadataRoute } from "next";

import { isDbConfigured } from "@/lib/db/client";
import { listMaterials } from "@/lib/db/materials";
import { listPublicSlabs } from "@/lib/db/slabs";
import { LEGAL_NAV } from "@/lib/legal/nav";
import { getConfiguredAppUrl } from "@/lib/url";

function baseUrl(): string {
  return getConfiguredAppUrl();
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
      url: `${origin}/how-it-works`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${origin}/legal`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...LEGAL_NAV.filter((item) => item.href.startsWith("/legal/")).map((item) => ({
      url: `${origin}${item.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
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
