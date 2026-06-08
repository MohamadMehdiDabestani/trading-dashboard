import { varchar } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { numeric } from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { users } from "./users";
import { index } from "drizzle-orm/pg-core";

export const walletLocks = pgTable(
  "wallet_locks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    asset: varchar("asset", { length: 20 }).notNull(),
    amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
    reason: varchar("reason", { length: 50 }).notNull(), // "open_order"
    refId: uuid("ref_id").notNull(), // orderId
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
  },
  (t) => [
    index("wallet_locks_user_asset_idx").on(t.userId, t.asset),
    index("wallet_locks_ref_id_idx").on(t.refId),
  ],
);
