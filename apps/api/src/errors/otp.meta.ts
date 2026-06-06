import { OtpErrorCode } from "@repo/types";

export const ERROR_OTP_HTTP_META: Record<
  OtpErrorCode,
  { status: number; messageKey: OtpErrorCode }
> = {
    
  OTP_RATE_LIMIT: { status: 429, messageKey: "OTP_RATE_LIMIT" },
  OTP_INVALID: { status: 400, messageKey: "OTP_INVALID" },
  OTP_WRONG: { status: 400, messageKey: "OTP_WRONG" },
  OTP_MAX_ATTEMPTS: { status: 429, messageKey: "OTP_MAX_ATTEMPTS" },
};
