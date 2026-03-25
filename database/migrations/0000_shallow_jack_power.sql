CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'timbrada', 'cancelada');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"rfc" varchar(13) NOT NULL,
	"business_name" text NOT NULL,
	"email" text,
	"phone" varchar(20),
	"postal_code" varchar(5) NOT NULL,
	"tax_regime" varchar(10),
	"cfdi_usage" varchar(10) DEFAULT 'P01' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_fiscal_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"rfc" varchar(13) NOT NULL,
	"business_name" text NOT NULL,
	"tax_regime" varchar(10) NOT NULL,
	"postal_code" varchar(5) NOT NULL,
	"fiscal_address" text,
	"certificate_cer" text,
	"certificate_key" text,
	"certificate_password" text,
	"tax_certificate_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"product_service_code" varchar(8) DEFAULT '84111506' NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(15, 2) NOT NULL,
	"unit" varchar(10) DEFAULT 'E48' NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"client_id" uuid NOT NULL,
	"folio" integer NOT NULL,
	"serie" varchar(25),
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"iva" numeric(15, 2) DEFAULT '0' NOT NULL,
	"withholdings" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'MXN' NOT NULL,
	"payment_form" varchar(2) NOT NULL,
	"payment_method" varchar(3) NOT NULL,
	"cfdi_usage" varchar(10) NOT NULL,
	"xml_url" text,
	"pdf_url" text,
	"uuid" varchar(36),
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"cancellation_reason" varchar(2),
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issuing_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"rfc" varchar(13) NOT NULL,
	"business_name" text NOT NULL,
	"tax_regime" varchar(10) NOT NULL,
	"postal_code" varchar(5) NOT NULL,
	"email" text NOT NULL,
	"phone" varchar(20),
	"is_default" boolean DEFAULT false NOT NULL,
	"cer_filename" text,
	"cer_base64" text,
	"key_filename" text,
	"key_base64" text,
	"key_password" text,
	"cert_serial_number" text,
	"cert_valid_from" text,
	"cert_valid_until" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cfdi_usage_types" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"applicable_to_moral" boolean DEFAULT true NOT NULL,
	"applicable_to_fisica" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_forms" (
	"code" varchar(2) PRIMARY KEY NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"code" varchar(3) PRIMARY KEY NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_service_codes" (
	"code" varchar(8) PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "tax_regimes" (
	"code" varchar(3) PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"applicable_to_moral" boolean DEFAULT false NOT NULL,
	"applicable_to_fisica" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_codes" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;