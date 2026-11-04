import { apiFetch } from "@/lib/apiClient";
import type {
  OtpSendDto,
  OtpSentReply,
  OtpVerifyDto,
  OtpVerifyReply,
  PasswordLoginDto,
  RegisterDto,
  LoginHistoryReply,
  LogoutReply,
  EditProfileDto,
  MeReply,
} from "@repo/types";

export const authApi = {
  sendOtp: (body: OtpSendDto) =>
    apiFetch<OtpSentReply>("auth/otp/send", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verifyOtp: (body: OtpVerifyDto) =>
    apiFetch<OtpVerifyReply>("auth/otp/verify", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  loginWithPassword: (body: PasswordLoginDto) =>
    apiFetch<OtpVerifyReply>("auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body: RegisterDto) =>
    apiFetch<OtpVerifyReply>("auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  loginHistory: () => apiFetch<LoginHistoryReply>("auth/login-history"),

  logout: () => apiFetch<LogoutReply>("auth/logout", { method: "POST" }),

  refresh: () => apiFetch<null>("auth/refresh", { method: "POST" }),

  updateProfile: (body: EditProfileDto) =>
    apiFetch<null>("auth/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  me: () => apiFetch<MeReply>("me"),
};
