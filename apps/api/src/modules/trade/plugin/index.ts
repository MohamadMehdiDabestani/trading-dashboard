import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

import { TradeService } from "../application/trade.service";
import { DrizzleTradeUnitOfWork } from "../infrastructure/unitOfWork/drizzleUnitOfWork";
import { MatchPersistenceService } from "../application/match-persistence.service";
import { OrderReadRepository } from "../infrastructure/repositories/order.repository";
import { tradeRoutes } from "../presentation/trade.route";
import { MarketMaker } from "../marketMaker/marketMaker";

export const tradePlugin = fp(async (fastify: FastifyInstance) => {
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

  // Market maker: ساخته می‌شود ولی start آن در onReady سرور، بعد از bootstrap انجام می‌شود
  let marketMaker: MarketMaker | null = null;

  if (process.env.MARKET_MAKER_ENABLED === "true") {
    const mmUserId = process.env.MARKET_MAKER_USER_ID;
    if (!mmUserId) throw new Error("MARKET_MAKER_USER_ID is required");

    marketMaker = new MarketMaker(mmUserId, tradeService, fastify.engine);
    fastify.addHook("onClose", async () => marketMaker?.stop());
  }

  fastify.decorate("marketMaker", marketMaker);

  await fastify.register(tradeRoutes, { prefix: "/trade" });
});