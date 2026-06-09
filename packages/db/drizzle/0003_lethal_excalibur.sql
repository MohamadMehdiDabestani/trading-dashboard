ALTER TABLE "balances" ALTER COLUMN "available" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "available" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "locked" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "locked" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "ledger_entries" ALTER COLUMN "amount" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "ledger_entries" ALTER COLUMN "balance_before" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "ledger_entries" ALTER COLUMN "balance_after" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "wallet_locks" ALTER COLUMN "amount" SET DATA TYPE numeric;