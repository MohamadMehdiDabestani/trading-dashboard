import { DataTable } from "@/components/data-table";
import { DataTablePagination } from "@/components/data-table-pagination";
import { OrderCards, OrderSortBar } from "@/features/order/components/orderCards";
import { useMemo, useState } from "react";
import { DashboardOrdersKind, useDashboardOrders } from "../hooks/useDashboard";
import { OrderSortField } from "@repo/types";
import { useCancelOrder } from "@/features/order/hooks/useTradeMutations";
import { buildOrderColumns, Order } from "@/features/order/utils/columns";
import { OnChangeFn, SortingState } from "@tanstack/react-table";

export const OrdersPanel = ({ kind }: { kind: DashboardOrdersKind }) =>{
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSortingState] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const sort = sorting[0];
  const q = useDashboardOrders(kind, {
    page,
    pageSize,
    sortBy: sort ? (sort.id as OrderSortField) : undefined,
    sortOrder: sort ? (sort.desc ? "desc" : "asc") : undefined,
  });

  const cancel = useCancelOrder();
  const { mutate: cancelMutate } = cancel;
  const cancellingId = cancel.isPending ? cancel.variables?.orderId : undefined;

  const columns = useMemo(
    () =>
      buildOrderColumns(
        (o: Order) => cancelMutate({ symbol: o.symbol, orderId: o.id }),
        cancellingId,
      ),
    [cancelMutate, cancellingId],
  );

  const setSorting: OnChangeFn<SortingState> = (u) => {
    setSortingState(u);
    setPage(1);
  };

  const items = q.data?.items ?? [];
  const total = q.data?.total ?? 0;
  const emptyText =
    kind === "open" ? "سفارش بازی وجود ندارد" : "هنوز معامله‌ای ثبت نشده است";

  return (
    <>
      {/* موبایل: کارت */}
      <div className="md:hidden">
        <OrderSortBar sorting={sorting} onChange={setSorting} />
        <OrderCards
          orders={items}
          isLoading={q.isLoading}
          isFetching={q.isFetching}
          cancellingId={cancellingId}
          onCancel={(o) => cancelMutate({ symbol: o.symbol, orderId: o.id })}
          emptyText={emptyText}
        />
      </div>

      {/* دسکتاپ: جدول */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={items}
          sorting={sorting}
          onSortingChange={setSorting}
          isLoading={q.isLoading}
          isFetching={q.isFetching}
          skeletonRows={Math.min(pageSize, 5)}
          scrollClassName="max-h-[30rem]"
          getRowClassName={(o: Order) =>
            o.status === "cancelled" ? "opacity-60" : undefined
          }
          emptyText={emptyText}
        />
      </div>

      {total > 0 && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPage={q.data?.totalPage ?? 0}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      )}
    </>
  );
}