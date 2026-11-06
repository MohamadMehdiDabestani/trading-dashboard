import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import type { LoginHistoryReply } from "@repo/types";
import { serverFetch } from "@/lib/serverFetch";
import { authPaths } from "@/features/auth/api/auth.paths";
import { authQueries } from "@/features/auth/api/auth.queries";

/**
 * Prefetches login history and security data for SSR hydration on the account page.
 */
export function prefetchAccountPage(qc: QueryClient) {
  return qc.prefetchQuery({
    ...authQueries.loginHistory(),
    queryFn: () => serverFetch<LoginHistoryReply>(authPaths.loginHistory()),
  });
}
