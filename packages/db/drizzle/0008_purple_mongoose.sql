CREATE TYPE "public"."device_link_status" AS ENUM('pending', 'opened', 'approved', 'denied', 'consumed');--> statement-breakpoint
CREATE TABLE "device_login_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"poll_secret_hash" text,
	"verification_code" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"status" "device_link_status" DEFAULT 'pending' NOT NULL,
	"creator_ip" text,
	"creator_user_agent" text,
	"opener_ip" text,
	"opener_user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"opened_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "device_login_requests_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'User'::text;--> statement-breakpoint
DROP TYPE "public"."role";--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('Admin', 'User');--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'User'::"public"."role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";--> statement-breakpoint
ALTER TABLE "device_login_requests" ADD CONSTRAINT "device_login_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "device_login_requests_user_idx" ON "device_login_requests" USING btree ("user_id","status");