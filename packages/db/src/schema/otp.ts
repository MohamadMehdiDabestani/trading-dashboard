// packages/db/src/schema/auth.ts
import { pgTable, uuid, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";

export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("otp_phone_idx").on(t.phone),
]);

export type OtpCode = typeof otpCodes.$inferSelect;
