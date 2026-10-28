"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateOrderDTO, CancelOrderDTO } from "@repo/types";
import { tradeKeys } from "../api/trade.keys";
import { tradeApi } from "../api";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrderDTO) => tradeApi.createOrder(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tradeKeys.all });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  const t = useTranslations("trade");

  return useMutation({
    mutationFn: (body: CancelOrderDTO) => tradeApi.cancelOrder(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tradeKeys.all });
      toast.success(t("successCloseTrade"));
    },
  });
}
