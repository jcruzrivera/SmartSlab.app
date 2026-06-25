ALTER TABLE "slabs" ADD COLUMN "quantity_sold" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "slabs" ADD COLUMN "reserved_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "slabs" ADD COLUMN "reserved_by" uuid;--> statement-breakpoint
ALTER TABLE "slabs" ADD CONSTRAINT "slabs_reserved_by_users_id_fk" FOREIGN KEY ("reserved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;