CREATE TYPE "public"."inventory_event_type" AS ENUM('used', 'sold_offline', 'adjusted', 'remnant_created', 'marked_missing', 'restored');--> statement-breakpoint
CREATE TYPE "public"."plan_status" AS ENUM('active', 'past_due', 'canceled', 'none');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_status" AS ENUM('open', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."sf_piece_kind" AS ENUM('countertop', 'backsplash', 'island', 'other');--> statement-breakpoint
CREATE TYPE "public"."sf_project_status" AS ENUM('draft', 'placed', 'quoted', 'ordered');--> statement-breakpoint
CREATE TYPE "public"."user_plan" AS ENUM('free', 'pro', 'premium');--> statement-breakpoint
CREATE TABLE "inventory_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slab_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"event_type" "inventory_event_type" NOT NULL,
	"quantity_delta" integer NOT NULL,
	"note" text,
	"session_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reconciliation_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"slab_id" uuid NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reconciliation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "reconciliation_status" DEFAULT 'open' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"summary" jsonb
);
--> statement-breakpoint
CREATE TABLE "sf_layouts" (
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
);
--> statement-breakpoint
CREATE TABLE "sf_pieces" (
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
);
--> statement-breakpoint
CREATE TABLE "sf_placements" (
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
);
--> statement-breakpoint
CREATE TABLE "sf_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "sf_project_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "slabs" ADD COLUMN "short_code" text;--> statement-breakpoint
ALTER TABLE "slabs" ADD COLUMN "parent_slab_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan" "user_plan" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_status" "plan_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_renews_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "smartfinder_searches_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "smartfinder_reset_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "store_slug" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "store_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "store_slug_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_events" ADD CONSTRAINT "inventory_events_slab_id_slabs_id_fk" FOREIGN KEY ("slab_id") REFERENCES "public"."slabs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_events" ADD CONSTRAINT "inventory_events_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_scans" ADD CONSTRAINT "reconciliation_scans_session_id_reconciliation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."reconciliation_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_scans" ADD CONSTRAINT "reconciliation_scans_slab_id_slabs_id_fk" FOREIGN KEY ("slab_id") REFERENCES "public"."slabs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_sessions" ADD CONSTRAINT "reconciliation_sessions_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sf_layouts" ADD CONSTRAINT "sf_layouts_project_id_sf_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sf_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sf_pieces" ADD CONSTRAINT "sf_pieces_project_id_sf_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sf_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sf_placements" ADD CONSTRAINT "sf_placements_layout_id_sf_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."sf_layouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sf_placements" ADD CONSTRAINT "sf_placements_piece_id_sf_pieces_id_fk" FOREIGN KEY ("piece_id") REFERENCES "public"."sf_pieces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sf_placements" ADD CONSTRAINT "sf_placements_slab_id_slabs_id_fk" FOREIGN KEY ("slab_id") REFERENCES "public"."slabs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sf_projects" ADD CONSTRAINT "sf_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_events_vendor_created_idx" ON "inventory_events" USING btree ("vendor_id","created_at");--> statement-breakpoint
CREATE INDEX "inventory_events_slab_idx" ON "inventory_events" USING btree ("slab_id");--> statement-breakpoint
CREATE INDEX "sf_layouts_project_idx" ON "sf_layouts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "sf_pieces_project_sort_idx" ON "sf_pieces" USING btree ("project_id","sort_order");--> statement-breakpoint
CREATE INDEX "sf_placements_layout_idx" ON "sf_placements" USING btree ("layout_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sf_placements_layout_piece_unique" ON "sf_placements" USING btree ("layout_id","piece_id");--> statement-breakpoint
ALTER TABLE "slabs" ADD CONSTRAINT "slabs_parent_slab_id_slabs_id_fk" FOREIGN KEY ("parent_slab_id") REFERENCES "public"."slabs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slabs" ADD CONSTRAINT "slabs_short_code_unique" UNIQUE("short_code");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_store_slug_unique" UNIQUE("store_slug");