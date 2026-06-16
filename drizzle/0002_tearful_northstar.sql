ALTER TABLE "slabs" ADD COLUMN "lat" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "slabs" ADD COLUMN "lng" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "slabs" ADD COLUMN "room_use" text[];--> statement-breakpoint
ALTER TABLE "slabs" ADD COLUMN "aesthetic_tags" text[];