"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { OtpSendDto, OtpVerifyDto, EditProfileDto } from "@repo/types";
import { authApi } from "../api/auth.api";
import { authKeys } from "../api/auth.keys";

export function useSendOtp() {
  return useMutation({
    mutationFn: (body: OtpSendDto) => authApi.sendOtp(body),
  });
}

export function useVerifyOtp() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: OtpVerifyDto) => authApi.verifyOtp(body),
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: authKeys.me() });
      router.replace(data.isNew ? "/profile/complete" : "/dashboard");
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.clear();
      router.replace("/auth");
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EditProfileDto) => authApi.updateProfile(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me() }),
  });
}