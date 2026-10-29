import { FastifyInstance } from "fastify";
import { WalletService } from "../application/wallet.service";
import { walletRoutes } from "../presentation/wallet.route";
import { DrizzleWalletUnitOfWork } from "../infrastructure/unitOfWork/drizzleUnitOfWork";
import { WalletRepository } from "../infrastructure/repositories/wallet.repository";
import { marketPlugin } from "../presentation/market.route";


export async function walletPlugin(fastify: FastifyInstance) {
  const walletQueryRepo = new WalletRepository(fastify.db);
  const walletUow = new DrizzleWalletUnitOfWork(fastify.db);

  const walletService = new WalletService(walletQueryRepo, walletUow);

  fastify.addHook("preHandler", fastify.authenticate);
  fastify.decorate("walletService", walletService);
  fastify.register(marketPlugin, { prefix: "/market" });
  await fastify.register(walletRoutes, {
    prefix: "/wallet",
  });
}
