export const Permission = {
  AccountingRead: "accounting:read",
  AccountingManage: "accounting:manage",

  TransactionRead: "transaction:read",
  TransactionUpdate: "transaction:update",
  TransactionApprove: "transaction:approve",
  TransactionReject: "transaction:reject",

  WalletRead: "wallet:read",
  WalletUpdate: "wallet:update",
  WalletAdjustBalance: "wallet:adjust_balance",

  ReportRead: "report:read",
  ReportExport: "report:export",

  OrderRead: "order:read",
  OrderUpdate: "order:update",
  OrderApprove: "order:approve",
  OrderReject: "order:reject",

  MarketRead: "market:read",
  MarketCreate: "market:create",
  MarketUpdate: "market:update",
  MarketDisable: "market:disable",

  UserRead: "user:read",
  UserUpdate: "user:update",
  UserChangeRole: "user:change_role",
  UserManagePermissions: "user:manage_permissions",


} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
