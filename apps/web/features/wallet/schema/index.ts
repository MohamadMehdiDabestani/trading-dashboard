import { z } from "zod";

export const depositSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "required")
    .refine(
      (v) => !Number.isNaN(Number(v)) && /^[0-9]+(\.[0-9]{1,18})?$/.test(v),
      "invalidType",
    )
    .refine((v) => Number(v) > 0, "minValue"),
});

export const depositAmountSchema = depositSchema.shape.amount;
export type DepositInput = z.infer<typeof depositSchema>;
