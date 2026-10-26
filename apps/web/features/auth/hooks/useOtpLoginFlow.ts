"use client";

import { useEffect, useState } from "react";
import { useSendOtp, useVerifyOtp } from "./useAuthMutations";
import { useAppForm } from "@/components/form";
import { applyApiFieldErrors } from "@/lib/validation/applyFieldErrors";
import { validationLogic } from "@/lib/validation/fieldValidator";

const RESEND_COOLDOWN_SEC = 60;

export function useOtpLoginFlow() {
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [timer, setTimer] = useState(0);

  const phoneForm = useAppForm({
    validationLogic,
    defaultValues: { phone: "" },
    onSubmit: async ({ value }) => {
      try {
        await sendOtp.mutateAsync(value);
        setStep("otp");
        setTimer(RESEND_COOLDOWN_SEC);
      } catch (err) {
        applyApiFieldErrors(err, phoneForm);
      }
    },
  });

  const otpForm = useAppForm({
    validationLogic,
    defaultValues: { code: "" },
    onSubmit: async ({ value }) => {
      if (verifyOtp.isPending) return;
      try {
        await verifyOtp.mutateAsync({
          phone: phoneForm.state.values.phone,
          code: value.code,
        });
      } catch (err) {
        const applied = applyApiFieldErrors(err, otpForm);
        if (!applied) otpForm.setFieldValue("code", "");
      }
    },
  });

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const resend = () => {
    if (sendOtp.isPending || timer > 0) return;
    sendOtp.mutate(
      { phone: phoneForm.state.values.phone },
      { onSuccess: () => setTimer(RESEND_COOLDOWN_SEC) },
    );
  };

  return {
    step,
    backToPhone: () => setStep("phone"),
    phoneForm,
    otpForm,
    timer,
    resend,
    isSending: sendOtp.isPending,
    canResend: timer === 0 && !sendOtp.isPending,
  };
}