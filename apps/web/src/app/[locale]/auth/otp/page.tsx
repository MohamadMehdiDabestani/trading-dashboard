"use client";

import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSendOtp, useVerifyOtp } from "@/features/auth/hooks/useAuthApi";
import { applyApiFieldErrors, getFormErrorMessage } from "@/lib/apiFieldError";
import { phoneSchema, otpSchema } from "@/features/auth/schema/form";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { OtpVerifyReply } from "@repo/types";
import { setAccessToken } from "@/lib/accessToken";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const OtpInput = dynamic(() => import("@/features/auth/components/otpInput"), {
  ssr: false,
});
export default function AuthPage() {
  const [timer, setTimer] = useState(0);
  const [showOtp, setShowOtp] = useState(false);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [otpSubmitted, setOtpSubmitted] = useState(false);

  const locale = useLocale();
  const tAuth = useTranslations("auth.otp");
  const tCommon = useTranslations("common");
  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();
  const router = useRouter();

  const phoneForm = useForm({
    defaultValues: { phone: "" },
    validators: {
      onSubmit: phoneSchema,
      onChange: phoneSubmitted ? phoneSchema : undefined,
    },
    onSubmit: async ({ value }) => {
      setPhoneSubmitted(true);
      try {
        await sendOtpMutation.mutateAsync(value);
        setShowOtp(true);
        setTimer(60);
        toast.success(tAuth("successSent"));
      } catch (error) {
        applyApiFieldErrors(error, phoneForm);
      }
    },
    onSubmitInvalid: () => {
      setPhoneSubmitted(true);
    },
  });

  const otpForm = useForm({
    defaultValues: { code: "" },
    validators: {
      onSubmit: otpSchema,
      onChange: otpSubmitted ? otpSchema : undefined,
    },
    onSubmit: async ({ value }) => {
      setOtpSubmitted(true);
      try {
        const res = await verifyOtpMutation.mutateAsync({
          phone: phoneForm.getFieldValue("phone"),
          code: value.code,
        });
        if (res.success) setAccessToken(res.data.accessToken);
        router.push("/dashboard");
      } catch (error) {
        applyApiFieldErrors(error, otpForm);
      }
    },
    onSubmitInvalid: () => {
      setOtpSubmitted(true);
    },
  });

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-background">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="relative">
              <CardTitle>
                {showOtp ? tAuth("verifyTitle") : tAuth("title")}
              </CardTitle>
              {showOtp && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setShowOtp(false);
                    setOtpSubmitted(false);
                  }}
                  className="absolute inset-e-4 p-1 rounded-md hover:bg-muted transition"
                >
                  {locale === "fa" ? (
                    <ArrowLeft className="w-5 h-5" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </Button>
              )}
              <CardDescription>
                {showOtp
                  ? tAuth("verifyDescritpion")
                  : tAuth("descritpion")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!showOtp && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    phoneForm.handleSubmit();
                  }}
                >
                  <FieldGroup>
                    <phoneForm.Field
                      name="phone"
                      children={(field) => {
                        const isInvalid =
                          phoneSubmitted &&
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>
                              {tCommon("fields.phone")}
                            </FieldLabel>

                            <Input
                              id="phone"
                              type="text"
                              inputMode="numeric"
                              placeholder="09..."
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              onBlur={field.handleBlur}
                              variant={isInvalid ? "error" : "default"}
                              aria-invalid={isInvalid}
                              className="focus-visible:outline-none"
                            />
                            {isInvalid && (
                              <FieldError
                                errors={getFormErrorMessage(
                                  field.state.meta.errors,
                                  tCommon,
                                  "phone",
                                )}
                              />
                            )}
                          </Field>
                        );
                      }}
                    />
                  </FieldGroup>
                </form>
              )}

              {showOtp && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    otpForm.handleSubmit();
                  }}
                >
                  <FieldGroup>
                    <otpForm.Field
                      name="code"
                      children={(field) => {
                        const isInvalid =
                          otpSubmitted &&
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <div className="min-h-12 flex flex-col items-center justify-center gap-2">
                            <Field data-invalid={isInvalid}>
                              <OtpInput
                                onComplete={(code) => {
                                  field.handleChange(code);
                                  otpForm.handleSubmit();
                                }}
                              />
                              {isInvalid && (
                                <FieldError
                                  errors={getFormErrorMessage(
                                    field.state.meta.errors,
                                    tCommon,
                                    "otp",
                                  )}
                                />
                              )}
                            </Field>
                          </div>
                        );
                      }}
                    />
                  </FieldGroup>
                </form>
              )}
            </CardContent>

            <CardFooter className="flex-col gap-y-3">
              {!showOtp ? (
                <Fragment>
                  <Button
                    className="w-full"
                    onClick={() => phoneForm.handleSubmit()}
                    disabled={sendOtpMutation.isPending}
                  >
                    {tAuth("sendButton")}
                  </Button>
                  <Link href="/auth" className="block w-full">
                    <Button variant="outline" className="w-full">
                      {tAuth("classicLogin")}
                    </Button>
                  </Link>
                </Fragment>
              ) : (
                <Fragment>
                  <Button
                    className="w-full"
                    onClick={() => otpForm.handleSubmit()}
                    disabled={verifyOtpMutation.isPending}
                  >
                    {tAuth("verifyButton")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={timer > 0 || sendOtpMutation.isPending}
                    onClick={() => phoneForm.handleSubmit()}
                  >
                    {timer > 0 ? `${tAuth("resendButton")} (${timer})` : tAuth("resendButton")}
                  </Button>
                </Fragment>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="hidden md:flex flex-1 relative bg-muted items-center justify-center overflow-hidden">
        <Image
          src="/images/auth.png"
          alt="Authentication Background"
          fill
          priority
          sizes="50vw"
          className="absolute inset-0 object-cover"
        />
      </div>
    </div>
  );
}
