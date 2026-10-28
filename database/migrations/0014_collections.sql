CREATE TYPE "public"."reminder_channel" AS ENUM('whatsapp', 'email');--> statement-breakpoint
CREATE TABLE "payment_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"invoice_id" uuid NOT NULL,
	"channel" "reminder_channel" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "payment_terms_days" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_terms_days" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "awaiting_payment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "issuing_profiles" ADD COLUMN "bank_name" varchar(60);--> statement-breakpoint
ALTER TABLE "issuing_profiles" ADD COLUMN "clabe" varchar(18);--> statement-breakpoint
ALTER TABLE "issuing_profiles" ADD COLUMN "payment_link" text;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_reminders_invoice_idx" ON "payment_reminders" USING btree ("invoice_id");