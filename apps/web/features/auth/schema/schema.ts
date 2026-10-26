import { z } from "zod";
import {
  mobileSchema,
  passwordSchema,
  nameSchema,
  otpSchema,
  fourDigitCode,
} from "@/lib/validation/primitivesValidations";

export const loginSchema = z.object({
  phone: mobileSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  fullName: nameSchema,
  phone: mobileSchema,
  password: passwordSchema,
});

export const phoneStepSchema = z.object({
  phone: mobileSchema,
});

export const otpStepSchema = z.object({
  code: otpSchema(6),
});
export const deviceLinkCodeSchema = z.object({
  code: fourDigitCode,
});

export type DeviceLinkCodeInput = z.infer<typeof deviceLinkCodeSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PhoneStepInput = z.infer<typeof phoneStepSchema>;
export type OtpStepInput = z.infer<typeof otpStepSchema>;