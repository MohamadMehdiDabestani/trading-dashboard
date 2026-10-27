"use client";

import {
  ColumnDef,
  OnChangeFn,
  SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;

  /** Server-side sorting (optional). If omitted the table behaves as before. */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  /** first load (no data yet) => skeleton rows */
  isLoading?: boolean;
  /** refetching while old rows are shown => dim the table */
  isFetching?: boolean;
  skeletonRows?: number;
  emptyText?: string;
  /** per-row extra classes, e.g. dim finished rows */
  getRowClassName?: (row: TData) => string | undefined;
  /** tailwind max-height class, e.g. "max-h-[30rem]" => table scrolls, header stays sticky */
  scrollClassName?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  sorting,
  onSortingChange,
  isLoading = false,
  isFetching = false,
  skeletonRows = 5,
  emptyText = "داده‌ای وجود ندارد",
  getRowClassName,
  scrollClassName,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting: sorting ?? [] },
    onSortingChange,
    manualSorting: Boolean(onSortingChange),
    enableMultiSort: false,
  });

  const rows = table.getRowModel().rows;

  return (
    // shadcn <Table> has its own overflow-auto wrapper which breaks `sticky`;
    // [&>div]:overflow-visible lets this outer div be the only scroll container
    <div className={cn("overflow-auto [&>div]:overflow-visible", scrollClassName)}>
    <Table
      className={cn(
        "transition-opacity",
        isFetching && !isLoading && "opacity-60",
        className,
      )}
    >
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const sorted = header.column.getIsSorted();
              return (
                <TableHead
                  key={header.id}
                  className="sticky top-0 z-10 bg-muted text-center"
                  aria-sort={
                    sorted === "asc"
                      ? "ascending"
                      : sorted === "desc"
                        ? "descending"
                        : undefined
                  }
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: skeletonRows }).map((_, i) => (
            <TableRow key={`sk-${i}`}>
              {columns.map((_, j) => (
                <TableCell key={j}>
                  <div className="mx-auto h-4 w-16 animate-pulse rounded bg-muted" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : rows.length ? (
          rows.map((row) => (
            <TableRow key={row.id} className={getRowClassName?.(row.original)}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="text-center">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              {emptyText}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
    </div>
  );
}