export const AUTH_ERROR_CODES = [
  "AUTH_FAIL",
  "UNAUTHORIZED",
  "USER_NOTFOUND"
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];
