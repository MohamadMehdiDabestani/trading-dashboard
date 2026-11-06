import type { SortingState } from "@tanstack/react-table";
import {
  ValueOrderSortField,
  ValueOrderStatus,
  type OrderSortField,
  type OrderStatus,
  type SortDirection,
} from "@repo/types";

export type StatusFilter = OrderStatus | "all";

export const PAGE_SIZES = [10, 20, 50];
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_SORT = { id: "createdAt", desc: true };

export function parseSort(raw?: string | null): SortingState {
  if (raw) {
    const [id = "", dir] = raw.split(".");
    if (
      ValueOrderSortField.includes(id as OrderSortField) &&
      (dir === "asc" || dir === "desc")
    ) {
      return [{ id, desc: dir === "desc" }];
    }
  }
  return [DEFAULT_SORT];
}

export type RawSearchParams =
  | { [key: string]: string | string[] | undefined }
  | URLSearchParams
  | { get(key: string): string | null };

export type ParsedTradeTableParams = {
  status: StatusFilter;
  page: number;
  pageSize: number;
  sorting: SortingState;
  sortBy?: OrderSortField;
  sortOrder?: SortDirection;
};

/**
 * Pure parser for trade table query parameters.
 * Works symmetrically on the server (from Next.js searchParams page prop)
 * and on the client (from useSearchParams).
 * This module has NO "use client" directive so it can be called safely in Server Components.
 */
export function parseTradeTableParams(
  sp?: RawSearchParams,
): ParsedTradeTableParams {
  const get = (key: string): string | null => {
    if (!sp) return null;
    if ("get" in sp && typeof sp.get === "function") {
      return sp.get(key);
    }
    const val = (sp as Record<string, string | string[] | undefined>)[key];
    if (Array.isArray(val)) return val[0] ?? null;
    return val ?? null;
  };

  const statusRaw = get("status");
  const status: StatusFilter = ValueOrderStatus.includes(
    statusRaw as OrderStatus,
  )
    ? (statusRaw as OrderStatus)
    : "all";

  const page = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);

  const sizeRaw = Number(get("pageSize"));
  const pageSize = PAGE_SIZES.includes(sizeRaw) ? sizeRaw : DEFAULT_PAGE_SIZE;

  const sortRaw = get("sort");
  const sorting = parseSort(sortRaw);
  const sort = sorting[0];

  return {
    status,
    page,
    pageSize,
    sorting,
    sortBy: sort ? (sort.id as OrderSortField) : undefined,
    sortOrder: sort ? (sort.desc ? "desc" : "asc") : undefined,
  };
}
