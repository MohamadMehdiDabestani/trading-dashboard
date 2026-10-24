import type { FastifyInstance } from "fastify";
import { ok } from "@/utils/apiResponse";
import type { APIResult, MeReply } from "@repo/types";

export async function meRoutes(fastify: FastifyInstance) {
  fastify.get<{ Reply: APIResult<MeReply> }>(
    "/me",
    {
      preHandler: [fastify.authenticate],
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    },
    async (req, reply) => {
      const data = await fastify.authService.getMe(req.user.sub);
      // پاسخ به role بستگی دارد؛ کش عمومی ممنوع، کش خصوصی هم حداکثر تا refresh بعدی
      reply.header("Cache-Control", "private, no-store");
      return reply.send(ok(data));
    },
  );
}