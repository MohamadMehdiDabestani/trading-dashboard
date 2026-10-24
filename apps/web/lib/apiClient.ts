import type { APIResult } from "@repo/types";
import { ApiError } from "./apiError";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

let refreshPromise: Promise<void> | null = null;

async function doRefresh(): Promise<void> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  // 401 = refresh token باطل → logout اجباری
  if (res.status === 401) throw new ApiError("SESSION_EXPIRED");
  // 429/5xx = موقتی → کاربر را logout نکن
  if (!res.ok) throw new ApiError("INTERNAL_SERVER_ERROR");
}

function refreshOnce(): Promise<void> {
  refreshPromise ??= doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}/${path.replace(/^\/+/, "")}`;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  opts: { retryOn401?: boolean } = {},
): Promise<T> {
  const { retryOn401 = true } = opts;

  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retryOn401) {
    await refreshOnce(); // خطای غیر از SESSION_EXPIRED propagate می‌شود
    return apiFetch<T>(path, init, { retryOn401: false });
  }

  if (response.status === 204) return undefined as T;

  let body: APIResult<T>;
  try {
    body = await response.json();
  } catch {
    throw new ApiError("INTERNAL_SERVER_ERROR");
  }

  if (!body.success) {
    throw new ApiError(body.error.code, body.error.fields, body.error.params);
  }
  return body.data;
}