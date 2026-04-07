CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"conekta_customer_id" text,
	"stamps_balance" integer DEFAULT 3 NOT NULL,
	"total_stamps_purchased" integer DEFAULT 0 NOT NULL,
	"total_stamps_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "stamp_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"package_id" text NOT NULL,
	"stamps_added" integer NOT NULL,
	"amount_mxn" integer NOT NULL,
	"conekta_order_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "subscriptions" CASCADE;--> statement-breakpoint
DROP TYPE "public"."plan";--> statement-breakpoint
DROP TYPE "public"."subscription_status";