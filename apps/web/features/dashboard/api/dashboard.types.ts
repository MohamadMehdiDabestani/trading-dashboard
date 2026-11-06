import type { OrderSortField } from "@repo/types";

export type DashboardOrdersKind = "open" | "history";

export type DashboardOrdersParams = {
  page: number;
  pageSize: number;
  sortBy?: OrderSortField | string;
  sortOrder?: "asc" | "desc";
};

// JSON representation of Big -> string
export type WalletBalance = {
  id: string;
  asset: string;
  available: string;
  locked: string;
};
