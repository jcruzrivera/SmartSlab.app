import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

import { neon } from "@neondatabase/serverless";

const MATERIAL_SEED = [
  { slug: "granite", name: "Granite", description: "Durable natural stone." },
  { slug: "quartz", name: "Quartz", description: "Engineered stone surfaces." },
  { slug: "quartzite", name: "Quartzite", description: "Natural metamorphic stone." },
  { slug: "marble", name: "Marble", description: "Classic veined natural stone." },
  { slug: "dolomite", name: "Dolomite", description: "Durable marble alternative." },
  { slug: "other", name: "Other", description: "Other stone materials." },
];

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = neon(url);

  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log(
    "Tables:",
    tables.map((row) => row.table_name).join(", "),
  );

  for (const material of MATERIAL_SEED) {
    await sql`
      INSERT INTO materials (slug, name, description)
      VALUES (${material.slug}, ${material.name}, ${material.description})
      ON CONFLICT (slug) DO NOTHING
    `;
  }

  const materials = await sql`SELECT slug, name FROM materials ORDER BY name`;
  console.log(
    "Materials seeded:",
    materials.map((row) => row.name).join(", "),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
