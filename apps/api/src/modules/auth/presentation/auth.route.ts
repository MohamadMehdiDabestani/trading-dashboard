import { FastifyInstance } from "fastify";
import { ok, fail } from "@/utils/apiResponse";
import {
  APIResult,
  OtpSentReply,
  OtpVerifyReply,
  LogoutReply,
  EditProfileDto,
  OtpSendDto,
  OtpVerifyDto,
} from "@repo/types";
import { editProfileSchema, otpSendSchema, otpVerifySchema } from "./DTO";
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "../plugin/cookies";
const rl = (max: number, timeWindow = "1 minute") => ({
  config: { rateLimit: { max, timeWindow } },
});

export async function authRoutes(fastify: FastifyInstance) {
  const authService = fastify.authService;

  fastify.post<{ Body: OtpSendDto; Reply: APIResult<OtpSentReply> }>(
    "/otp/send",
    { schema: otpSendSchema, ...rl(3) },
    async (req, reply) => {
      await authService.sendOtp(req.body.phone);

      return reply
        .code(200)
        .send(ok(undefined, { message: { key: "OTP_SENT" } }));
    },
  );

  fastify.post<{
    Body: OtpVerifyDto;
    Reply: APIResult<OtpVerifyReply>;
  }>(
    "/otp/verify",
    { schema: otpVerifySchema, ...rl(10) },
    async (req, reply) => {
      const { accessToken, refreshToken, isNew } =
        await authService.loginWithOtp(req.body.phone, req.body.code);

      setAuthCookies(reply, accessToken, refreshToken);

      return reply
        .code(200)
        .send(ok({ isNew }, { message: { key: "LOGIN_SUCCESS" } }));
    },
  );

  fastify.post<{ Reply: APIResult<null> }>(
    "/refresh",
    { ...rl(30) },
    async (req, reply) => {
      const raw = req.cookies?.[REFRESH_COOKIE];
      if (!raw) return reply.code(401).send(fail("INVALID_REFRESH"));

      const { accessToken, refreshToken } = await authService.refresh(raw);
      setAuthCookies(reply, accessToken, refreshToken);
      return reply.send(ok(null, { message: { key: "REFRESH_SUCCESS" } }));
    },
  );

  fastify.patch<{ Body: EditProfileDto; Reply: APIResult<null> }>(
    "/profile",
    { preHandler: [fastify.authenticate], schema: editProfileSchema },
    async (req, reply) => {
      await authService.editProfile(req.user.sub, req.body);

      return reply
        .code(200)
        .send(ok(null, { message: { key: "PROFILE_UPDATED" } }));
    },
  );

  fastify.post<{ Reply: APIResult<LogoutReply> }>(
    "/logout",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      await authService.logout(req.user.sub);

      clearAuthCookies(reply);

      return reply
        .code(200)
        .send(ok(undefined, { message: { key: "LOGOUT_SUCCESS" } }));
    },
  );
}
