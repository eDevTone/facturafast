ALTER TABLE "accounts" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "stamp_purchases" ADD COLUMN "payment_provider" text DEFAULT 'conekta' NOT NULL;--> statement-breakpoint
ALTER TABLE "stamp_purchases" ADD COLUMN "stripe_session_id" text;