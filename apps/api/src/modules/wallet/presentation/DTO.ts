export const walletDepositSchema = {
  body: {
    type: "object",
    required: ["asset", "amount"],
    properties: {
      asset: { type: "string", minLength: 2, maxLength: 10 },
      amount: { type: "string", pattern: "^[0-9.]+$" },
    },
  },
} as const;
