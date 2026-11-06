import type {
  DashboardOrdersKind,
  DashboardOrdersParams,
} from "./dashboard.types";

export const dashboardPaths = {
  stats: () => "trade/stats" as const,
  balances: () => "wallet/get" as const,
  marketPrices: () => "market/prices" as const,
  orders: (kind: DashboardOrdersKind, p: DashboardOrdersParams) => {
    const statuses =
      kind === "open" ? ["open", "partial"] : ["filled", "cancelled"];
    const qs = new URLSearchParams();
    statuses.forEach((s) => qs.append("status", s));
    qs.set("page", String(p.page));
    qs.set("pageSize", String(p.pageSize));
    if (p.sortBy) qs.set("sortBy", p.sortBy);
    if (p.sortOrder) qs.set("sortOrder", p.sortOrder);
    return `trade?${qs.toString()}` as const;
  },
};
