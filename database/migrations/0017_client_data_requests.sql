CREATE TYPE "public"."client_request_status" AS ENUM('pendiente', 'completada', 'cancelada');--> statement-breakpoint
CREATE TABLE "client_data_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"issuing_profile_id" uuid NOT NULL,
	"client_id" uuid,
	"label" varchar(120) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"token_encrypted" text NOT NULL,
	"status" "client_request_status" DEFAULT 'pendiente' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "client_data_requests" ADD CONSTRAINT "client_data_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "client_data_requests_token_hash_idx" ON "client_data_requests" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "client_data_requests_user_idx" ON "client_data_requests" USING btree ("user_id","status");