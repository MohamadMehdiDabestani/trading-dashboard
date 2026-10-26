"use client";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { useOtpLoginFlow } from "@/features/auth/hooks/useOtpLoginFlow";
import { otpStepSchema } from "@/features/auth/schema/schema";
import { normalizeMobile } from "@/lib/normalizeDigits";
import { fieldValidators } from "@/lib/validation/fieldValidator";
import { mobileSchema } from "@/lib/validation/primitivesValidations";

const phoneValidators = fieldValidators(mobileSchema);
const codeValidators = fieldValidators(otpStepSchema.shape.code);

export default function OtpLoginPage() {
  const locale = useLocale();
  const t = useTranslations();
  const tAuth = useTranslations("auth.otp");
  const f = useOtpLoginFlow();

  const isOtp = f.step === "otp";
  const BackIcon = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-background">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="relative">
              <CardTitle>{isOtp ? tAuth("verifyTitle") : tAuth("title")}</CardTitle>
              {isOtp && (
                <Button size="icon" variant="ghost" onClick={f.backToPhone}
                  className="absolute inset-e-4">
                  <BackIcon className="w-5 h-5" />
                </Button>
              )}
              <CardDescription>
                {isOtp ? tAuth("verifyDescritpion") : tAuth("descritpion")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {!isOtp ? (
                <form
                  id="phone-form"
                  noValidate
                  onSubmit={(e) => { e.preventDefault(); f.phoneForm.handleSubmit(); }}
                >
                  <FieldGroup>
                    <f.phoneForm.AppField name="phone" validators={phoneValidators}>
                      {(field) => (
                        <field.TextField
                          label={t("common.fields.phone")}
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          placeholder="09..."
                          dir="ltr"
                          normalize={normalizeMobile}
                        />
                      )}
                    </f.phoneForm.AppField>
                  </FieldGroup>
                </form>
              ) : (
                <form
                  id="otp-form"
                  noValidate
                  onSubmit={(e) => { e.preventDefault(); f.otpForm.handleSubmit(); }}
                >
                  <FieldGroup>
                    <f.otpForm.AppField name="code" validators={codeValidators}>
                      {(field) => <field.OtpField length={6} />}
                    </f.otpForm.AppField>
                  </FieldGroup>
                </form>
              )}
            </CardContent>

            <CardFooter className="flex-col gap-y-3">
              {!isOtp ? (
                <>
                  <f.phoneForm.AppForm>
                    <f.phoneForm.SubmitButton form="phone-form" className="w-full"
                      label={tAuth("sendButton")} />
                  </f.phoneForm.AppForm>
                  <Link href="/auth" className="block w-full">
                    <Button variant="outline" className="w-full">{tAuth("classicLogin")}</Button>
                  </Link>
                </>
              ) : (
                <>
                  <f.otpForm.AppForm>
                    <f.otpForm.SubmitButton form="otp-form" className="w-full"
                      label={tAuth("verifyButton")} />
                  </f.otpForm.AppForm>
                  <Button variant="outline" className="w-full"
                    disabled={!f.canResend} onClick={f.resend}>
                    {f.timer > 0 ? `${tAuth("resendButton")} (${f.timer})` : tAuth("resendButton")}
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="hidden md:flex flex-1 relative bg-muted overflow-hidden">
        <Image src="/images/auth.png" alt="" fill priority sizes="50vw" className="object-cover" />
      </div>
    </div>
  );
}