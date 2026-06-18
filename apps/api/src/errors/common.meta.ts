import { CommonErrorCode } from "@repo/types";

export const ERROR_COMMON_HTTP_META: Record<
  CommonErrorCode,
  { status: number; messageKey: CommonErrorCode }
> = {
  INTERNAL_SERVER_ERROR: { status: 401, messageKey: "INTERNAL_SERVER_ERROR" },
  FORBIDDEN: { status: 403, messageKey: "FORBIDDEN" },
};
