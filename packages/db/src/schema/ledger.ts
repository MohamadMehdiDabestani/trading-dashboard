import { varchar } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { pgTable, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { jsonb } from "drizzle-orm/pg-core";

export const ledgerEntryType = pgEnum("ledger_entry_type", [
  "deposit",
  "withdraw",
  "trade_buy",
  "trade_sell",
  "fee",
  "lock",
  "unlock",
  "transfer_in",
  "transfer_out",
]);

export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  asset: varchar("asset", { length: 20 }).notNull(),
  type: ledgerEntryType("type").notNull(),
  amount: numeric("amount", { precision: 36, scale: 18 }).notNull(), // مثبت یا منفی
  balanceBefore: numeric("balance_before", {
    precision: 36,
    scale: 18,
  }).notNull(),
  balanceAfter: numeric("balance_after", {
    precision: 36,
    scale: 18,
  }).notNull(),
  refId: uuid("ref_id"), // orderId / withdrawId / ...
  refType: varchar("ref_type", { length: 50 }), // "order" | "withdrawal" | ...
  meta: jsonb("meta"), // اطلاعات اضافه
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
