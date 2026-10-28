CREATE TABLE "catalog_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"description" text NOT NULL,
	"product_service_code" varchar(8) NOT NULL,
	"unit" varchar(10) DEFAULT 'E48' NOT NULL,
	"unit_price" numeric(15, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "catalog_items_user_idx" ON "catalog_items" USING btree ("user_id");