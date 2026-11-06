"use client";
import { AuthVisualPanel } from "@/features/auth/components/authVisualPanel";
import { LandingHeaderControls } from "@/features/landing/components/landingHeaderControls";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { otpStepSchema } from "@/features/auth/schema/schema";
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
import { applyApiFieldErrors } from "@/lib/validation/applyFieldErrors";
import {
  useLoginWithPassword,
  useRegister,
} from "@/features/auth/hooks/useAuthMutations";
import { Link } from "@/lib/i18nNavigation";

const loginPhone = fieldValidators(mobileSchema);
const loginPassword = fieldValidators(loginPasswordSchema);
const registerName = fieldValidators(nameSchema);
const registerPhone = fieldValidators(mobileSchema);
const registerPassword = fieldValidators(passwordSchema);

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const t = useTranslations("auth");
  const buttons = useTranslations("common.buttons");

  const loginMutation = useLoginWithPassword();
  const register = useRegister();

  const loginForm = useAppForm({
    defaultValues: { phone: "", password: "" },
    validationLogic,
    onSubmit: async ({ value }) => {
      if (loginMutation.isPending) return;
      try {
        await loginMutation.mutateAsync(value);
      } catch (err) {
        const applied = applyApiFieldErrors(err, loginForm);
        if (!applied) loginForm.setFieldValue("password", "");
      }
    },
  });
  const registerForm = useAppForm({
    validationLogic,
    defaultValues: { userName: "", phone: "", password: "" },
    onSubmit: async ({ value }) => {
      try {
        await register.mutateAsync({
          phone: value.phone,
          userName: value.userName.trim(),
          password: value.password,
        });
      } catch (err) {
        applyApiFieldErrors(err, registerForm);
      }
    },
  });
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-4 flex items-center justify-end">
            <LandingHeaderControls />
          </div>
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">{t("tabs.login")}</TabsTrigger>
              <TabsTrigger value="register">{t("tabs.register")}</TabsTrigger>
            </TabsList>

            {/* ───── ورود ───── */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>{t("classic.login.title")}</CardTitle>
                  <CardDescription>
                    {t("classic.login.description")}
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
                            label={t("classic.login.phoneLabel")}
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
                            label={t("classic.login.passwordLabel")}
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
                        label={buttons("submit")}
                      />
                    </loginForm.AppForm>
                    <Link href="/auth/otp" className="block w-full">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                      >
                        {t("classic.login.easyLogin")}
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
                  <CardTitle>{t("classic.register.title")}</CardTitle>
                  <CardDescription>
                    {t("classic.register.description")}
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
                        name="userName"
                        validators={registerName}
                      >
                        {(field) => (
                          <field.TextField
                            label={t("classic.register.nameLabel")}
                            placeholder={t("classic.register.namePlaceholder")}
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
                            label={t("classic.register.phoneLabel")}
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
                            label={t("classic.register.passwordLabel")}
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
                        label={buttons("submit")}
                      />
                    </registerForm.AppForm>
                    <Link href="/auth/otp" className="block w-full">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                      >
                        {t("classic.register.easyRegister")}
                      </Button>
                    </Link>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AuthVisualPanel />
    </div>
  );
}
