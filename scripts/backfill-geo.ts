import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

import { neon } from "@neondatabase/serverless";

type SlabRow = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  zip: string | null;
};

function buildAddressQuery(row: SlabRow): string {
  return [row.city, row.state, row.zip]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=" +
    encodeURIComponent(query);

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "SmartSlab/1.0 (backfill geocoding)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = data[0];
    if (!first?.lat || !first?.lon) return null;
    const lat = Number.parseFloat(first.lat);
    const lng = Number.parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = neon(url);

  const rows = (await sql`
    SELECT id, name, city, state, zip
    FROM slabs
    WHERE (lat IS NULL OR lng IS NULL)
      AND (city IS NOT NULL OR zip IS NOT NULL)
    ORDER BY created_at DESC
  `) as SlabRow[];

  if (rows.length === 0) {
    console.log("Nothing to backfill — all listings already have coordinates.");
    return;
  }

  console.log(`Backfilling coordinates for ${rows.length} listing(s)...`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const query = buildAddressQuery(row);
    if (!query) {
      console.log(`- "${row.name}": no location text, skipping`);
      skipped += 1;
      continue;
    }

    const point = await geocode(query);
    if (!point) {
      console.log(`- "${row.name}" (${query}): no match, skipping`);
      skipped += 1;
    } else {
      await sql`
        UPDATE slabs
        SET lat = ${point.lat.toString()}, lng = ${point.lng.toString()}
        WHERE id = ${row.id}
      `;
      console.log(
        `- "${row.name}" (${query}) -> ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
      );
      updated += 1;
    }

    // Respect Nominatim's ~1 request/second usage policy.
    await sleep(1100);
  }

  console.log(`Done. Updated ${updated}, skipped ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
