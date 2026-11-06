import "server-only";
import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

/** One QueryClient per server request (deduped by React `cache`). */
export const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60_000 },
      },
    }),
);
