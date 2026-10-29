import { varchar } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { pgTable, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { jsonb } from "drizzle-orm/pg-core";
import { bigNumeric } from "../types/numric";
import { LEDGER_ENTRY_TYPES } from "@repo/types";

export const ledgerEntryType = pgEnum("ledger_entry_type", LEDGER_ENTRY_TYPES);

export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  asset: varchar("asset", { length: 20 }).notNull(),
  type: ledgerEntryType("type").notNull(),
  amount:        bigNumeric('amount').notNull(),
  balanceBefore: bigNumeric('balance_before').notNull(),
  balanceAfter:  bigNumeric('balance_after').notNull(),
  refId: uuid("ref_id"), // orderId / withdrawId / ...
  refType: varchar("ref_type", { length: 50 }), // "order" | "withdrawal" | ...
  meta: jsonb("meta"), // اطلاعات اضافه
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
