"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  mobileSchema,
  passwordSchema,
  loginPasswordSchema,
  nameSchema,
} from "@/lib/validation/primitivesValidations";
import { normalizeMobile } from "@/lib/normalizeDigits";
import { useAppForm } from "@/components/form";
import {
  fieldValidators,
  validationLogic,
} from "@/lib/validation/fieldValidator";

const loginPhone = fieldValidators(mobileSchema);
const loginPassword = fieldValidators(loginPasswordSchema);
const registerName = fieldValidators(nameSchema);
const registerPhone = fieldValidators(mobileSchema);
const registerPassword = fieldValidators(passwordSchema);

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const t = useTranslations();

  const loginForm = useAppForm({
    defaultValues: { phone: "", password: "" },
    validationLogic,
    onSubmit: async ({ value }) => {
      // TODO: loginApi.mutate(value)
    },
  });

  const registerForm = useAppForm({
    defaultValues: { fullName: "", phone: "", password: "" },
    validationLogic,
    onSubmit: async ({ value }) => {
      // TODO: registerApi.mutate(value)
    },
  });

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-background">
        <div className="w-full max-w-md">
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">ورود</TabsTrigger>
              <TabsTrigger value="register">ثبت نام</TabsTrigger>
            </TabsList>

            {/* ───── ورود ───── */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>خوش آمدید</CardTitle>
                  <CardDescription>
                    برای ورود، اطلاعات حساب خود را وارد کنید.
                  </CardDescription>
                </CardHeader>

                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    loginForm.handleSubmit();
                  }}
                >
                  <CardContent className="space-y-4">
                    <FieldGroup>
                      <loginForm.AppField name="phone" validators={loginPhone}>
                        {(field) => (
                          <field.TextField
                            label="شماره همراه"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            placeholder="09..."
                            dir="ltr"
                            normalize={normalizeMobile}
                          />
                        )}
                      </loginForm.AppField>

                      <loginForm.AppField
                        name="password"
                        validators={loginPassword}
                      >
                        {(field) => (
                          <field.TextField
                            label="رمز عبور"
                            type="password"
                            autoComplete="current-password"
                            dir="ltr"
                          />
                        )}
                      </loginForm.AppField>
                    </FieldGroup>
                  </CardContent>

                  <CardFooter className="flex-col gap-y-3 mt-2">
                    <loginForm.AppForm>
                      <loginForm.SubmitButton
                        className="w-full"
                        label={t("common.buttons.submit")}
                      />
                    </loginForm.AppForm>
                    <Link href="/auth/otp" className="block w-full">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                      >
                        ورود آسان
                      </Button>
                    </Link>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* ───── ثبت‌نام ───── */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>ساخت حساب جدید</CardTitle>
                  <CardDescription>
                    اطلاعات خود را برای ایجاد حساب وارد کنید.
                  </CardDescription>
                </CardHeader>

                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    registerForm.handleSubmit();
                  }}
                >
                  <CardContent className="space-y-4">
                    <FieldGroup>
                      <registerForm.AppField
                        name="fullName"
                        validators={registerName}
                      >
                        {(field) => (
                          <field.TextField
                            label="نام و نام خانوادگی"
                            placeholder="علی احمدی"
                            autoComplete="name"
                          />
                        )}
                      </registerForm.AppField>

                      <registerForm.AppField
                        name="phone"
                        validators={registerPhone}
                      >
                        {(field) => (
                          <field.TextField
                            label="شماره تماس"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            placeholder="09..."
                            dir="ltr"
                            normalize={normalizeMobile}
                          />
                        )}
                      </registerForm.AppField>

                      <registerForm.AppField
                        name="password"
                        validators={registerPassword}
                      >
                        {(field) => (
                          <field.TextField
                            label="رمز عبور"
                            type="password"
                            autoComplete="new-password"
                            dir="ltr"
                          />
                        )}
                      </registerForm.AppField>
                    </FieldGroup>
                  </CardContent>

                  <CardFooter className="flex-col gap-y-3 mt-2">
                    <registerForm.AppForm>
                      <registerForm.SubmitButton
                        className="w-full"
                        label="ثبت نام"
                      />
                    </registerForm.AppForm>
                    <Link href="/auth/otp" className="block w-full">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                      >
                        ثبت نام آسان
                      </Button>
                    </Link>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
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
