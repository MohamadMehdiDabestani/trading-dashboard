import type { FastifyInstance } from "fastify";
import { ok } from "@/utils/apiResponse";
import { SYMBOLS, type APIResult, type MarketPricesReply } from "@repo/types";

export async function marketPlugin(fastify: FastifyInstance) {
  fastify.get<{ Reply: APIResult<MarketPricesReply> }>(
    "/prices",
    async (_req, reply) => {
      const prices: MarketPricesReply = { USDT: "1" };
      for (const s of SYMBOLS) {
        if (s.quoteAsset !== "USDT") continue;
        const p = fastify.priceFeed.get(s.value);
        if (p) prices[s.baseAsset] = p;
      }
      return reply.code(200).send(ok(prices));
    },
  );
}