import { FastifyInstance } from "fastify";
import { ok, fail } from "@/utils/apiResponse";
import {
  APIResult,
  OtpSentBody,
  OtpVerifyBody,
  RefreshBody,
  LogoutBody,
} from "@repo/types";

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

  fastify.post<{ Body: { phone: string }; Reply: APIResult<OtpSentBody> }>(
    "/otp/send",
    async (req, reply) => {
      await authService.sendOtp(req.body.phone);

      return reply
        .code(200)
        .send(ok(undefined, { message: { key: "OTP_SENT" } }));
    }
  );

  fastify.post<{ Body: { phone: string; code: string }; Reply: APIResult<OtpVerifyBody> }>(
    "/otp/verify",
    async (req, reply) => {
      const { accessToken, refreshToken, isNew } =
        await authService.loginWithOtp(req.body.phone, req.body.code);

      reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts);

      return reply
        .code(200)
        .send(ok({ accessToken, isNew }, { message: { key: "LOGIN_SUCCESS" } }));
    }
  );

  fastify.post<{ Reply: APIResult<RefreshBody> }>(
    "/refresh",
    async (req, reply) => {
      const raw = req.cookies?.[REFRESH_COOKIE];
      if (!raw)
        return reply.code(401).send(fail("INVALID_REFRESH"));

      const { accessToken, refreshToken } =
        await authService.refresh(raw);

      reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts);

      return reply
        .code(200)
        .send(ok({ accessToken }, { message: { key: "REFRESH_SUCCESS" } }));
    }
  );

  fastify.post<{ Reply: APIResult<LogoutBody> }>(
    "/logout",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      const user = req.user as { sub: string };

      await authService.logout(user.sub);

      reply.clearCookie(REFRESH_COOKIE, { path: "/auth/refresh" });

      return reply
        .code(200)
        .send(ok(undefined, { message: { key: "LOGOUT_SUCCESS" } }));
    }
  );
}
