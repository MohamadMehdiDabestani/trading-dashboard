"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { GetRecentTradesReply, TradeStatsReply } from "@repo/types";
import { apiFetch } from "@/lib/apiClient";
import { walletKeys } from "@/features/wallet/api/wallet.keys";
import { tradeKeys } from "@/features/order/api/trade.keys";

// JSON شدن Big → string
export type WalletBalance = { id: string; asset: string; available: string; locked: string };

export function useWalletBalances() {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: () => apiFetch<WalletBalance[]>("wallet/get"),
    staleTime: 15_000,
  });
}

export function useDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: string) =>
      apiFetch<void>("wallet/deposit", {
        method: "POST",
        body: JSON.stringify({ asset: "USDT", amount }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.balance() });
      toast.success("واریز انجام شد");
    },
    onError: (e: any) => toast.error(e?.code ?? "خطا در واریز"),
  });
}

export function useTradeStats() {
  return useQuery({
    queryKey: [...tradeKeys.all, "stats"],
    queryFn: () => apiFetch<TradeStatsReply>("trade/stats"),
    staleTime: 60_000,
  });
}

export type DashboardOrdersKind = "open" | "history";

export function useDashboardOrders(
  kind: DashboardOrdersKind,
  p: { page: number; pageSize: number; sortBy?: string; sortOrder?: "asc" | "desc" },
) {
  const statuses = kind === "open" ? ["open", "partial"] : ["filled", "cancelled"];

  return useQuery({
    queryKey: [...tradeKeys.all, "dashboard", kind, p],
    queryFn: () => {
      const qs = new URLSearchParams();
      statuses.forEach((s) => qs.append("status", s));
      qs.set("page", String(p.page));
      qs.set("pageSize", String(p.pageSize));
      if (p.sortBy) qs.set("sortBy", p.sortBy);
      if (p.sortOrder) qs.set("sortOrder", p.sortOrder);
      return apiFetch<GetRecentTradesReply>(`trade?${qs}`);
    },
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchInterval: kind === "open" ? 10_000 : false,
  });
}