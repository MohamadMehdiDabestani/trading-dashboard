import { FastifyInstance } from "fastify";
import { WalletDrizzleRepository } from "../infrastructure/repositories/wallet.drizzle.repository";
import { WalletService } from "../application/wallet.service";
import { walletRoutes } from "../presentation/wallet.route";

export async function walletPlugin(fastify: FastifyInstance) {
  const walletRepo = new WalletDrizzleRepository(fastify.db);

  const walletService = new WalletService(walletRepo);
  fastify.addHook("preHandler", fastify.authenticate);
  fastify.decorate("walletService", walletService);
  await fastify.register(walletRoutes, {
    prefix: "/wallet",
  });
}
