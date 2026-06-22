import { apiFetch } from "@/lib/apiClient";
import { APIResult, OtpSendDto, OtpVerifyDto, OtpVerifyReply } from "@repo/types";

export async function sendOtp(data: OtpSendDto) {
  return await apiFetch<OtpSendDto>(`auth/otp/send`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function verifyOtp(data: OtpVerifyDto) {
  return await apiFetch<OtpVerifyReply>(`auth/otp/verify`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
