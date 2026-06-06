import type { AllErrorCode } from "@repo/types";
import { ERROR_OTP_HTTP_META } from "./otp.meta";
import { ERROR_TOKEN_HTTP_META } from "./token.meta";
import { ERROR_VALIDATION_HTTP_META } from "./validation.meta";
export const ERROR_HTTP_META = {
  ...ERROR_OTP_HTTP_META,
  ...ERROR_VALIDATION_HTTP_META,
  ...ERROR_TOKEN_HTTP_META,
} satisfies Record<AllErrorCode, { status: number; messageKey: AllErrorCode }>;
