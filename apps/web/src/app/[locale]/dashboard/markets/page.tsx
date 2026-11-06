import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/getQueryClient";
import { prefetchMarketsPage } from "@/features/markets/api/markets.server";
import { MarketsView } from "@/features/markets/components/marketsView";

export default async function MarketsPage() {
  const qc = getQueryClient();
  await prefetchMarketsPage(qc);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <MarketsView />
    </HydrationBoundary>
  );
}
