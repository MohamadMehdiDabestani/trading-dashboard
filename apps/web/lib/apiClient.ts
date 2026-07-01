import { APIResult } from "@repo/types";
import { ApiError } from "./apiError";
import { getAccessToken, setAccessToken } from "./accessToken";

let refreshPromise: Promise<void> | null = null;


async function refreshToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Refresh failed");
        const data = await res.json().then(d => d.data)
        const accessToken = data.accessToken
        setAccessToken(accessToken)
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  retry = true,
): Promise<APIResult<T>> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const accessToken = getAccessToken();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${input}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    if (!retry) throw new ApiError("UNAUTHORIZED" as any);
    try {
      await refreshToken();
    } catch {
      throw new ApiError("SESSION_EXPIRED" as any);
    }
    return apiFetch(input, init, false);
  }

  const result: APIResult<T> = await response.json();

  if (!result.success) {
    throw new ApiError(
      result.error.code,
      result.error.fields,
      result.error.params,
    );
  }

  return result;
}
