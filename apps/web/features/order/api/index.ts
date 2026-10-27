import { apiFetch } from "@/lib/apiClient";
import type {
  CreateOrderDTO,
  CreateOrderReply,
  CancelOrderDTO,
  CancelOrderReply,
  GetRecentTradesReply,
} from "@repo/types";
import type { RecentTradesFilters } from "./trade.keys";

export type RecentTradesParams = RecentTradesFilters;

export const tradeApi = {
  createOrder: (body: CreateOrderDTO) =>
    apiFetch<CreateOrderReply>("trade/new", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  cancelOrder: (body: CancelOrderDTO) =>
    apiFetch<CancelOrderReply>("trade/cancel", {
      method: "DELETE",
      body: JSON.stringify(body),
    }),

  getRecentTrades: (params: RecentTradesParams) => {
    const qs = new URLSearchParams();
    qs.set("symbol", params.symbol);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    if (params.sortOrder) qs.set("sortOrder", params.sortOrder);

    return apiFetch<GetRecentTradesReply>(`trade?${qs.toString()}`);
  },
};