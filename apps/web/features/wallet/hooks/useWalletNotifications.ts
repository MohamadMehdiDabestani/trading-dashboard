"use client";

import { useQuery } from "@tanstack/react-query";
import { walletQueries } from "../api/wallet.queries";

export function useWalletNotifications(limit = 20) {
  return useQuery(walletQueries.notifications(limit));
}
