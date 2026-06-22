'use client'
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ApiError } from "@/lib/apiError";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

function useGlobalErrorHandler() {
  const t = useTranslations("errors");
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleError = (error: unknown) => {
      if (!(error instanceof ApiError)) return;
      if (error.code === "VALIDATION_ERROR") return;
      
      const message = t(error.code as any, { defaultValue: error.code });
      toast.error(message);
    };

    const queryCache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();

    queryCache.config.onError = handleError;
    mutationCache.config.onError = handleError;

    return () => {
      queryCache.config.onError = undefined;
      mutationCache.config.onError = undefined;
    };
  }, [t, queryClient]);
}


export function GlobalErrorHandler() {
  useGlobalErrorHandler();
  return null;
}