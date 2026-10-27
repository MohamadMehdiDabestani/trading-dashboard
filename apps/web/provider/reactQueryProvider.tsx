"use client";
import {
  MutationCache, QueryCache, QueryClient, QueryClientProvider,
} from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ApiError } from "@/lib/apiError";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("errors");
  const router = useRouter();
  const ctx = useRef({ t, router });
  ctx.current = { t, router };

  const [client] = useState(() => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          gcTime: 5 * 60_000,
          refetchOnWindowFocus: false,
          retry: (n, e) => !(e instanceof ApiError) && n < 1,
        },
        mutations: { retry: 0 },
      },
    });

    const handleError = (error: unknown) => {
      if (!(error instanceof ApiError)) return;

      if (error.code === "SESSION_EXPIRED") {
        qc.clear();
        ctx.current.router.replace("/auth");
        return;
      }
      if (error.fields && Object.keys(error.fields).length > 0) return;

      const { t } = ctx.current;
      console.log("error.code ===" , error.code);
      toast.error(
        t.has(error.code) ? t(error.code, error.params) : t("INTERNAL_SERVER_ERROR"),
      );
    };

    // attach after creation — no forward reference
    (qc.getQueryCache() as QueryCache).config.onError = handleError;
    (qc.getMutationCache() as MutationCache).config.onError = handleError;
    return qc;
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}