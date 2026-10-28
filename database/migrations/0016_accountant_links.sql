CREATE TABLE "accountant_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"issuing_profile_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"token_encrypted" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "accountant_links_token_hash_idx" ON "accountant_links" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "accountant_links_profile_idx" ON "accountant_links" USING btree ("user_id","issuing_profile_id");