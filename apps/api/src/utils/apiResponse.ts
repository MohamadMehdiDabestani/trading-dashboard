import type { AllErrorCode,AllSuccessCodes, APIResult, FieldError } from "@repo/types";

export function ok<T>(
  data: T,
  opts?: {
    message?: { key: AllSuccessCodes; params?: Record<string, string | number> };
    meta?: { requestId?: string; timestamp?: number };
  },
): APIResult<T> {
  return {
    success: true,
    data,
    message: opts?.message,
    meta: { timestamp: Date.now(), ...opts?.meta },
  };
}

export function fail(
  code: AllErrorCode,
  params?: Record<string, string | number>,
  meta?: { requestId?: string },
  fields?: Record<string, FieldError>,
): APIResult<never> {
  return {
    success: false,
    error: {
      code,
      params,
      fields,
    },
    meta: { timestamp: Date.now(), ...meta },
  };
}
