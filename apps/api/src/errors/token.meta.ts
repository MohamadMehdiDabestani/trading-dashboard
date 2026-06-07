import { TokenErrorCode } from "@repo/types";

export const ERROR_TOKEN_HTTP_META: Record<
  TokenErrorCode,
  { status: number; messageKey: TokenErrorCode }
> = {
  INVALID_REFRESH: { status: 401, messageKey: "INVALID_REFRESH" },
};
