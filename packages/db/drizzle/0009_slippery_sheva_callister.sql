ALTER TABLE "refresh_tokens" ADD COLUMN "replaced_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "refresh_tokens_replaced_at_idx" ON "refresh_tokens" USING btree ("replaced_at");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens" USING btree ("expires_at");