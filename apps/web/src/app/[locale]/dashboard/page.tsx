import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/getQueryClient";
import { prefetchDashboardPage } from "@/features/dashboard/api/dashboard.server";
import { DashboardView } from "@/features/dashboard/components/dashboardView";

export default async function DashboardPage() {
  const qc = getQueryClient();
  await prefetchDashboardPage(qc);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <DashboardView />
    </HydrationBoundary>
  );
}
