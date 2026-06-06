export const OTP_ERROR_CODES = [
  "OTP_RATE_LIMIT",
  "OTP_INVALID",
  "OTP_WRONG",
  "OTP_MAX_ATTEMPTS",
] as const;

export type OtpErrorCode = (typeof OTP_ERROR_CODES)[number];
