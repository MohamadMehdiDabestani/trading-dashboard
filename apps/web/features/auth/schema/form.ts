import { z } from "zod";

export const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, { error: "VALIDATION_PATTERN" }),
});

export const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, { error: "VALIDATION_MIN_LENGTH" })
    .regex(/^\d+$/, { error: "VALIDATION_PATTERN" }),
});
export const deviceLinkCodeSchema = z.object({
  code: z
    .string()
    .regex(/^\d{4}$/, { error: "VALIDATION_PATTERN" }),
});
// اسکیمای فیلد تکی برای استفاده در field-level validators
export const phoneFieldSchema = phoneSchema.shape.phone;
export const otpFieldSchema = otpSchema.shape.code;