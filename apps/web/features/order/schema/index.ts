import z from "zod";

export const stripCommas = (v: string) => v.replace(/,/g, "");


export const priceSchema = z
  .string()
  .trim()
  .min(1, "required")
  .refine((v) => !Number.isNaN(Number(stripCommas(v))), "invalidType")
  .refine((v) => Number(stripCommas(v)) > 0, "minValue");

export const amountSchema = z
  .string()
  .trim()
  .min(1, "required")
  .refine((v) => !Number.isNaN(Number(v)), "invalidType")
  .refine((v) => Number(v) > 0, "minValue");