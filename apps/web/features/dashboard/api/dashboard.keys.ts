import { tradeKeys } from "@/features/order/api/trade.keys";
import { walletKeys } from "@/features/wallet/api/wallet.keys";
import { marketsKeys } from "@/features/markets/api/markets.keys";
import type {
  DashboardOrdersKind,
  DashboardOrdersParams,
} from "./dashboard.types";

export const dashboardKeys = {
  stats: () => [...tradeKeys.all, "stats"] as const,
  balances: () => walletKeys.balance(),
  marketPrices: marketsKeys.prices,
  orders: (kind: DashboardOrdersKind, p: DashboardOrdersParams) =>
    [...tradeKeys.all, "dashboard", kind, p] as const,
};
