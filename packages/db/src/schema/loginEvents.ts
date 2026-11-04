import { pgTable, pgEnum, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { deviceLoginRequests } from "./deviceLoginRequest";

export const loginMethodEnum = pgEnum("login_method", ["otp", "password", "qr"]);
export const loginStatusEnum = pgEnum("login_status", ["success", "failed"]);

export const loginEvents = pgTable(
  "login_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // null = failed attempt where the user could not be identified
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    phone: text("phone"),
    method: loginMethodEnum("method").notNull(),
    status: loginStatusEnum("status").notNull(),
    failureReason: text("failure_reason"), // internal only, never sent to client
    isNewUser: boolean("is_new_user").notNull().default(false),
    ip: text("ip"),
    userAgent: text("user_agent"),
    // only for method = qr: link back to the device-link request
    deviceLinkRequestId: uuid("device_link_request_id").references(
      () => deviceLoginRequests.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("login_events_user_idx").on(t.userId, t.createdAt),
    index("login_events_phone_idx").on(t.phone, t.createdAt),
  ],
);

export type LoginEvent = typeof loginEvents.$inferSelect;