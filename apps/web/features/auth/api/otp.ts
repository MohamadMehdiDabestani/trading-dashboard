import { apiFetch } from "@/lib/apiClient";
import {  OtpSendDto, OtpSentReply, OtpVerifyDto, OtpVerifyReply } from "@repo/types";

export async function sendOtp(data: OtpSendDto) {
  return await apiFetch<OtpSentReply>(`auth/otp/send`, {
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
