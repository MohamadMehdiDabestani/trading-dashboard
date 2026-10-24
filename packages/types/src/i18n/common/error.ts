export const COMMON_ERROR_CODES = [
  "INTERNAL_SERVER_ERROR",
  "FORBIDDEN",
  "NOT_FOUND",
  "RATE_LIMIT",
  "BAD_REQUEST"
] as const;

export type CommonErrorCode = (typeof COMMON_ERROR_CODES)[number];
