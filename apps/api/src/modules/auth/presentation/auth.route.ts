import { FastifyInstance } from "fastify";
import { ok, fail } from "@/utils/apiResponse";
import {
  APIResult,
  OtpSentReply,
  OtpVerifyReply,
  RefreshReply,
  LogoutReply,
  EditProfileDto,
  OtpSendDto,
  OtpVerifyDto,
} from "@repo/types";
import { editProfileSchema, otpSendSchema, otpVerifySchema } from "./DTO";

const REFRESH_COOKIE = "refresh_token";

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/auth/refresh",
  maxAge: 7 * 24 * 60 * 60,
};

export async function authRoutes(fastify: FastifyInstance) {
  const authService = fastify.authService;

  fastify.post<{ Body: OtpSendDto; Reply: APIResult<OtpSentReply>  }>(
    "/otp/send",
    {schema : otpSendSchema},
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
  }>("/otp/verify",{schema : otpVerifySchema}, async (req, reply) => {
    const { accessToken, refreshToken, isNew } = await authService.loginWithOtp(
      req.body.phone,
      req.body.code,
    );

    reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts);

    return reply
      .code(200)
      .send(ok({ accessToken, isNew }, { message: { key: "LOGIN_SUCCESS" } }));
  });

  fastify.post<{ Reply: APIResult<RefreshReply> }>(
    "/refresh",
    async (req, reply) => {
      const raw = req.cookies?.[REFRESH_COOKIE];
      if (!raw) return reply.code(401).send(fail("INVALID_REFRESH"));

      const { accessToken, refreshToken } = await authService.refresh(raw);

      reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts);

      return reply
        .code(200)
        .send(ok({ accessToken }, { message: { key: "REFRESH_SUCCESS" } }));
    },
  );
  fastify.patch<{ Body: EditProfileDto }>(
    "/profile",
    { preHandler: [fastify.authenticate], schema: editProfileSchema },
    async (req, reply) => {
      await authService.editProfile(
        (req.user as { sub: string }).sub,
        req.body,
      );
      return reply.code(200).send(ok(undefined, { message: { key: "PROFILE_UPDATED" } }));
    },
  );

  fastify.post<{ Reply: APIResult<LogoutReply> }>(
    "/logout",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      const user = req.user as { sub: string };

      await authService.logout(user.sub);

      reply.clearCookie(REFRESH_COOKIE, { path: "/auth/refresh" });

      return reply
        .code(200)
        .send(ok(undefined, { message: { key: "LOGOUT_SUCCESS" } }));
    },
  );
}
