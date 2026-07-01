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

const REFRESH_COOKIE = "refresh_token";
const ACCESS_COOKIE = "access_token";

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/auth/refresh",
  maxAge: 7 * 24 * 60 * 60,
};

export async function authRoutes(fastify: FastifyInstance) {
  const authService = fastify.authService;

  fastify.post<{ Body: OtpSendDto; Reply: APIResult<OtpSentReply> }>(
    "/otp/send",
    { schema: otpSendSchema },
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
  }>("/otp/verify", { schema: otpVerifySchema }, async (req, reply) => {
    const { accessToken, refreshToken, isNew } = await authService.loginWithOtp(
      req.body.phone,
      req.body.code,
    );

    reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts);
    reply.setCookie(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      signed: true,
    });

    return reply
      .code(200)
      .send(ok({ isNew }, { message: { key: "LOGIN_SUCCESS" } }));
  });

  fastify.post<{ Reply: APIResult<null> }>("/refresh", async (req, reply) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw) return reply.code(401).send(fail("INVALID_REFRESH"));

    const { accessToken, refreshToken } = await authService.refresh(raw);

    reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts);
    reply.setCookie(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      signed: true,
    });

    return reply
      .code(200)
      .send(ok(null, { message: { key: "REFRESH_SUCCESS" } }));
  });
  fastify.patch<{ Body: EditProfileDto , Reply : APIResult<null> }>(
    "/profile",
    { preHandler: [fastify.authenticate], schema: editProfileSchema },
    async (req, reply) => {
      await authService.editProfile(
        req.user.sub,
        req.body,
      );
      return reply
        .code(200)
        .send(ok(null, { message: { key: "PROFILE_UPDATED" } }));
    },
  );

  fastify.post<{ Reply: APIResult<LogoutReply> }>(
    "/logout",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      const user = req.user ;

      await authService.logout(user.sub);

      reply.clearCookie(REFRESH_COOKIE, { path: "/auth/refresh" });
      reply.clearCookie(ACCESS_COOKIE, { path: "/" });

      return reply
        .code(200)
        .send(ok(undefined, { message: { key: "LOGOUT_SUCCESS" } }));
    },
  );
}
