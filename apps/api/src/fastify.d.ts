import "fastify";
import "@fastify/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./modules/auth/application/auth.service";
import { WalletService } from "./modules/wallet/application/wallet.service";
import { JwtPayload } from "@repo/types";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authService: AuthService;
    walletService: WalletService;
  }
}
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload
    
  }
}