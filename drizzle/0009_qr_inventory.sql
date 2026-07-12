CREATE TYPE "public"."inventory_event_type" AS ENUM('used', 'sold_offline', 'adjusted', 'remnant_created', 'marked_missing', 'restored');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_status" AS ENUM('open', 'completed', 'abandoned');--> statement-breakpoint
ALTER TABLE "slabs" ADD COLUMN "short_code" text;--> statement-breakpoint
ALTER TABLE "slabs" ADD COLUMN "parent_slab_id" uuid;--> statement-breakpoint
ALTER TABLE "slabs" ADD CONSTRAINT "slabs_short_code_unique" UNIQUE("short_code");--> statement-breakpoint
ALTER TABLE "slabs" ADD CONSTRAINT "slabs_parent_slab_id_slabs_id_fk" FOREIGN KEY ("parent_slab_id") REFERENCES "public"."slabs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
CREATE TABLE "reconciliation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "reconciliation_status" DEFAULT 'open' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"summary" jsonb
);
--> statement-breakpoint
CREATE TABLE "reconciliation_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"slab_id" uuid NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_events" ADD CONSTRAINT "inventory_events_slab_id_slabs_id_fk" FOREIGN KEY ("slab_id") REFERENCES "public"."slabs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_events" ADD CONSTRAINT "inventory_events_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_sessions" ADD CONSTRAINT "reconciliation_sessions_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_scans" ADD CONSTRAINT "reconciliation_scans_session_id_reconciliation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."reconciliation_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_scans" ADD CONSTRAINT "reconciliation_scans_slab_id_slabs_id_fk" FOREIGN KEY ("slab_id") REFERENCES "public"."slabs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_events_vendor_created_idx" ON "inventory_events" USING btree ("vendor_id","created_at");--> statement-breakpoint
CREATE INDEX "inventory_events_slab_idx" ON "inventory_events" USING btree ("slab_id");
