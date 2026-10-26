import { z } from "zod";

export const IRAN_MOBILE_REGEX = /^09\d{9}$/;

/** خروجی: رشتهٔ کلید ترجمه، مثل "phone" یا "passwordMin" */
const key = <T extends string>(k: T) => `common.validation.${k}` as const;

export const mobileSchema = z
  .string({ error: key("phoneRequired") })
  .trim()
  .min(1, key("phoneRequired"))
  .regex(IRAN_MOBILE_REGEX, key("phone"));

export const passwordSchema = z
  .string({ error: key("passwordRequired") })
  .min(1, key("passwordRequired"))
  .min(8, key("passwordMin"))
  .max(64, key("passwordMax"))
  .regex(/[A-Za-z]/, key("passwordLetter"))
  .regex(/\d/, key("passwordDigit"));

export const nameSchema = z
  .string({ error: key("nameMin") })
  .trim()
  .min(3, key("nameMin"))
  .max(60, key("nameMax"));


export const otpSchema = (length = 6) =>
  z
    .string({ error: key("otpRequired") })
    .min(1, key("otpRequired"))
    .regex(
      new RegExp(`^\\d{${length}}$`),
      `${key("otpLength")}|${JSON.stringify({ length })}`,
    );

export const fourDigitCode = otpSchema(4);
export type FourDigitCode = z.infer<typeof fourDigitCode>;
export type MobileValue = z.infer<typeof mobileSchema>