"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { GripVertical } from "lucide-react";
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
} from "../hooks/useTradeTableParams";
import { OrderCards, OrderSortBar } from "./orderCards";
import { OpenOrderForm } from "@/features/order/components/openOrderForm";
import { OrderBook } from "@/features/order/components/orderBook";
import { TradingViewChart } from "@/features/order/components/tradingViewChart";
import { SYMBOLS, type SymbolValue } from "@/features/order/constants/symbols";
import { useRecentTrades } from "../hooks/useRecentTrades";
import { useCancelOrder } from "../hooks/useTradeMutations";
import { buildOrderColumns, Order } from "../utils/columns";
import { cn } from "@/lib/cn";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TradingFormProps = { initialSymbol: SymbolValue };

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "open", label: "باز" },
  { value: "partial", label: "نیمه‌پر" },
  { value: "filled", label: "انجام‌شده" },
  { value: "cancelled", label: "لغو شده" },
];

export const TradingForm = ({ initialSymbol }: TradingFormProps) => {
  const [order, setOrder] = useState(["form", "chart", "orderbook"]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
        cancellingId,
      ),
    [cancelMutate, cancellingId],
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
  } = useTradeTableParams();
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
  return (
    <div className="flex flex-col gap-4">
      <DraggableLayout
        items={order}
        onChange={setOrder}
        className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[384px_1fr_288px] gap-4"
      >
        {order.map((id) => (
          <SortablePanel
            key={id}
            id={id}
            className={cn(
              "min-h-0", // خیلی مهم برای جلوگیری از overflow
              id === "chart" && "md:col-span-2 xl:col-span-1",
              id === "form" && "md:col-span-1 xl:col-span-1",
              id === "orderbook" && "md:col-span-1 xl:col-span-1",
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
                        <p className="font-bold">باز کردن معامله</p>
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
                            <SelectValue placeholder="انتخاب سمبل" />
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
                    <Card className="h-full flex flex-col pt-3 ">
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
                        <p className="font-bold">دفتر چه سفاراشات</p>
                      </CardHeader>
                      <CardContent className="h-full px-0">
                        <OrderBook />
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
          <p className="font-bold">سفارش‌های اخیر</p>
          {recentTrades.isFetching && (
            <span className="text-[10px] text-muted-foreground">
              در حال به‌روزرسانی...
            </span>
          )}

          <div className="ms-auto flex items-center gap-1" role="tablist">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={status === f.value}
                onClick={() => setStatus(f.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors",
                  status === f.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {f.label}
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
              emptyText={
                status === "all"
                  ? "هنوز سفارشی ثبت نشده است"
                  : "سفارشی با این فیلتر پیدا نشد"
              }
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
              emptyText={
                status === "all"
                  ? "هنوز سفارشی ثبت نشده است"
                  : "سفارشی با این فیلتر پیدا نشد"
              }
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
