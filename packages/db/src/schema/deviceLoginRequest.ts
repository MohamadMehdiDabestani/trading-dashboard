import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const deviceLinkStatusEnum = pgEnum("device_link_status", [
  "pending", // link created, nobody opened it yet
  "opened", // device 2 opened it, waiting for device 1 approval
  "approved", // device 1 approved, device 2 has not claimed tokens yet
  "denied", // rejected / invalidated
  "consumed", // device 2 claimed tokens (one-time)
]);

export const deviceLoginRequests = pgTable(
  "device_login_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    pollSecretHash: text("poll_secret_hash"),
    verificationCode: text("verification_code"),
    attempts: integer("attempts").notNull().default(0),
    status: deviceLinkStatusEnum("status").notNull().default("pending"),
    creatorIp: text("creator_ip"),
    creatorUserAgent: text("creator_user_agent"),
    openerIp: text("opener_ip"),
    openerUserAgent: text("opener_user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("device_login_requests_user_idx").on(t.userId, t.status)],
);

export type DeviceLoginRequest = typeof deviceLoginRequests.$inferSelect;