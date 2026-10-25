import type { FastifyReply } from "fastify";

export const REFRESH_COOKIE = "refresh_token";
export const ACCESS_COOKIE = "access_token";
export const POLL_COOKIE = "device_link_poll";
export const POLL_COOKIE_PATH = "/auth/device-link";

const secure = process.env.NODE_ENV === "production";

export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
) {
  reply.setCookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  reply.setCookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60
  });
}

export function clearAuthCookies(reply: FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE, { path: "/" });
  reply.clearCookie(ACCESS_COOKIE, { path: "/" });
}

export function setPollCookie(reply: FastifyReply, secret: string) {
  reply.setCookie(POLL_COOKIE, secret, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: POLL_COOKIE_PATH,
    maxAge: 120,
  });
}