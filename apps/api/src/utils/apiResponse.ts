import type { APIResult, FieldError } from "@repo/types";

export function ok<T>(
  data: T,
  opts?: {
    message?: APIResult<T> & { success: true } extends { message?: infer M }
      ? M
      : never;
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
  code: string,
  messageKey: string,
  params?: Record<string, string | number>,
  meta?: { requestId?: string },
  fields?: Record<string, FieldError>,
): APIResult<never> {
  return {
    success: false,
    error: {
      code,
      message: { key: messageKey, params },
      fields,
    },
    meta: { timestamp: Date.now(), ...meta },
  };
}
