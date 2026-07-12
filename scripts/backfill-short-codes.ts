import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

import { neon } from "@neondatabase/serverless";

import { generateShortCode } from "../lib/inventory/short-code";

type SlabRow = { id: string };

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = neon(url);

  const slabs = (await sql`
    SELECT id FROM slabs WHERE short_code IS NULL
  `) as SlabRow[];

  console.log(`Found ${slabs.length} slab(s) needing a short code.`);

  const taken = new Set<string>();
  const existing = (await sql`
    SELECT short_code FROM slabs WHERE short_code IS NOT NULL
  `) as Array<{ short_code: string }>;
  for (const row of existing) {
    taken.add(row.short_code);
  }

  let assigned = 0;

  for (const slab of slabs) {
    let code = generateShortCode();
    let attempts = 0;
    while (taken.has(code)) {
      code = generateShortCode();
      attempts += 1;
      if (attempts > 10) {
        throw new Error(`Could not find a unique short code for ${slab.id}`);
      }
    }

    await sql`
      UPDATE slabs
      SET short_code = ${code}, updated_at = NOW()
      WHERE id = ${slab.id}::uuid AND short_code IS NULL
    `;

    taken.add(code);
    assigned += 1;
    console.log(`✓ ${slab.id.slice(0, 8)}… → ${code}`);
  }

  console.log(`Backfill complete. Assigned ${assigned} short code(s).`);
}

main().catch((error) => {
  console.error("Failed to backfill short codes:", error);
  process.exit(1);
});
