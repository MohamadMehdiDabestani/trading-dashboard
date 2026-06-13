import "fastify";
import "@fastify/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./modules/auth/application/auth.service";
import { WalletService } from "./modules/wallet/application/wallet.service";
import { JwtPayload } from "@repo/types";
import { MatchingEngine } from "./engine";
import { MarketEventBus } from "./utils/eventBus";
import { TradeService } from "./modules/trade/application/trade.service";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authService: AuthService;
    walletService: WalletService;
    engine: MatchingEngine;
    eventBus: MarketEventBus;
    tradeService : TradeService
  }
}
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
  }
}
