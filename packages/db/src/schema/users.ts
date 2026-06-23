import { integer } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
export const roleEnum = pgEnum("role", [
  "Admin",
  "Accounting",
  "OrderManager",
  "MarketManager",
  "User",
]);
export const permissionEffectEnum = pgEnum("permission_effect", [
  "allow",
  "deny",
]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "suspended",
  "disabled",
  "pending",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull().unique(),
  userName: text("user_name"),
  email: text("email").unique(),

  role: roleEnum("role").notNull().default("User"),
  permissionsVersion: integer("permissions_version").notNull().default(1),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
