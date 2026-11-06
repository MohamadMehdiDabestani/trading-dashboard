import { apiFetch } from "@/lib/apiClient";
import type {
  MarketPricesReply,
  WalletAssetReply,
  WalletDepositDto,
  WalletGetReply,
  WalletHistoryFilters,
  WalletNotificationItem,
  WalletTrendRange,
  WalletTrendReply,
  WalletWithdrawDto,
} from "@repo/types";

/** Endpoint paths shared by the browser client and the server prefetch. */
export const walletPaths = {
  balance: () => "wallet/get",

  notifications: (limit = 20) => `wallet/notifications?limit=${limit}`,

  asset: (
    asset: string,
    page = 1,
    pageSize = 10,
    filters: WalletHistoryFilters = {},
  ) => {
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (filters.period) qs.set("period", filters.period);
    filters.types?.forEach((t) => qs.append("type", t));
    return `wallet/asset/${encodeURIComponent(asset)}?${qs.toString()}`;
  },

  trend: (asset: string, range: WalletTrendRange) =>
    `wallet/asset/${encodeURIComponent(asset)}/trend?range=${range}`,

  marketPrices: () => "market/prices",
};

export const walletApi = {
  getBalance: () => apiFetch<WalletGetReply[]>(walletPaths.balance()),

  getNotifications: (limit = 20) =>
    apiFetch<WalletNotificationItem[]>(walletPaths.notifications(limit)),

  getAsset: (
    asset: string,
    page = 1,
    pageSize = 10,
    filters: WalletHistoryFilters = {},
  ) =>
    apiFetch<WalletAssetReply>(
      walletPaths.asset(asset, page, pageSize, filters),
    ),

  getTrend: (asset: string, range: WalletTrendRange) =>
    apiFetch<WalletTrendReply>(walletPaths.trend(asset, range)),

  deposit: (body: WalletDepositDto) =>
    apiFetch<void>("wallet/deposit", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  withdraw: (body: WalletWithdrawDto) =>
    apiFetch<void>("/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const marketApi = {
  getPrices: () => apiFetch<MarketPricesReply>(walletPaths.marketPrices()),
};
