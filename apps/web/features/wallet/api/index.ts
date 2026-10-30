import { apiFetch } from "@/lib/apiClient";
import type {
  MarketPricesReply,
  WalletAssetReply,
  WalletDepositDto,
  WalletGetReply,
  WalletHistoryFilters,
  WalletTrendRange,
  WalletTrendReply,
  WalletWithdrawDto,
} from "@repo/types";

export const walletApi = {
  getBalance: () => apiFetch<WalletGetReply[]>("wallet/get"),

  getAsset: (
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
    return apiFetch<WalletAssetReply>(
      `wallet/asset/${encodeURIComponent(asset)}?${qs.toString()}`,
    );
  },

  getTrend: (asset: string, range: WalletTrendRange) =>
    apiFetch<WalletTrendReply>(
      `wallet/asset/${encodeURIComponent(asset)}/trend?range=${range}`,
    ),

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
  getPrices: () => apiFetch<MarketPricesReply>("market/prices"),
};
