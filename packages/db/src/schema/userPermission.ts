import {
  timestamp,
  uniqueIndex,
  index,
  uuid,
  pgTable,
  text,
} from "drizzle-orm/pg-core";
import { permissions } from "./permission";
import { permissionEffectEnum, users } from "./users";

export const userPermissions = pgTable(
  "user_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),

    effect: permissionEffectEnum("effect").notNull(),

    reason: text("reason"),

    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),

    expiresAt: timestamp("expires_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_permissions_unique").on(table.userId, table.permissionId),
    index("user_permissions_user_idx").on(table.userId),
    index("user_permissions_permission_idx").on(table.permissionId),
    index("user_permissions_effect_idx").on(table.effect),
  ],
);
