import { config } from "dotenv";
config();
import { FastifyInstance, FastifyRequest } from "fastify";
import QRCode from "qrcode";
import { ok, fail } from "@/utils/apiResponse";
import {
  deviceLinkApproveSchema,
  deviceLinkIdSchema,
  deviceLinkOpenSchema,
} from "./DTO";
import {
  POLL_COOKIE,
  POLL_COOKIE_PATH,
  setAuthCookies,
  setPollCookie,
} from "../plugin/cookies";

export interface DeviceLinkOpenedEvent {
  userId: string;
  requestId: string;
  ip: string;
  userAgent: string;
}

export interface DeviceLinkRouteOpts {
  /** Hook to push a realtime notification (ws / eventBus) to device 1. */
  onOpened?: (e: DeviceLinkOpenedEvent) => void;
}

const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";

const meta = (req: FastifyRequest) => ({
  ip: req.ip,
  userAgent: String(req.headers["user-agent"] ?? "unknown"),
});

const limit = (max: number) => ({
  config: { rateLimit: { max, timeWindow: "1 minute" } },
});

export async function deviceLinkRoutes(
  fastify: FastifyInstance,
  opts: DeviceLinkRouteOpts,
) {
  const svc = fastify.deviceLinkService;

  // ---- Device 1 (authenticated) -------------------------------------------

  // create link + QR
  fastify.post(
    "/",
    { preHandler: [fastify.authenticate], ...limit(5) },
    async (req, reply) => {
      const { id, token, expiresAt } = await svc.create(req.user.sub, meta(req));

      // token lives in the URL fragment-free path; it is single use + 2 min TTL
      const url = `${WEB_URL}/deviceLink/${token}`;
      const qrSvg = await QRCode.toString(url, {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "M",
      });

      reply.header("Cache-Control", "no-store");
      return reply
        .code(201)
        .send(ok({ id, url, qrSvg, expiresAt: expiresAt.toISOString() }));
    },
  );

  // state of the request (used by device 1 as polling fallback / prompt data)
  fastify.get<{ Params: { id: string } }>(
    "/:id",
    {
      preHandler: [fastify.authenticate],
      schema: deviceLinkIdSchema,
      ...limit(60),
    },
    async (req, reply) => {
      const data = await svc.getForOwner(req.params.id, req.user.sub);
      reply.header("Cache-Control", "no-store");
      return reply.send(ok(data));
    },
  );

  fastify.post<{ Params: { id: string }; Body: { code: string } }>(
    "/:id/approve",
    {
      preHandler: [fastify.authenticate],
      schema: deviceLinkApproveSchema,
      ...limit(10),
    },
    async (req, reply) => {
      await svc.approve(req.params.id, req.user.sub, req.body.code);
      return reply
        .code(200)
        .send(ok(null, { message: { key: "DEVICE_LINK_APPROVED" } }));
    },
  );

  fastify.post<{ Params: { id: string } }>(
    "/:id/deny",
    {
      preHandler: [fastify.authenticate],
      schema: deviceLinkIdSchema,
      ...limit(10),
    },
    async (req, reply) => {
      await svc.deny(req.params.id, req.user.sub);
      return reply
        .code(200)
        .send(ok(null, { message: { key: "DEVICE_LINK_DENIED" } }));
    },
  );

  // ---- Device 2 (anonymous) -----------------------------------------------

  fastify.post<{ Body: { token: string } }>(
    "/open",
    { schema: deviceLinkOpenSchema, ...limit(10) },
    async (req, reply) => {
      const r = await svc.open(req.body.token, meta(req));

      setPollCookie(reply, r.pollSecret);

      opts.onOpened?.({
        userId: r.userId,
        requestId: r.id,
        ...meta(req),
      });

      reply.header("Cache-Control", "no-store");
      return reply.code(200).send(
        ok(
          { requestId: r.id, verificationCode: r.code },
          { message: { key: "DEVICE_LINK_OPENED" } },
        ),
      );
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id/status",
    { schema: deviceLinkIdSchema, ...limit(60) },
    async (req, reply) => {
      const secret = req.cookies?.[POLL_COOKIE];
      if (!secret) return reply.code(401).send(fail("DEVICE_LINK_INVALID"));

      const result = await svc.claim(req.params.id, secret);

      reply.header("Cache-Control", "no-store");

      if (result.status === "approved") {
        setAuthCookies(reply, result.accessToken, result.refreshToken);
        reply.clearCookie(POLL_COOKIE, { path: POLL_COOKIE_PATH });
        return reply.send(
          ok({ status: "approved" }, { message: { key: "LOGIN_SUCCESS" } }),
        );
      }

      return reply.send(ok({ status: result.status }));
    },
  );
}