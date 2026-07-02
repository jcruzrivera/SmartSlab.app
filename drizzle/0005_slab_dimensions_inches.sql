-- Rename mislabeled slab dimension columns: values were always inches, not cm.
ALTER TABLE "slabs" RENAME COLUMN "width_cm" TO "width_in";
--> statement-breakpoint
ALTER TABLE "slabs" RENAME COLUMN "height_cm" TO "height_in";
