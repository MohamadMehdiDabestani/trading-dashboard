import {
  pgTable,
  uuid,
  numeric,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const balances = pgTable(
  "balances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    asset: text("asset").notNull(), // e.g. "BTC", "USDT", "ETH"
    available: numeric("available", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    locked: numeric("locked", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("balances_user_asset_idx").on(t.userId, t.asset)]
);

export type Balance = typeof balances.$inferSelect;
export type NewBalance = typeof balances.$inferInsert;
