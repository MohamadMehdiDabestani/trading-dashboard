import { z } from "zod";

export const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, { error: "VALIDATION_REQUIRED" }), // 09 + 9 رقم
});

export const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, { error: "VALIDATION_MIN_LENGTH" })
    .regex(/^\d+$/, { error: "VALIDATION_PATTERN" }),
});
