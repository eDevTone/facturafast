CREATE TYPE "public"."payment_status" AS ENUM('en_timbrado', 'timbrado', 'cancelado');--> statement-breakpoint
CREATE TABLE "payment_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"installment" integer NOT NULL,
	"previous_balance" numeric(15, 2) NOT NULL,
	"amount_paid" numeric(15, 2) NOT NULL,
	"remaining_balance" numeric(15, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"issuing_profile_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"serie" varchar(25) DEFAULT 'P' NOT NULL,
	"folio" integer NOT NULL,
	"paid_on" date NOT NULL,
	"payment_form" varchar(2) NOT NULL,
	"currency" varchar(3) DEFAULT 'MXN' NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"operation_number" varchar(100),
	"status" "payment_status" DEFAULT 'en_timbrado' NOT NULL,
	"stamping_started_at" timestamp with time zone,
	"issued_at" timestamp with time zone,
	"uuid" varchar(36),
	"xml_content" text,
	"xml_url" text,
	"pdf_url" text,
	"sat_certificate_number" text,
	"cfdi_signature" text,
	"sat_signature" text,
	"sat_original_chain" text,
	"qr_code" text,
	"stamped_at" timestamp with time zone,
	"cancellation_reason" varchar(2),
	"cancellation_acuse_url" text,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_documents" ADD CONSTRAINT "payment_documents_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_documents" ADD CONSTRAINT "payment_documents_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_documents_invoice_idx" ON "payment_documents" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_profile_serie_folio_idx" ON "payments" USING btree ("issuing_profile_id","serie","folio");