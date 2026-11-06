"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  OtpSendDto,
  OtpVerifyDto,
  EditProfileDto,
  PasswordLoginDto,
  RegisterDto,
} from "@repo/types";
import { authApi } from "../api/auth.api";
import { authKeys } from "../api/auth.keys";
import { authQueries } from "../api/auth.queries";
import { useRouter } from "@/lib/i18nNavigation";

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

export function useLoginWithPassword() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: PasswordLoginDto) => authApi.loginWithPassword(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: authKeys.me() });
      router.replace("/dashboard");
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: RegisterDto) => authApi.register(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: authKeys.me() });
      router.replace("/dashboard");
    },
  });
}

export function useLoginHistory() {
  return useQuery(authQueries.loginHistory());
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
