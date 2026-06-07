export const TOKEN_ERROR_CODES = [
  "INVALID_REFRESH",
] as const;

export type TokenErrorCode = (typeof TOKEN_ERROR_CODES)[number];