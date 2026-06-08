
import {
  pgTable,
  uuid,
  numeric,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const orderSideEnum = pgEnum("order_side", ["buy", "sell"]);
export const orderTypeEnum = pgEnum("order_type", ["limit", "market"]);
export const orderStatusEnum = pgEnum("order_status", [
  "open",
  "partial",
  "filled",
  "cancelled",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    symbol: text("symbol").notNull(), // e.g. "BTCUSDT"
    side: orderSideEnum("side").notNull(),
    type: orderTypeEnum("type").notNull(),
    price: numeric("price", { precision: 36, scale: 18 }), // null for market orders
    quantity: numeric("quantity", { precision: 36, scale: 18 }).notNull(),
    filledQuantity: numeric("filled_quantity", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    status: orderStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("orders_user_id_idx").on(t.userId),
    index("orders_symbol_status_idx").on(t.symbol, t.status),
    index("orders_created_at_idx").on(t.createdAt),
  ]
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
