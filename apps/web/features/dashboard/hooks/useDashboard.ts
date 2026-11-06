"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiClient";
import { walletKeys } from "@/features/wallet/api/wallet.keys";
import {
  dashboardQueries,
  type DashboardOrdersKind,
  type DashboardOrdersParams,
  type WalletBalance,
} from "../api";

export type { DashboardOrdersKind, DashboardOrdersParams, WalletBalance };

export function useWalletBalances() {
  return useQuery(dashboardQueries.balances());
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
  return useQuery(dashboardQueries.stats());
}

export function useDashboardOrders(
  kind: DashboardOrdersKind,
  p: DashboardOrdersParams,
) {
  return useQuery(dashboardQueries.orders(kind, p));
}
