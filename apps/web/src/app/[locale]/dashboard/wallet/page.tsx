import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/getQueryClient";
import { prefetchWalletPage } from "@/features/wallet/api/wallet.server";
import { WalletView } from "@/features/wallet/components/walletView";

export default async function WalletPage() {
  const qc = getQueryClient();
  await prefetchWalletPage(qc);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <WalletView />
    </HydrationBoundary>
  );
}
