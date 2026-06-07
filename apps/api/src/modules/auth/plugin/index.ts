import { FastifyInstance } from "fastify";
import { DrizzleUserRepository } from "../infrastructure/repositories/drizzle.user.repository";
import { OtpServiceImpl } from "../infrastructure/services/otp.service.imp";
import { TokenServiceImpl } from "../infrastructure/services/token.service.impl";
import { AuthService } from "../application/auth.service";
import { authRoutes } from "../presentation/auth.route";

export async function authPlugin(fastify: FastifyInstance) {
  const userRepo = new DrizzleUserRepository(fastify.db);

  const otpService = new OtpServiceImpl(
    fastify.db,
    fastify.sms
  );

  const tokenService = new TokenServiceImpl(
    fastify.db,
    fastify.jwt
  );

  const authService = new AuthService(
    userRepo,
    otpService,
    tokenService
  );

  fastify.decorate("authService", authService); 

  await fastify.register(authRoutes, { prefix: "/auth" });
}
