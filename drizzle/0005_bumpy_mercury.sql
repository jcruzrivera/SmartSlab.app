CREATE TYPE "public"."quote_status" AS ENUM('new', 'contacted', 'quoted', 'closed', 'cancelled');--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slab_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slab_id" uuid,
	"image_url" text NOT NULL,
	"category" text NOT NULL,
	"confidence" numeric(3, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid,
	"vendor_id" uuid NOT NULL,
	"slab_id" uuid NOT NULL,
	"status" "quote_status" DEFAULT 'new' NOT NULL,
	"buyer_name" text,
	"buyer_email" text NOT NULL,
	"buyer_phone" text,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "slabs" ADD COLUMN "width_in" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "slabs" ADD COLUMN "height_in" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "slabs" ADD COLUMN "is_small_sample" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "slabs" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_slab_id_slabs_id_fk" FOREIGN KEY ("slab_id") REFERENCES "public"."slabs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_flags" ADD CONSTRAINT "listing_flags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_flags" ADD CONSTRAINT "listing_flags_slab_id_slabs_id_fk" FOREIGN KEY ("slab_id") REFERENCES "public"."slabs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_slab_id_slabs_id_fk" FOREIGN KEY ("slab_id") REFERENCES "public"."slabs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_slab_unique" ON "favorites" USING btree ("user_id","slab_id");--> statement-breakpoint
ALTER TABLE "slabs" DROP COLUMN "width_cm";--> statement-breakpoint
ALTER TABLE "slabs" DROP COLUMN "height_cm";