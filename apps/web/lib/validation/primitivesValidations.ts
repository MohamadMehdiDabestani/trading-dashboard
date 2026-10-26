import { z } from "zod";

export const IRAN_MOBILE_REGEX = /^09\d{9}$/;

export const mobileSchema = z
  .string()
  .trim()
  .min(1)
  .regex(IRAN_MOBILE_REGEX, "phone");

export type PasswordRule = {
  key: string;
  params?: Record<string, number>;
  test: (v: string) => boolean;
  checklist?: boolean;
};

export const passwordRules: PasswordRule[] = [
  { key: "passwordMin", params: { min: 8 }, test: (v) => v.length >= 8, checklist: true },
  { key: "passwordLetter", test: (v) => /[A-Za-z]/.test(v), checklist: true },
  { key: "passwordDigit", test: (v) => /\d/.test(v), checklist: true },
  { key: "passwordMax", params: { max: 64 }, test: (v) => v.length <= 64 },
];

export const passwordSchema = z
  .string()
  .min(1)
  .superRefine((v, ctx) => {
    for (const rule of passwordRules) {
      if (!rule.test(v)) {
        ctx.addIssue({ code: "custom", message: rule.key, params: rule.params });
      }
    }
  });

export const loginPasswordSchema = z.string().min(1);

export const nameSchema = z
  .string()
  .trim()
  .min(3, "nameMin")
  .max(60, "nameMax");

export const otpSchema = (length = 6) =>
  z
    .string()
    .min(1)
    .length(length, "otpLength")
    .regex(/^\d+$/, "digitsOnly");

export const fourDigitCode = otpSchema(4);
export type MobileValue = z.infer<typeof mobileSchema>;