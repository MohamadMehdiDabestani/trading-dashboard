"use client";

import { useQuery } from "@tanstack/react-query";
import { walletKeys } from "../api/wallet.keys";
import { walletApi } from "../api";

export function useWalletBalance() {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: walletApi.getBalance,
    staleTime: 10_000,
  });
}