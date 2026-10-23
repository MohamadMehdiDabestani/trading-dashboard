import "fastify";
import "@fastify/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./modules/auth/application/auth.service";
import { WalletService } from "./modules/wallet/application/wallet.service";
import { JwtPayload } from "@repo/types";
import { MatchingEngine } from "./engine";
import { MarketEventBus } from "./utils/eventBus";
import { TradeService } from "./modules/trade/application/trade.service";
import type { MarketMaker } from "@/modules/trade/marketMaker/marketMaker";
import { AppAbility } from "@repo/casl";
import { DeviceLinkServiceImpl } from "./modules/auth/infrastructure/services/device.service.impl";
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authService: AuthService;
    deviceLinkService: DeviceLinkServiceImpl;
    walletService: WalletService;
    engine: MatchingEngine;
    eventBus: MarketEventBus;
    tradeService: TradeService;
    marketMaker: MarketMaker | null;
  }
  interface FastifyRequest {
    ability: AppAbility;
  }
}
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
  }
}
