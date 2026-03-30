ALTER TABLE "invoices" ADD COLUMN "sat_certificate_number" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cfdi_signature" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "sat_signature" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "sat_original_chain" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "qr_code" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "stamped_at" timestamp with time zone;