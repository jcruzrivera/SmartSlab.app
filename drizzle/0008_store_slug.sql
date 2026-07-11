ALTER TABLE "users" ADD COLUMN "store_slug" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "store_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "store_slug_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_store_slug_unique" UNIQUE("store_slug");
