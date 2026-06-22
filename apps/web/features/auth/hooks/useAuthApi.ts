"use client";

import { useMutation } from "@tanstack/react-query";
import { sendOtp, verifyOtp } from "../api/otp";
import { APIResult, OtpVerifyReply } from "@repo/types";

export function useVerifyOtp() {
  return useMutation({
    mutationFn: verifyOtp,
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: sendOtp,
  });
}
