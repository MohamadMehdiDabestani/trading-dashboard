import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from "@casl/ability";

import type { Permission } from "./permissions";
import { Permission as P } from "./permissions";
import { Role } from "./roles";
import { Role as Roles } from "./roles";
export type AppAction =
  | "manage"
  | "read"
  | "create"
  | "update"
  | "approve"
  | "reject"
  | "disable"
  | "adjust_balance"
  | "export"
  | "revoke"
  | "change_role"
  | "manage_permissions";

export type AppSubject =
  | "all"
  | "Accounting"
  | "Transaction"
  | "Wallet"
  | "Report"
  | "Order"
  | "Market"
  | "User"
  | "Session"
  | "AuditLog";

export type AppAbility = MongoAbility<[AppAction, AppSubject]>;

export type AbilityUser = {
  id: string;
  role: Role;
  permissions: Permission[];
};

export function defineAbilityFor(user: AbilityUser): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (user.role === Roles.Admin) {
    can("manage", "all");
    return build();
  }

  const permissions = new Set(user.permissions);

  if (permissions.has(P.AccountingRead)) {
    can("read", "Accounting");
  }

  if (permissions.has(P.AccountingManage)) {
    can("manage", "Accounting");
  }

  if (permissions.has(P.TransactionRead)) {
    can("read", "Transaction");
  }

  if (permissions.has(P.TransactionUpdate)) {
    can("update", "Transaction");
  }

  if (permissions.has(P.TransactionApprove)) {
    can("approve", "Transaction");
  }

  if (permissions.has(P.TransactionReject)) {
    can("reject", "Transaction");
  }

  if (permissions.has(P.WalletRead)) {
    can("read", "Wallet");
  }

  if (permissions.has(P.WalletUpdate)) {
    can("update", "Wallet");
  }

  if (permissions.has(P.WalletAdjustBalance)) {
    can("adjust_balance", "Wallet");
  }

  if (permissions.has(P.ReportRead)) {
    can("read", "Report");
  }

  if (permissions.has(P.ReportExport)) {
    can("export", "Report");
  }

  if (permissions.has(P.OrderRead)) {
    can("read", "Order");
  }

  if (permissions.has(P.OrderUpdate)) {
    can("update", "Order");
  }

  if (permissions.has(P.OrderApprove)) {
    can("approve", "Order");
  }

  if (permissions.has(P.OrderReject)) {
    can("reject", "Order");
  }

  if (permissions.has(P.MarketRead)) {
    can("read", "Market");
  }

  if (permissions.has(P.MarketCreate)) {
    can("create", "Market");
  }

  if (permissions.has(P.MarketUpdate)) {
    can("update", "Market");
  }

  if (permissions.has(P.MarketDisable)) {
    can("disable", "Market");
  }

  if (permissions.has(P.UserRead)) {
    can("read", "User");
  }

  if (permissions.has(P.UserUpdate)) {
    can("update", "User");
  }

  if (permissions.has(P.UserChangeRole)) {
    can("change_role", "User");
  }

  if (permissions.has(P.UserManagePermissions)) {
    can("manage_permissions", "User");
  }

  return build();
}

export function canAccess(
  user: AbilityUser,
  action: AppAction,
  subject: AppSubject,
): boolean {
  return defineAbilityFor(user).can(action, subject);
}
