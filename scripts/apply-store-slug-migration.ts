import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

import { neon } from "@neondatabase/serverless";

const STATEMENTS = [
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "store_slug" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "store_public" boolean DEFAULT true NOT NULL`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "store_slug_locked" boolean DEFAULT false NOT NULL`,
  `DO $$ BEGIN
    ALTER TABLE "users" ADD CONSTRAINT "users_store_slug_unique" UNIQUE("store_slug");
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
];

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error(
      "DATABASE_URL is not set. Point .env.local at your Neon production URL and rerun.",
    );
    process.exit(1);
  }

  const sql = neon(url);

  for (const statement of STATEMENTS) {
    await sql.query(statement);
    console.log("✓", statement.split("\n")[0].slice(0, 72));
  }

  const [row] = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'store_slug'
  `;

  if (!row) {
    console.error("Migration finished but users.store_slug is still missing.");
    process.exit(1);
  }

  console.log("✓ Store slug columns are present on users.");
}

main().catch((error) => {
  console.error("Failed to apply store slug migration:", error);
  process.exit(1);
});
