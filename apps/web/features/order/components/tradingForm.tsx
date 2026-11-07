"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OrderSortField } from "@repo/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { DataTablePagination } from "@/components/data-table-pagination";
import {
  DraggableLayout,
  SortablePanel,
} from "@/components/ui/draggableLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTradeTableParams,
  type StatusFilter,
  type ParsedTradeTableParams,
} from "../hooks/useTradeTableParams";
import { OrderCards, OrderSortBar } from "./orderCards";
import { OpenOrderForm } from "@/features/order/components/openOrderForm";
import { OrderBook } from "@/features/order/components/orderBook";
import { TradingViewChart } from "@/features/order/components/tradingViewChart";
import { SYMBOLS, type SymbolValue } from "@repo/types";
import { useRecentTrades } from "../hooks/useRecentTrades";
import { useCancelOrder } from "../hooks/useTradeMutations";
import { buildOrderColumns, Order } from "../utils/columns";
import { cn } from "@/lib/cn";
import { usePathname, useRouter } from "@/lib/i18nNavigation";
import { useSearchParams } from "next/navigation";

type TradingFormProps = {
  initialSymbol: SymbolValue;
  initialParams?: ParsedTradeTableParams;
};

const STATUS_FILTER_IDS: StatusFilter[] = [
  "all",
  "open",
  "partial",
  "filled",
  "cancelled",
];

export const TradingForm = ({
  initialSymbol,
  initialParams,
}: TradingFormProps) => {
  const t = useTranslations("trade.tradingForm");
  const tStatus = useTranslations("trade.statusFilters");
  const [order, setOrder] = useState(["form", "chart", "orderbook"]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tColumns = useTranslations("trade.orderColumns");

  const [symbol, setSymbol] = useState<SymbolValue>(initialSymbol);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const cancelOrder = useCancelOrder();

  const cancellingId = cancelOrder.isPending
    ? cancelOrder.variables?.orderId
    : undefined;
  const { mutate: cancelMutate } = cancelOrder;

  const columns = useMemo(
    () =>
      buildOrderColumns(
        (o: Order) => cancelMutate({ symbol: o.symbol, orderId: o.id }),
        tColumns,
        cancellingId,
      ),
    [cancelMutate, cancellingId, tColumns],
  );
  const {
    status,
    page,
    pageSize,
    sorting,
    setStatus,
    setPage,
    setPageSize,
    setSorting,
  } = useTradeTableParams(initialParams);
  const sort = sorting[0];
  const recentTrades = useRecentTrades({
    symbol,
    status: status === "all" ? undefined : status,
    page,
    pageSize,
    sortBy: sort ? (sort.id as OrderSortField) : undefined,
    sortOrder: sort ? (sort.desc ? "desc" : "asc") : undefined,
  });
  const total = recentTrades.data?.total ?? 0;
  const totalPage = recentTrades.data?.totalPage ?? 0;
  const handleSymbolChange = (v: SymbolValue) => {
    const next = SYMBOLS.find((s) => s.value === v);
    if (!next) return;

    setSymbol(v);
    const nextPath = pathname.replace(/[^/]+\/?$/, next.slug);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${nextPath}?${qs}` : nextPath, { scroll: false });
  };
  useEffect(() => {
    if (totalPage > 0 && page > totalPage) setPage(totalPage);
  }, [totalPage, page]);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setSymbol(initialSymbol);
  }, [initialSymbol]);
  const activeSymbol = useMemo(
    () => SYMBOLS.find((s) => s.value === symbol) ?? SYMBOLS[0],
    [symbol],
  );

  const emptyText = status === "all" ? t("emptyAll") : t("emptyFiltered");

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full">
      <DraggableLayout
        items={order}
        onChange={setOrder}
        className="flex-1 grid grid-cols-12 xl:grid-cols-[384px_minmax(0,1fr)_288px] min-w-0 w-full gap-4"
      >
        {order.map((id) => (
          <SortablePanel
            key={id}
            id={id}
            className={cn(
              "min-h-0 min-w-0",
              id === "chart" &&
                "col-span-12 md:col-span-12 xl:col-span-1 order-3 xl:order-none",
              id === "form" &&
                "col-span-12 md:col-span-6 xl:col-span-1 order-1 xl:order-none",
              id === "orderbook" &&
                "col-span-12 md:col-span-6 xl:col-span-1 order-2 xl:order-none",
            )}
          >
            {({ attributes, listeners }) => {
              switch (id) {
                case "form":
                  return (
                    <Card className="h-full flex flex-col pt-3">
                      <CardHeader className="flex items-center flex-row">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-grab active:cursor-grabbing"
                          {...attributes}
                          {...listeners}
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>
                        <p className="font-bold">{t("formPanel")}</p>
                      </CardHeader>
                      <CardContent className="flex flex-col h-full">
                        <OpenOrderForm
                          key={activeSymbol.value}
                          symbol={activeSymbol.value}
                          baseAsset={activeSymbol.baseAsset}
                          quoteAsset={activeSymbol.quoteAsset}
                        />
                      </CardContent>
                    </Card>
                  );
                case "chart":
                  return (
                    <Card className="h-full flex flex-col pt-3">
                      <CardHeader className="flex items-center flex-row gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-grab active:cursor-grabbing"
                          {...attributes}
                          {...listeners}
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>

                        <Select
                          value={symbol}
                          onValueChange={(v) =>
                            handleSymbolChange(v as SymbolValue)
                          }
                        >
                          <SelectTrigger className="w-40" dir="ltr">
                            <SelectValue placeholder={t("symbolPlaceholder")} />
                          </SelectTrigger>
                          <SelectContent dir="ltr">
                            {SYMBOLS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardHeader>
                      <CardContent className="relative flex-1 min-h-[400px] min-w-0 px-2">
                        {mounted && (
                          <TradingViewChart
                            symbol={symbol}
                            theme={resolvedTheme === "light" ? "light" : "dark"}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );

                case "orderbook":
                  return (
                    <Card className="h-full flex flex-col pt-3">
                      <CardHeader className="flex items-center flex-row">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-grab active:cursor-grabbing"
                          {...attributes}
                          {...listeners}
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>
                        <p className="font-bold">{t("orderBookPanel")}</p>
                      </CardHeader>
                      <CardContent className="h-full px-0">
                        <OrderBook
                          symbol={activeSymbol.value}
                          baseAsset={activeSymbol.baseAsset}
                          quoteAsset={activeSymbol.quoteAsset}
                        />
                      </CardContent>
                    </Card>
                  );

                default:
                  return null;
              }
            }}
          </SortablePanel>
        ))}
      </DraggableLayout>

      <Card className="shrink-0 overflow-hidden flex flex-col">
        <CardHeader className="py-2 flex flex-wrap items-center gap-2 flex-row">
          <p className="font-bold">{t("recentOrders")}</p>
          {recentTrades.isFetching && (
            <span className="text-[10px] text-muted-foreground">
              {t("refreshing")}
            </span>
          )}

          <div className="ms-auto flex items-center gap-1" role="tablist">
            {STATUS_FILTER_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={status === id}
                onClick={() => setStatus(id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors",
                  status === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {tStatus(id)}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <div className="md:hidden">
            <OrderSortBar sorting={sorting} onChange={setSorting} />
            <OrderCards
              orders={recentTrades.data?.items ?? []}
              isLoading={recentTrades.isLoading}
              isFetching={recentTrades.isFetching}
              cancellingId={cancellingId}
              onCancel={(o) =>
                cancelMutate({ symbol: o.symbol, orderId: o.id })
              }
              emptyText={emptyText}
            />
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={recentTrades.data?.items ?? []}
              sorting={sorting}
              onSortingChange={setSorting}
              isLoading={recentTrades.isLoading}
              isFetching={recentTrades.isFetching}
              skeletonRows={Math.min(pageSize, 5)}
              scrollClassName="max-h-[30rem]"
              getRowClassName={(o: Order) =>
                o.status === "cancelled" ? "opacity-60" : undefined
              }
              emptyText={emptyText}
            />
          </div>
        </CardContent>

        {total > 0 && (
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPage={totalPage}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </Card>
    </div>
  );
};
