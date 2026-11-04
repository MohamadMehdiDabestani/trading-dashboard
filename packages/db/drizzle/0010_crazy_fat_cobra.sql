CREATE TYPE "public"."login_method" AS ENUM('otp', 'password', 'qr');--> statement-breakpoint
CREATE TYPE "public"."login_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TABLE "login_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"phone" text,
	"method" "login_method" NOT NULL,
	"status" "login_status" NOT NULL,
	"failure_reason" text,
	"is_new_user" boolean DEFAULT false NOT NULL,
	"ip" text,
	"user_agent" text,
	"device_link_request_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_device_link_request_id_device_login_requests_id_fk" FOREIGN KEY ("device_link_request_id") REFERENCES "public"."device_login_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "login_events_user_idx" ON "login_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "login_events_phone_idx" ON "login_events" USING btree ("phone","created_at");