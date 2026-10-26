"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LoginInput,
  loginSchema,
  RegisterInput,
  registerSchema,
} from "@/features/auth/schema/schema";
import {
  mobileSchema,
  passwordSchema,
  nameSchema,
} from "@/lib/primitivesValidations";
import { zodForm, zodField } from "@/lib/tanstackValidation";
import { getFormErrorMessage } from "@/lib/apiFieldError";
import { useTranslations } from "next-intl";
import { useAfterSubmitValidators } from "@/hooks/useAfterSubmitValidatior";

const isLoginValid = (v: LoginInput) => loginSchema.safeParse(v).success;

const isRegisterValid = (v: RegisterInput) =>
  registerSchema.safeParse(v).success;

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const tCommon = useTranslations();
  const loginForm = useForm({
    defaultValues: { phone: "", password: "" },
    validators: { onSubmit: zodForm(loginSchema) },
    onSubmit: async ({ value }) => {
      // TODO: loginApi.mutate(value)
    },
  });
  const registerForm = useForm({
    defaultValues: { fullName: "", phone: "", password: "" },
    validators: { onSubmit: zodForm(registerSchema) },
    onSubmit: async ({ value }) => {
      // TODO: registerApi.mutate(value)
    },
  });
  const phoneValidator = useAfterSubmitValidators(loginForm , mobileSchema);
  const passwordValidator = useAfterSubmitValidators(loginForm , passwordSchema);
  const fullNameValidator = useAfterSubmitValidators(registerForm , nameSchema);
  const registerPhoneValidator = useAfterSubmitValidators(registerForm , mobileSchema);
  const registerPasswordValidator = useAfterSubmitValidators(registerForm , passwordSchema);
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
                  onSubmit={(e) => {
                    e.preventDefault();
                    loginForm.handleSubmit();
                  }}
                >
                  <CardContent className="space-y-4">
                    <FieldGroup>
                      <loginForm.Field
                        name="phone"
                        validators={phoneValidator}
                        children={(field) => {
                          const invalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <Field data-invalid={invalid}>
                              <FieldLabel htmlFor={field.name}>
                                شماره همراه
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

                      <loginForm.Field
                        name="password"
                        validators={passwordValidator}
                        children={(field) => {
                          const invalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <Field data-invalid={invalid}>
                              <FieldLabel htmlFor={field.name}>
                                رمز عبور
                              </FieldLabel>
                              <Input
                                id={field.name}
                                type="password"
                                autoComplete="current-password"
                                value={field.state.value}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                aria-invalid={invalid}
                              />
                              {invalid && (
                                <FieldError
                                  errors={getFormErrorMessage(
                                    field.state.meta.errors,
                                    tCommon,
                                    "password",
                                  )}
                                />
                              )}
                            </Field>
                          );
                        }}
                      />
                    </FieldGroup>
                  </CardContent>

                  <CardFooter className="flex-col gap-y-3 mt-2">
                    <loginForm.Subscribe
                      selector={(s) => s.values}
                      children={(values) => {
                        const valid = isLoginValid(values);
                        return (
                          <div
                            onMouseDown={(e) => {
                              if (!valid) e.preventDefault();
                            }}
                            className="w-full"
                          >
                            <Button
                              className="w-full"
                              type="submit"
                            >
                              {tCommon("common.buttons.submit")}
                            </Button>
                          </div>
                        );
                      }}
                    />
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
                  onSubmit={(e) => {
                    e.preventDefault();
                    registerForm.handleSubmit();
                  }}
                >
                  <CardContent className="space-y-4">
                    <FieldGroup>
                      <registerForm.Field
                        name="fullName"
                        validators={fullNameValidator}
                        children={(field) => {
                          const invalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <Field data-invalid={invalid}>
                              <FieldLabel htmlFor={field.name}>
                                نام و نام خانوادگی
                              </FieldLabel>
                              <Input
                                id={field.name}
                                placeholder="علی احمدی"
                                autoComplete="name"
                                value={field.state.value}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                aria-invalid={invalid}
                              />
                              {invalid && (
                                <FieldError
                                  errors={getFormErrorMessage(
                                    field.state.meta.errors,
                                    tCommon,
                                    "fullName",
                                  )}
                                />
                              )}
                            </Field>
                          );
                        }}
                      />

                      <registerForm.Field
                        name="phone"
                        validators={registerPhoneValidator}
                        children={(field) => {
                          const invalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <Field data-invalid={invalid}>
                              <FieldLabel htmlFor={field.name}>
                                شماره تماس
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

                      <registerForm.Field
                        name="password"
                        validators={registerPasswordValidator}
                        children={(field) => {
                          const invalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <Field data-invalid={invalid}>
                              <FieldLabel htmlFor={field.name}>
                                رمز عبور
                              </FieldLabel>
                              <Input
                                id={field.name}
                                type="password"
                                autoComplete="new-password"
                                value={field.state.value}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                aria-invalid={invalid}
                              />
                              {invalid && (
                                <FieldError
                                  errors={getFormErrorMessage(
                                    field.state.meta.errors,
                                    tCommon,
                                    "password",
                                  )}
                                />
                              )}
                            </Field>
                          );
                        }}
                      />
                    </FieldGroup>
                  </CardContent>

                  <CardFooter className="flex-col gap-y-3 mt-2">
                    <registerForm.Subscribe
                      selector={(s) => s.values}
                      children={(values) => {
                        const valid = isRegisterValid(values);
                        return (
                          <div
                            onMouseDown={(e) => {
                              if (!valid) e.preventDefault();
                            }}
                            className="w-full"
                          >
                            <Button
                              className="w-full"
                              type="submit"
                            >
                              ثبت نام
                            </Button>
                          </div>
                        );
                      }}
                    />

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
