import { CommonErrorCode } from "@repo/types";

export const ERROR_COMMON_HTTP_META: Record<
  CommonErrorCode,
  { status: number; messageKey: CommonErrorCode }
> = {
  INTERNAL_SERVER_ERROR: { status: 500, messageKey: "INTERNAL_SERVER_ERROR" },
  FORBIDDEN: { status: 403, messageKey: "FORBIDDEN" },
  BAD_REQUEST: { status: 400, messageKey: "BAD_REQUEST" },
  NOT_FOUND: { status: 404, messageKey: "NOT_FOUND" },
  RATE_LIMIT: { status: 429, messageKey: "RATE_LIMIT" },
};
