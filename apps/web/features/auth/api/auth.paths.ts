export const authPaths = {
  me: () => "auth/me" as const,
  loginHistory: () => "auth/login-history" as const,
  otpSend: () => "auth/otp/send" as const,
  otpVerify: () => "auth/otp/verify" as const,
  login: () => "auth/login" as const,
  register: () => "auth/register" as const,
  logout: () => "auth/logout" as const,
  refresh: () => "auth/refresh" as const,
  profile: () => "auth/profile" as const,
};
