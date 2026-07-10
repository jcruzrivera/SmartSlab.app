import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

import { neon } from "@neondatabase/serverless";

const STATEMENTS = [
  `DO $$ BEGIN
    CREATE TYPE "public"."user_plan" AS ENUM('free', 'pro', 'premium');
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    CREATE TYPE "public"."plan_status" AS ENUM('active', 'past_due', 'canceled', 'none');
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan" "user_plan" DEFAULT 'free' NOT NULL`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan_status" "plan_status" DEFAULT 'none' NOT NULL`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan_renews_at" timestamp with time zone`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "smartfinder_searches_used" integer DEFAULT 0 NOT NULL`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "smartfinder_reset_at" timestamp with time zone`,
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
      AND column_name = 'plan'
  `;

  if (!row) {
    console.error("Migration finished but users.plan is still missing.");
    process.exit(1);
  }

  console.log("✓ Subscription plan columns are present on users.");
}

main().catch((error) => {
  console.error("Failed to apply subscription migration:", error);
  process.exit(1);
});
