"use client";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useOtpLoginFlow } from "@/features/auth/hooks/useOtpLoginFlow";
import { getFormErrorMessage } from "@/lib/apiFieldError";

const OtpInput = dynamic(() => import("@/components/ui/otp"), { ssr: false });

export default function OtpLoginPage() {
  const locale = useLocale();
  const tAuth = useTranslations("auth.otp");
  const tCommon = useTranslations("common");
  const f = useOtpLoginFlow();

  const isPhoneInvalid = (field: any) =>
    f.phoneSubmitted && !field.state.meta.isValid;

  const isOtpInvalid = (field: any) =>
    f.otpSubmitted && !field.state.meta.isValid;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-background">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="relative">
              <CardTitle>
                {f.step === "otp" ? tAuth("verifyTitle") : tAuth("title")}
              </CardTitle>
              {f.step === "otp" && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={f.backToPhone}
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
                {f.step === "otp"
                  ? tAuth("verifyDescritpion")
                  : tAuth("descritpion")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {f.step === "phone" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    f.phoneForm.handleSubmit();
                  }}
                >
                  <FieldGroup>
                    <f.phoneForm.Field
                      name="phone"
                      validators={f.phoneFieldValidators}
                      children={(field) => {
                        const invalid = isPhoneInvalid(field);
                        return (
                          <Field data-invalid={invalid}>
                            <FieldLabel htmlFor={field.name}>
                              {tCommon("fields.phone")}
                            </FieldLabel>
                            <Input
                              id={field.name}
                              type="tel"
                              inputMode="numeric"
                              autoComplete="tel"
                              placeholder="09..."
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              onBlur={field.handleBlur}
                              variant={invalid ? "error" : "default"}
                              aria-invalid={invalid}
                            />
                            {invalid && (
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

              {f.step === "otp" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    f.otpForm.handleSubmit();
                  }}
                >
                  <FieldGroup>
                    <f.otpForm.Field
                      name="code"
                      validators={f.otpFieldValidators}
                      children={(field) => {
                        const invalid = isOtpInvalid(field);
                        return (
                          <div className="min-h-12 flex flex-col items-center justify-center gap-2">
                            <Field data-invalid={invalid}>
                              <OtpInput
                                length={6}
                                value={field.state.value}
                                onChange={(code) => field.handleChange(code)}
                                onComplete={() => f.otpForm.handleSubmit()}
                                onBlur={field.handleBlur}
                                disabled={f.isVerifying}
                                error={invalid}
                                aria-label={tCommon("fields.otp")}
                              />
                              {invalid && (
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
              {f.step === "phone" ? (
                <>
                  <Button
                    className="w-full"
                    onClick={() => f.phoneForm.handleSubmit()}
                    disabled={f.isSending}
                  >
                    {tAuth("sendButton")}
                  </Button>
                  <Link href="/auth" className="block w-full">
                    <Button
                      variant="outline"
                      className="w-full"
                      color="secondary"
                    >
                      {tAuth("classicLogin")}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button
                    className="w-full"
                    onClick={() => f.otpForm.handleSubmit()}
                    disabled={f.isVerifying}
                  >
                    {tAuth("verifyButton")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!f.canResend}
                    onClick={f.resend}
                  >
                    {f.timer > 0
                      ? `${tAuth("resendButton")} (${f.timer})`
                      : tAuth("resendButton")}
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="hidden md:flex flex-1 relative bg-muted items-center justify-center overflow-hidden">
        <Image
          src="/images/auth.png"
          alt=""
          fill
          priority
          sizes="50vw"
          className="absolute inset-0 object-cover"
        />
      </div>
    </div>
  );
}
