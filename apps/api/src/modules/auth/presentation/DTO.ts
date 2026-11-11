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
      phone: { type: "string", minLength: 10, pattern: "^09\\d{9}$" },
      code: { type: "string", pattern: "^\\d{6}$", minLength: 4, maxLength: 6 },
    },
    additionalProperties: false,
  },
} as const;

// maxLength on password bounds scrypt cost (DoS protection)
export const passwordLoginSchema = {
  body: {
    type: "object",
    required: ["phone", "password"],
    properties: {
      phone: { type: "string", pattern: "^09\\d{9}$" },
      password: { type: "string", minLength: 1, maxLength: 128 },
    },
    additionalProperties: false,
  },
} as const;

export const registerSchema = {
  body: {
    type: "object",
    required: ["phone", "userName", "password"],
    properties: {
      phone: { type: "string", pattern: "^09\\d{9}$" },
      userName: { type: "string", minLength: 2, maxLength: 100 },
      password: { type: "string", minLength: 8, maxLength: 128 },
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

const idParams = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
} as const;

export const deviceLinkOpenSchema = {
  body: {
    type: "object",
    required: ["token"],
    properties: { token: { type: "string", minLength: 43, maxLength: 43 } },
    additionalProperties: false,
  },
} as const;

export const deviceLinkIdSchema = { params: idParams } as const;

export const deviceLinkStatusSchema = {
  params: idParams,
  querystring: {
    type: "object",
    properties: {
      pollSecret: { type: "string" },
    },
    additionalProperties: true,
  },
} as const;

export const deviceLinkApproveSchema = {
  params: idParams,
  body: {
    type: "object",
    required: ["code"],
    properties: { code: { type: "string", pattern: "^[0-9]{4}$" } },
    additionalProperties: false,
  },
} as const;