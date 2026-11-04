import fp from "fastify-plugin";
import { DrizzleUserRepository } from "../infrastructure/repositories/drizzle.user.repository";
import { OtpServiceImpl } from "../infrastructure/services/otp.service.imp";
import { TokenServiceImpl } from "../infrastructure/services/token.service.impl";
import { AuthService } from "../application/auth.service";
import { authRoutes } from "../presentation/auth.route";
import { DeviceLinkServiceImpl } from "../infrastructure/services/device.service.impl";
import { deviceLinkRoutes } from "../presentation/deviceLink.route";
import { meRoutes } from "../presentation/me.route";
import { LoginHistoryService } from "../infrastructure/services/loginHistory.service.impl";

export const authPlugin = fp(async (fastify) => {
  const userRepo = new DrizzleUserRepository(fastify.db);
  const otpService = new OtpServiceImpl(fastify.db, fastify.sms);
  const tokenService = new TokenServiceImpl(fastify.db, fastify.jwt);
  const historyService = new LoginHistoryService(fastify.db, fastify.log);

  const deviceLinkService = new DeviceLinkServiceImpl(
    fastify.db,
    tokenService,
    userRepo,
    historyService,
  );
  fastify.decorate("deviceLinkService", deviceLinkService);

  const authService = new AuthService(userRepo, otpService, tokenService, historyService);
  fastify.decorate("authService", authService);

  await fastify.register(authRoutes, { prefix: "/auth" });
  await fastify.register(meRoutes);
  await fastify.register(deviceLinkRoutes, {
    prefix: "/auth/device-link",
    onOpened: (e) => {
      // realtime notification to device 1
    },
  });

  const every10min = (name: string, fn: () => Promise<unknown>) => {
    const id = setInterval(
      () => fn().catch((err) => fastify.log.error({ err }, `${name} purge failed`)),
      10 * 60_000,
    );
    id.unref();
    fastify.addHook("onClose", async () => clearInterval(id));
  };

  every10min("device-link", () => deviceLinkService.purgeExpired());
  every10min("token", () => tokenService.purgeStale());
  every10min("login-history", () => historyService.purgeOld(180));
});