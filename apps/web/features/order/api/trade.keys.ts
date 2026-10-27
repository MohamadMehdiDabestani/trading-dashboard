import type { OrderStatus, OrderSortField, SortDirection } from "@repo/types";

export type RecentTradesFilters = {
  symbol: string;
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
  sortBy?: OrderSortField;
  sortOrder?: SortDirection;
};

export const tradeKeys = {
  all: ["trade"] as const,
  recent: (filters: RecentTradesFilters) =>
    [...tradeKeys.all, "recent", filters] as const,
  openPositions: () => [...tradeKeys.all, "open-positions"] as const,
};