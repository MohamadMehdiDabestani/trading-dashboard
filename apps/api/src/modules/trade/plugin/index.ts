import { FastifyInstance } from "fastify";
import { TradeRepositoryDrizzle } from "../infrastructure/repositories/trade.drizzle";
import { TradeService } from "../application/trade.service";
import { tradeRoutes } from "../presentation/trade.route";

export async function tradePlugin(fastify: FastifyInstance) {
  const tradeRepo = new TradeRepositoryDrizzle(
    fastify.db,
    fastify.engine,
    fastify.eventBus,
  );

  const tradeService = new TradeService(tradeRepo);
  fastify.addHook("preHandler", fastify.authenticate);
  fastify.decorate("tradeService", tradeService);
  await fastify.register(tradeRoutes, {
    prefix: "/trade",
  });
}
