import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

import { neon } from "@neondatabase/serverless";

// Idempotent version of the sf_* portion of drizzle/0010_sf_layout_studio.sql —
// safe to run against a live Neon database. The generated migration file also
// re-emits objects from 0007-0009 (their meta snapshots were missing), so we
// replay ONLY the Layout Studio statements here, guarded with IF NOT EXISTS /
// duplicate_object catch blocks.
const STATEMENTS = [
  `DO $$ BEGIN
    CREATE TYPE "public"."sf_project_status" AS ENUM('draft', 'placed', 'quoted', 'ordered');
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    CREATE TYPE "public"."sf_piece_kind" AS ENUM('countertop', 'backsplash', 'island', 'other');
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "sf_projects" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "name" text NOT NULL,
    "status" "sf_project_status" DEFAULT 'draft' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "sf_pieces" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL,
    "kind" "sf_piece_kind" DEFAULT 'countertop' NOT NULL,
    "polygon" jsonb NOT NULL,
    "cutouts" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "vein_locked" boolean DEFAULT true NOT NULL,
    "edge_finished" jsonb,
    "label" text NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "sf_layouts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL,
    "engine_version" text NOT NULL,
    "kerf_in" numeric(6, 3) DEFAULT '0.125' NOT NULL,
    "margin_in" numeric(6, 3) DEFAULT '1.5' NOT NULL,
    "slabs_used" integer DEFAULT 1 NOT NULL,
    "total_piece_sqft" numeric(12, 2),
    "total_slab_sqft" numeric(12, 2),
    "waste_pct" numeric(5, 2),
    "est_cost" numeric(12, 2),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "sf_placements" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "layout_id" uuid NOT NULL,
    "piece_id" uuid NOT NULL,
    "slab_id" uuid,
    "virtual_slab" jsonb,
    "slab_index" integer DEFAULT 1 NOT NULL,
    "x_in" numeric(10, 2) NOT NULL,
    "y_in" numeric(10, 2) NOT NULL,
    "rotation" integer DEFAULT 0 NOT NULL,
    "piece_snapshot" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "sf_placements_slab_xor_virtual" CHECK ((("slab_id" IS NULL) <> ("virtual_slab" IS NULL))),
    CONSTRAINT "sf_placements_rotation_valid" CHECK ("rotation" IN (0, 90, 180, 270))
  )`,
  `DO $$ BEGIN
    ALTER TABLE "sf_projects" ADD CONSTRAINT "sf_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "sf_pieces" ADD CONSTRAINT "sf_pieces_project_id_sf_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sf_projects"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "sf_layouts" ADD CONSTRAINT "sf_layouts_project_id_sf_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sf_projects"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "sf_placements" ADD CONSTRAINT "sf_placements_layout_id_sf_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."sf_layouts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "sf_placements" ADD CONSTRAINT "sf_placements_piece_id_sf_pieces_id_fk" FOREIGN KEY ("piece_id") REFERENCES "public"."sf_pieces"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "sf_placements" ADD CONSTRAINT "sf_placements_slab_id_slabs_id_fk" FOREIGN KEY ("slab_id") REFERENCES "public"."slabs"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE INDEX IF NOT EXISTS "sf_pieces_project_sort_idx" ON "sf_pieces" USING btree ("project_id","sort_order")`,
  `CREATE INDEX IF NOT EXISTS "sf_layouts_project_idx" ON "sf_layouts" USING btree ("project_id")`,
  `CREATE INDEX IF NOT EXISTS "sf_placements_layout_idx" ON "sf_placements" USING btree ("layout_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "sf_placements_layout_piece_unique" ON "sf_placements" USING btree ("layout_id","piece_id")`,
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

  const rows = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('sf_projects', 'sf_pieces', 'sf_layouts', 'sf_placements')
    ORDER BY table_name
  `;

  if (rows.length !== 4) {
    console.error(
      `Migration finished but only ${rows.length}/4 sf_* tables are present:`,
      rows.map((r) => r.table_name).join(", "),
    );
    process.exit(1);
  }

  console.log("✓ Layout Studio schema (sf_projects, sf_pieces, sf_layouts, sf_placements) is present.");
}

main().catch((error) => {
  console.error("Failed to apply Layout Studio migration:", error);
  process.exit(1);
});
