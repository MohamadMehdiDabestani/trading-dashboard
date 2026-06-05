// packages/db/src/schema/auth.ts
import { pgTable, uuid, text, timestamp,  index } from "drizzle-orm/pg-core";
import { users } from "./users";



export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("rt_user_idx").on(t.userId),
]);

export type RefreshToken = typeof refreshTokens.$inferSelect;
