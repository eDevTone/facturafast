CREATE TABLE "exchange_rates" (
	"currency" varchar(3) NOT NULL,
	"day" date NOT NULL,
	"rate" numeric(12, 6) NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exchange_rates_currency_day_pk" PRIMARY KEY("currency","day")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"code" varchar(3) PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"tax_id_format" text
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"code" varchar(3) PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"decimals" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "postal_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "country" varchar(3);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "foreign_tax_id" varchar(40);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "iva_rate" numeric(8, 6);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "exchange_rate" numeric(12, 6);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "exchange_rate_source" varchar(10);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "iva_rate" numeric(8, 6) DEFAULT '0.16' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "exchange_rate" numeric(12, 6);