"use client";

import { useQuery } from "@tanstack/react-query";
import { authApi } from "../features/auth/api/auth.api";
import { authKeys } from "../features/auth/api/auth.keys";

export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    staleTime: 30_000,
    retry: false,
  });
}