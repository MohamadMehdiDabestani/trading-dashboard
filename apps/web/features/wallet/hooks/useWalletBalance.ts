"use client";

import { useQuery } from "@tanstack/react-query";
import { walletQueries } from "../api/wallet.queries";

export function useWalletBalance() {
  return useQuery(walletQueries.balance());
}
