DROP TABLE "user_fiscal_profile" CASCADE;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "issuing_profile_id" uuid;