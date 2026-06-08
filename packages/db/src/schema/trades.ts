import {
  pgTable,
  uuid,
  numeric,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { users } from "./users";

export const trades = pgTable(
  "trades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    symbol: text("symbol").notNull(),
    buyOrderId: uuid("buy_order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    sellOrderId: uuid("sell_order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    price: numeric("price", { precision: 36, scale: 18 }).notNull(),
    quantity: numeric("quantity", { precision: 36, scale: 18 }).notNull(),
    // quoteQuantity = price * quantity (stored for convenience)
    quoteQuantity: numeric("quote_quantity", {
      precision: 36,
      scale: 18,
    }).notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("trades_symbol_idx").on(t.symbol),
    index("trades_buyer_id_idx").on(t.buyerId),
    index("trades_seller_id_idx").on(t.sellerId),
    index("trades_executed_at_idx").on(t.executedAt),
    index("trades_buy_order_id_idx").on(t.buyOrderId),
    index("trades_sell_order_id_idx").on(t.sellOrderId),
  ]
);

export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;
