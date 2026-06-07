import type { FastifyInstance } from "fastify";
import { AuthService } from "@/services/auth/auth.service";
import { ok } from "@/utils/apiResponse";
const REFRESH_COOKIE = "refresh_token";

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/auth/refresh",
  maxAge: 7 * 24 * 60 * 60, // seconds
};

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const auth = new AuthService(fastify);

  // POST /auth/otp/send
  fastify.post<{ Body: { phone: string } }>(
    "/otp/send",
    {
      schema: {
        body: {
          type: "object",
          required: ["phone"],
          properties: {
            phone: { type: "string", pattern: "^\\+?[0-9]{10,15}$" },
          },
        },
      },
    },
    async (req, reply) => {
      await auth.sendOtp(req.body.phone);
      return reply.code(200).send(ok(undefined, { message: { key: "OTP_SENT" } }));
    },
  );

  // POST /auth/otp/verify  → login / register
  fastify.post<{ Body: { phone: string; code: string } }>(
    "/otp/verify",
    {
      schema: {
        body: {
          type: "object",
          required: ["phone", "code"],
          properties: {
            phone: { type: "string" },
            code: { type: "string", minLength: 6, maxLength: 6 },
          },
        },
      },
    },
    async (req, reply) => {
      const { accessToken, refreshToken, isNew } = await auth.loginWithOtp(
        req.body.phone,
        req.body.code,
      );
      reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts);
      return reply.code(200).send({ accessToken, isNew });
    },
  );

  // POST /auth/refresh
  fastify.post("/refresh", async (req, reply) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw) return reply.code(401).send({ error: "Missing refresh token" });

    const { accessToken, refreshToken } = await auth.refresh(raw);
    reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts);
    return reply.code(200).send({ accessToken });
  });

  // POST /auth/logout  (protected)
  fastify.post(
    "/logout",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      const user = req.user as { sub: string };
      await auth.logout(user.sub);
      reply.clearCookie(REFRESH_COOKIE, { path: "/auth/refresh" });
      return reply.code(200).send({ ok: true });
    },
  );
}
