import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

import { neon } from "@neondatabase/serverless";

import {
  buildStoreSlugSource,
  ensureUniqueStoreSlug,
  normalizeStoreSlug,
} from "../lib/stores/slug";

type VendorRow = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = neon(url);

  const vendors = (await sql`
    SELECT DISTINCT u.id, u.company_name, u.contact_name
    FROM users u
    INNER JOIN slabs s ON s.vendor_id = u.id
    WHERE u.role IN ('vendor', 'both')
      AND u.store_slug IS NULL
      AND s.status = 'available'
      AND s.deleted_at IS NULL
  `) as VendorRow[];

  console.log(`Found ${vendors.length} vendor(s) needing store slugs.`);

  const taken = new Set<string>();
  const existing = (await sql`
    SELECT store_slug FROM users WHERE store_slug IS NOT NULL
  `) as Array<{ store_slug: string }>;
  for (const row of existing) {
    taken.add(row.store_slug);
  }

  let assigned = 0;

  for (const vendor of vendors) {
    const source = buildStoreSlugSource({
      companyName: vendor.company_name,
      contactName: vendor.contact_name,
    });
    const base = normalizeStoreSlug(source);

    const slug = await ensureUniqueStoreSlug(base, async (candidate) =>
      taken.has(candidate),
    );

    await sql`
      UPDATE users
      SET store_slug = ${slug}, updated_at = NOW()
      WHERE id = ${vendor.id}::uuid AND store_slug IS NULL
    `;

    taken.add(slug);
    assigned += 1;
    console.log(`✓ ${vendor.id.slice(0, 8)}… → ${slug}`);
  }

  console.log(`Backfill complete. Assigned ${assigned} store slug(s).`);
}

main().catch((error) => {
  console.error("Failed to backfill store slugs:", error);
  process.exit(1);
});
