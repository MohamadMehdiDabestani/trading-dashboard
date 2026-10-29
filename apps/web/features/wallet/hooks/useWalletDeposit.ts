"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { walletKeys } from "../api/wallet.keys";
import { walletApi } from "../api";

export function useWalletDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: walletApi.deposit,
    onSuccess: () => qc.invalidateQueries({ queryKey: walletKeys.all }),
  });
}