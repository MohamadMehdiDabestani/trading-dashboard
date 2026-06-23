import {
  varchar,
  timestamp,
  uniqueIndex,
  text,
  uuid,
  pgTable,
} from "drizzle-orm/pg-core";

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    key: varchar("key", { length: 100 }).notNull(),
    description: text("description"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("permissions_key_unique").on(table.key)],
);
