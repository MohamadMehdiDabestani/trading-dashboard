import { AuthErrorCode } from "@repo/types";

export const ERROR_AUTH_HTTP_META: Record<
  AuthErrorCode,
  { status: number; messageKey: AuthErrorCode }
> = {
  AUTH_FAIL: { status: 429, messageKey: "AUTH_FAIL" },
  USER_NOTFOUND: { status: 404, messageKey: "USER_NOTFOUND" },
};
