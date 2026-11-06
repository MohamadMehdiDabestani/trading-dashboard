import "server-only";
import { cookies } from "next/headers";
import type { APIResult } from "@repo/types";
import { ApiError } from "./apiError";

const API_URL = (process.env.API_URL ?? "").replace(/\/+$/, "");

/**
 * Server-side counterpart of `apiFetch`: forwards the incoming request cookies
 * to the backend and unwraps the `APIResult` envelope.
 * Used only for prefetching on the server (errors are swallowed by
 * `prefetchQuery`, and the client will refetch).
 */
export async function serverFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const res = await fetch(`${API_URL}/${path.replace(/^\/+/, "")}`, {
    headers: {
      cookie: cookieStore.toString(),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;

  let body: APIResult<T>;
  try {
    body = await res.json();
  } catch {
    throw new ApiError("INTERNAL_SERVER_ERROR");
  }

  if (!body.success) {
    throw new ApiError(body.error.code, body.error.fields, body.error.params);
  }
  return body.data;
}
