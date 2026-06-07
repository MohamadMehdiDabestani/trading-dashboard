import "fastify";
import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./modules/auth/application/auth.service";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authService: AuthService;
  }
}
