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
import { zodField } from "@/lib/tanstackValidation";
import { otpStepSchema, phoneStepSchema } from "@/features/auth/schema/schema";
import {
  FourDigitCode,
  mobileSchema,
  MobileValue,
  otpSchema,
} from "@/lib/primitivesValidations";
import { useAfterSubmitValidators } from "@/hooks/useAfterSubmitValidatior";

const OtpInput = dynamic(() => import("@/components/ui/otp"), { ssr: false });

const isValidOtpRequest = (v: MobileValue) => mobileSchema.safeParse(v).success;
const isValidOtpVerify = (v: FourDigitCode) =>
  otpStepSchema.shape.code.safeParse(v).success;
export default function OtpLoginPage() {
  const locale = useLocale();
  const tAuth = useTranslations("auth.otp");
  const tCommon = useTranslations();
  const f = useOtpLoginFlow();

  const isPhoneInvalid = (field: any) =>
    field.state.meta.isTouched && !field.state.meta.isValid;

  const isOtpInvalid = (field: any) =>
    field.state.meta.isTouched && !field.state.meta.isValid;
  const phoneValidator = useAfterSubmitValidators(f.phoneForm, mobileSchema);
  const codeValidator = useAfterSubmitValidators(
    f.otpForm,
    otpStepSchema.shape.code,
  );

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
                      validators={phoneValidator}
                      children={(field) => {
                        const invalid = isPhoneInvalid(field);
                        return (
                          <Field data-invalid={invalid}>
                            <FieldLabel htmlFor={field.name}>
                              {tCommon("common.fields.phone")}
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
                      validators={codeValidator}
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
                              />
                              {invalid && (
                                <FieldError
                                  errors={getFormErrorMessage(
                                    field.state.meta.errors,
                                    tCommon,
                                    "code",
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
                <f.phoneForm.Subscribe
                  selector={(s) => s.values}
                  children={(values) => {
                    const valid = isValidOtpRequest(values.phone);
                    return (
                      <>
                        <div
                          onMouseDown={(e) => {
                            if (!valid) e.preventDefault();
                          }}
                          className="w-full"
                        >
                          <Button
                            className="w-full"
                            onClick={() => f.phoneForm.handleSubmit()}
                            disabled={f.isSending}
                          >
                            {tAuth("sendButton")}
                          </Button>
                        </div>

                        <Link href="/auth" className="block w-full">
                          <Button variant="outline" className="w-full">
                            {tAuth("classicLogin")}
                          </Button>
                        </Link>
                      </>
                    );
                  }}
                />
              ) : (
                <f.otpForm.Subscribe
                  selector={(s) => s.values}
                  children={(values) => {
                    const valid = isValidOtpVerify(values.code);
                    return (
                      <>
                        <div
                          onMouseDown={(e) => {
                            if (!valid) e.preventDefault();
                          }}
                          className="w-full"
                        >
                          <Button
                            className="w-full"
                            onClick={() => f.otpForm.handleSubmit()}
                            disabled={f.isVerifying}
                          >
                            {tAuth("verifyButton")}
                          </Button>
                        </div>

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
                    );
                  }}
                />
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
