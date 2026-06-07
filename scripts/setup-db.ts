import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error(
      "DATABASE_URL is not set. Add it to .env.local before running this script.",
    );
    process.exit(1);
  }

  const sql = neon(url);

  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("✓ pgvector extension is ready.");
}

main().catch((error) => {
  console.error("Failed to set up the database:", error);
  process.exit(1);
});
