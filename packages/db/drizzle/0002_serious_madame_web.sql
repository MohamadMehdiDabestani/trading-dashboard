CREATE TYPE "public"."ledger_entry_type" AS ENUM('deposit', 'withdraw', 'trade_buy', 'trade_sell', 'fee', 'lock', 'unlock', 'transfer_in', 'transfer_out');--> statement-breakpoint
CREATE TYPE "public"."order_side" AS ENUM('buy', 'sell');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('open', 'partial', 'filled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('limit', 'market');--> statement-breakpoint
CREATE TABLE "balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset" text NOT NULL,
	"available" numeric(36, 18) DEFAULT '0' NOT NULL,
	"locked" numeric(36, 18) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset" varchar(20) NOT NULL,
	"type" "ledger_entry_type" NOT NULL,
	"amount" numeric(36, 18) NOT NULL,
	"balance_before" numeric(36, 18) NOT NULL,
	"balance_after" numeric(36, 18) NOT NULL,
	"ref_id" uuid,
	"ref_type" varchar(50),
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"symbol" text NOT NULL,
	"side" "order_side" NOT NULL,
	"type" "order_type" NOT NULL,
	"price" numeric(36, 18),
	"quantity" numeric(36, 18) NOT NULL,
	"filled_quantity" numeric(36, 18) DEFAULT '0' NOT NULL,
	"status" "order_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" text NOT NULL,
	"buy_order_id" uuid NOT NULL,
	"sell_order_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"price" numeric(36, 18) NOT NULL,
	"quantity" numeric(36, 18) NOT NULL,
	"quote_quantity" numeric(36, 18) NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_locks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset" varchar(20) NOT NULL,
	"amount" numeric(36, 18) NOT NULL,
	"reason" varchar(50) NOT NULL,
	"ref_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "balances" ADD CONSTRAINT "balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_buy_order_id_orders_id_fk" FOREIGN KEY ("buy_order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_sell_order_id_orders_id_fk" FOREIGN KEY ("sell_order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_locks" ADD CONSTRAINT "wallet_locks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "balances_user_asset_idx" ON "balances" USING btree ("user_id","asset");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_symbol_status_idx" ON "orders" USING btree ("symbol","status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "trades_symbol_idx" ON "trades" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "trades_buyer_id_idx" ON "trades" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "trades_seller_id_idx" ON "trades" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "trades_executed_at_idx" ON "trades" USING btree ("executed_at");--> statement-breakpoint
CREATE INDEX "trades_buy_order_id_idx" ON "trades" USING btree ("buy_order_id");--> statement-breakpoint
CREATE INDEX "trades_sell_order_id_idx" ON "trades" USING btree ("sell_order_id");--> statement-breakpoint
CREATE INDEX "wallet_locks_user_asset_idx" ON "wallet_locks" USING btree ("user_id","asset");--> statement-breakpoint
CREATE INDEX "wallet_locks_ref_id_idx" ON "wallet_locks" USING btree ("ref_id");