"use client";

import { useCallback, useMemo } from "react";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { usePathname, useRouter } from "@/lib/i18nNavigation";
import { useSearchParams } from "next/navigation";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  PAGE_SIZES,
  parseSort,
  parseTradeTableParams,
  type ParsedTradeTableParams,
  type RawSearchParams,
  type StatusFilter,
} from "../utils/tradeTableParams";

export {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  PAGE_SIZES,
  parseSort,
  parseTradeTableParams,
  type ParsedTradeTableParams,
  type RawSearchParams,
  type StatusFilter,
};

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
