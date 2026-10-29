import { apiFetch } from "@/lib/apiClient";
import type { WalletGetReply } from "@repo/types";

export const walletApi = {
  getBalance: () => apiFetch<WalletGetReply[]>("wallet/get"),
};