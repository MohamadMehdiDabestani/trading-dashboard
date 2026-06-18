import { FastifyInstance } from "fastify";
import { TradeService } from "../application/trade.service";
import { DrizzleTradeUnitOfWork } from "../infrastructure/unitOfWork/drizzleUnitOfWork";
import { MatchPersistenceService } from "../application/match-persistence.service";
import { OrderReadRepository } from "../infrastructure/repositories/order.repository";
import { tradeRoutes } from "../presentation/trade.route";

export async function tradePlugin(fastify: FastifyInstance) {
  const uow = new DrizzleTradeUnitOfWork(fastify.db);

  const orderReadRepository = new OrderReadRepository(fastify.db);

  const matchPersistence = new MatchPersistenceService(uow);

  const tradeService = new TradeService(
    uow,
    orderReadRepository,
    fastify.engine,
    fastify.eventBus,
    matchPersistence,
  );

  fastify.decorate("tradeService", tradeService);

  await fastify.register(tradeRoutes, {
    prefix: "/trade",
  });
}
