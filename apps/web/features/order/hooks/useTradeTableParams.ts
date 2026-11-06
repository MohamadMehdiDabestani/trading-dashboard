"use client";

import { useCallback, useMemo } from "react";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import {
  ValueOrderSortField,
  ValueOrderStatus,
  type OrderSortField,
  type OrderStatus,
  type SortDirection,
} from "@repo/types";
import { usePathname, useRouter } from "@/lib/i18nNavigation";
import { useSearchParams } from "next/navigation";

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

export function useTradeTableParams(initial?: Partial<ParsedTradeTableParams>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const parsed = useMemo(
    () => parseTradeTableParams(searchParams),
    [searchParams],
  );

  const status = parsed.status ?? initial?.status ?? "all";
  const page = parsed.page ?? initial?.page ?? 1;
  const pageSize = parsed.pageSize ?? initial?.pageSize ?? DEFAULT_PAGE_SIZE;
  const sorting = parsed.sorting ?? initial?.sorting ?? [DEFAULT_SORT];

  // one router.replace per user action (several keys can change together)
  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const setPage = useCallback(
    (p: number) => update({ page: p > 1 ? String(p) : null }),
    [update],
  );

  const setPageSize = useCallback(
    (s: number) =>
      update({
        pageSize: s === DEFAULT_PAGE_SIZE ? null : String(s),
        page: null,
      }),
    [update],
  );

  const setStatus = useCallback(
    (s: StatusFilter) =>
      update({ status: s === "all" ? null : s, page: null }),
    [update],
  );

  const setSorting: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      // cleared or equal to default => remove from URL (backend default = createdAt desc)
      if (!first || (first.id === DEFAULT_SORT.id && first.desc)) {
        update({ sort: null, page: null });
        return;
      }
      update({
        sort: `${first.id}.${first.desc ? "desc" : "asc"}`,
        page: null,
      });
    },
    [sorting, update],
  );

  return {
    status,
    page,
    pageSize,
    sorting,
    setStatus,
    setPage,
    setPageSize,
    setSorting,
  };
}
