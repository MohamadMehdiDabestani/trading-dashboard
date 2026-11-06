import { queryOptions } from "@tanstack/react-query";
import type { LoginHistoryReply, MeReply } from "@repo/types";
import { apiFetch } from "@/lib/apiClient";
import { authKeys } from "./auth.keys";
import { authPaths } from "./auth.paths";

export const authQueries = {
  me: () =>
    queryOptions({
      queryKey: authKeys.me(),
      queryFn: () => apiFetch<MeReply>(authPaths.me()),
      staleTime: 60_000,
    }),

  loginHistory: () =>
    queryOptions({
      queryKey: authKeys.history(),
      queryFn: () => apiFetch<LoginHistoryReply>(authPaths.loginHistory()),
      staleTime: 60_000,
    }),
};
