CREATE TYPE "public"."cancellation_status" AS ENUM('en_proceso', 'rechazada');--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "relation_type" varchar(2);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "related_uuid" varchar(36);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cancellation_status" "cancellation_status";--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cancellation_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cancellation_substitute_uuid" varchar(36);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "sat_cancellable" varchar(40);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "sat_cancellation_status" varchar(40);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "sat_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "related_uuid" varchar(36);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "cancellation_status" "cancellation_status";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "cancellation_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "cancellation_substitute_uuid" varchar(36);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "sat_cancellable" varchar(40);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "sat_cancellation_status" varchar(40);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "sat_checked_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "invoices_related_uuid_idx" ON "invoices" USING btree ("related_uuid");--> statement-breakpoint
CREATE INDEX "payments_related_uuid_idx" ON "payments" USING btree ("related_uuid");