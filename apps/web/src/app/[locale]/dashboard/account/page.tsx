import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/getQueryClient";
import { prefetchAccountPage } from "@/features/account/api/account.server";
import { AccountView } from "@/features/account/components/accountView";

export default async function AccountPage() {
  const qc = getQueryClient();
  await prefetchAccountPage(qc);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <AccountView />
    </HydrationBoundary>
  );
}
