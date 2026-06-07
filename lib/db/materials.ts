import { asc } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { materials } from "@/lib/db/schema";

export type Material = typeof materials.$inferSelect;

export const MATERIAL_SEED: Array<{
  slug: string;
  name: string;
  description: string;
}> = [
  { slug: "granite", name: "Granite", description: "Durable natural stone." },
  { slug: "quartz", name: "Quartz", description: "Engineered stone surfaces." },
  {
    slug: "quartzite",
    name: "Quartzite",
    description: "Natural metamorphic stone.",
  },
  { slug: "marble", name: "Marble", description: "Classic veined natural stone." },
  { slug: "dolomite", name: "Dolomite", description: "Durable marble alternative." },
  { slug: "other", name: "Other", description: "Other stone materials." },
];

let seeded = false;

export async function ensureMaterials(): Promise<void> {
  if (seeded || !isDbConfigured()) {
    return;
  }

  const db = getDb();
  await db.insert(materials).values(MATERIAL_SEED).onConflictDoNothing({
    target: materials.slug,
  });
  seeded = true;
}

export async function listMaterials(): Promise<Material[]> {
  if (!isDbConfigured()) {
    return [];
  }

  await ensureMaterials();
  const db = getDb();
  return db.select().from(materials).orderBy(asc(materials.name));
}
