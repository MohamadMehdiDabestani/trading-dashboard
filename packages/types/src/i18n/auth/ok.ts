export const AUTH_SUCCESS_CODES = [
  "OTP_SENT",
  "OTP_VERIFIED",
  "LOGIN_SUCCESS",
  "REFRESH_SUCCESS",
  "LOGOUT_SUCCESS",
  "PROFILE_UPDATED"
] as const;

export type AuthSuccessCodes = (typeof AUTH_SUCCESS_CODES)[number];
