import type { AllErrorCode } from "@repo/types";
import { ERROR_OTP_HTTP_META } from "./otp.meta";
import { ERROR_TOKEN_HTTP_META } from "./token.meta";
import { ERROR_VALIDATION_HTTP_META } from "./validation.meta";
import { ERROR_AUTH_HTTP_META } from "./auth.meta";
import { ERROR_COMMON_HTTP_META } from "./common.meta";
export const ERROR_HTTP_META = {
  ...ERROR_OTP_HTTP_META,
  ...ERROR_VALIDATION_HTTP_META,
  ...ERROR_TOKEN_HTTP_META,
  ...ERROR_AUTH_HTTP_META,
  ...ERROR_COMMON_HTTP_META,
} satisfies Record<AllErrorCode, { status: number; messageKey: AllErrorCode }>;
