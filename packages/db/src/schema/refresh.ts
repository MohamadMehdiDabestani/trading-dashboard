import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    replacedAt: timestamp("replaced_at", { withTimezone: true }),
  },
  (t) => [
    index("rt_user_idx").on(t.userId),
    index("refresh_tokens_replaced_at_idx").on(t.replacedAt),
    index("refresh_tokens_expires_at_idx").on(t.expiresAt),
  ],
);

export type RefreshToken = typeof refreshTokens.$inferSelect;
