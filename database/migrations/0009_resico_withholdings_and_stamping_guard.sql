ALTER TABLE "clients" ALTER COLUMN "cfdi_usage" SET DEFAULT 'G03';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "prices_include_iva" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "isr_withholding_rate" numeric(8, 6);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "iva_withholding_rate" numeric(8, 6);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "stamping_started_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "stamp_purchases_conekta_order_idx" ON "stamp_purchases" USING btree ("conekta_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stamp_purchases_stripe_session_idx" ON "stamp_purchases" USING btree ("stripe_session_id");--> statement-breakpoint
-- P01 "Por definir" does not exist in CFDI 4.0: move clients and drafts to G03 "Gastos en general".
UPDATE "clients" SET "cfdi_usage" = 'G03' WHERE "cfdi_usage" = 'P01';--> statement-breakpoint
UPDATE "invoices" SET "cfdi_usage" = 'G03' WHERE "cfdi_usage" = 'P01' AND "status" = 'draft';
