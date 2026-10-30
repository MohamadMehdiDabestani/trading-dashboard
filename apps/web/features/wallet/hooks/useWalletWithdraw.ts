"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { walletKeys } from "../api/wallet.keys";
import { walletApi } from "../api";

export function useWalletWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: walletApi.withdraw,
    onSuccess: () => qc.invalidateQueries({ queryKey: walletKeys.all }),
  });
}