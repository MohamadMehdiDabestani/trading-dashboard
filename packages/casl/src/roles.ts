export const Role = {
  Admin: "admin",
  Accounting: "accounting",
  OrderManager: "order_manager",
  MarketManager: "market_manager",
  User: "user",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
