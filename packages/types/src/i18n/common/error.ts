export const COMMON_ERROR_CODES = [
  "INTERNAL_SERVER_ERROR",
  "FORBIDDEN"
] as const;

export type CommonErrorCode = (typeof COMMON_ERROR_CODES)[number];
