import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

import { neon } from "@neondatabase/serverless";

// Idempotent version of drizzle/0009_qr_inventory.sql — safe to run against a
// live Neon database (the drizzle HTTP/websocket driver can't apply raw .sql
// files, so we replay the statements guarded with IF NOT EXISTS / catch blocks).
const STATEMENTS = [
  `DO $$ BEGIN
    CREATE TYPE "public"."inventory_event_type" AS ENUM('used', 'sold_offline', 'adjusted', 'remnant_created', 'marked_missing', 'restored');
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    CREATE TYPE "public"."reconciliation_status" AS ENUM('open', 'completed', 'abandoned');
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `ALTER TABLE "slabs" ADD COLUMN IF NOT EXISTS "short_code" text`,
  `ALTER TABLE "slabs" ADD COLUMN IF NOT EXISTS "parent_slab_id" uuid`,
  `DO $$ BEGIN
    ALTER TABLE "slabs" ADD CONSTRAINT "slabs_short_code_unique" UNIQUE("short_code");
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "slabs" ADD CONSTRAINT "slabs_parent_slab_id_slabs_id_fk" FOREIGN KEY ("parent_slab_id") REFERENCES "public"."slabs"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "inventory_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "slab_id" uuid NOT NULL,
    "vendor_id" uuid NOT NULL,
    "event_type" "inventory_event_type" NOT NULL,
    "quantity_delta" integer NOT NULL,
    "note" text,
    "session_id" uuid,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "reconciliation_sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "vendor_id" uuid NOT NULL,
    "status" "reconciliation_status" DEFAULT 'open' NOT NULL,
    "started_at" timestamp with time zone DEFAULT now() NOT NULL,
    "completed_at" timestamp with time zone,
    "summary" jsonb
  )`,
  `CREATE TABLE IF NOT EXISTS "reconciliation_scans" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "session_id" uuid NOT NULL,
    "slab_id" uuid NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `DO $$ BEGIN
    ALTER TABLE "inventory_events" ADD CONSTRAINT "inventory_events_slab_id_slabs_id_fk" FOREIGN KEY ("slab_id") REFERENCES "public"."slabs"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "inventory_events" ADD CONSTRAINT "inventory_events_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "reconciliation_sessions" ADD CONSTRAINT "reconciliation_sessions_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "reconciliation_scans" ADD CONSTRAINT "reconciliation_scans_session_id_reconciliation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."reconciliation_sessions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "reconciliation_scans" ADD CONSTRAINT "reconciliation_scans_slab_id_slabs_id_fk" FOREIGN KEY ("slab_id") REFERENCES "public"."slabs"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE INDEX IF NOT EXISTS "inventory_events_vendor_created_idx" ON "inventory_events" USING btree ("vendor_id","created_at")`,
  `CREATE INDEX IF NOT EXISTS "inventory_events_slab_idx" ON "inventory_events" USING btree ("slab_id")`,
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
    console.log("✓", statement.trim().split("\n")[0].slice(0, 72));
  }

  const [row] = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'slabs'
      AND column_name = 'short_code'
  `;

  if (!row) {
    console.error("Migration finished but slabs.short_code is still missing.");
    process.exit(1);
  }

  console.log("✓ QR inventory schema is present.");
}

main().catch((error) => {
  console.error("Failed to apply QR inventory migration:", error);
  process.exit(1);
});
