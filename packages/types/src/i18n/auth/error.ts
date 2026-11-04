export const AUTH_ERROR_CODES = [
  "AUTH_FAIL",
  "UNAUTHORIZED",
  "USER_NOTFOUND",
  "SESSION_EXPIRED", // JUST FOR CLIENT
  "INVALID_CREDENTIALS",
  "LOGIN_LOCKED",
  "USER_EXISTS",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];
