import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SYMBOLS } from "@repo/types";
import { getQueryClient } from "@/lib/getQueryClient";
import { prefetchTradePage } from "@/features/order/api/trade.server";
import { parseTradeTableParams } from "@/features/order/utils/tradeTableParams";
import { TradingForm } from "@/features/order/components/tradingForm";

type Props = {
  params: Promise<{ symbol: string; locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function TradePage({ params, searchParams }: Props) {
  const { symbol } = await params;
  const sp = await searchParams;

  const matched = SYMBOLS.find((s) => s.slug === symbol);
  if (!matched) {
    notFound();
  }

  // Parse URL search params (status, page, pageSize, sort) on the server for SSR
  const tableParams = parseTradeTableParams(sp);

  const qc = getQueryClient();
  await prefetchTradePage(qc, {
    symbol: matched.value,
    status: tableParams.status === "all" ? undefined : tableParams.status,
    page: tableParams.page,
    pageSize: tableParams.pageSize,
    sortBy: tableParams.sortBy,
    sortOrder: tableParams.sortOrder,
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <TradingForm initialSymbol={matched.value} initialParams={tableParams} />
    </HydrationBoundary>
  );
}
