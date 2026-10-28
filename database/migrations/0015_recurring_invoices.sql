CREATE TYPE "public"."recurring_mode" AS ENUM('draft', 'stamp');--> statement-breakpoint
CREATE TABLE "recurring_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"issuing_profile_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"source_invoice_id" uuid,
	"template" jsonb NOT NULL,
	"day_of_month" smallint NOT NULL,
	"mode" "recurring_mode" DEFAULT 'draft' NOT NULL,
	"period_offset" smallint DEFAULT 0 NOT NULL,
	"next_run_on" date NOT NULL,
	"last_run_on" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "recurring_invoice_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "recurring_period" varchar(7);--> statement-breakpoint
ALTER TABLE "issuing_profiles" ADD COLUMN "auto_reminders" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD COLUMN "automatic" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recurring_invoices_user_idx" ON "recurring_invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recurring_invoices_due_idx" ON "recurring_invoices" USING btree ("active","next_run_on");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_recurring_invoice_id_recurring_invoices_id_fk" FOREIGN KEY ("recurring_invoice_id") REFERENCES "public"."recurring_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_recurring_period_idx" ON "invoices" USING btree ("recurring_invoice_id","recurring_period");