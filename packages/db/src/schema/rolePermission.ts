import {
  timestamp,
  uniqueIndex,
  index,
  uuid,
  pgTable,
} from "drizzle-orm/pg-core";
import { roleEnum } from "./users";
import { permissions } from "./permission";

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    role: roleEnum("role").notNull(),

    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("role_permissions_unique").on(table.role, table.permissionId),
    index("role_permissions_role_idx").on(table.role),
    index("role_permissions_permission_idx").on(table.permissionId),
  ],
);
