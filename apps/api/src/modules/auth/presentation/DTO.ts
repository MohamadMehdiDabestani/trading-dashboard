export const otpSendSchema = {
  body: {
    type: "object",
    required: ["phone"],
    properties: {
      phone: { type: "string", minLength: 10 },
    },
    additionalProperties: false,
  },
} as const;

export const otpVerifySchema = {
  body: {
    type: "object",
    required: ["phone", "code"],
    properties: {
      phone: { type: "string", minLength: 10 },
      code: { type: "string", minLength: 4, maxLength: 6 },
    },
    additionalProperties: false,
  },
} as const;

export const editProfileSchema = {
  body: {
    type: "object",
    properties: {
      username: { type: "string", minLength: 3 },
      email: { type: "string", format: "email" },
    },
    additionalProperties: false,
  },
} as const;
