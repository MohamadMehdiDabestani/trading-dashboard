import fp from "fastify-plugin";
import { DrizzleUserRepository } from "../infrastructure/repositories/drizzle.user.repository";
import { OtpServiceImpl } from "../infrastructure/services/otp.service.imp";
import { TokenServiceImpl } from "../infrastructure/services/token.service.impl";
import { AuthService } from "../application/auth.service";
import { authRoutes } from "../presentation/auth.route";
import { DeviceLinkServiceImpl } from "../infrastructure/services/device.service.impl";
import { deviceLinkRoutes } from "../presentation/deviceLink.route";
import { meRoutes } from "../presentation/me.route";

export const authPlugin = fp(async (fastify) => {
  const userRepo = new DrizzleUserRepository(fastify.db);

  const otpService = new OtpServiceImpl(fastify.db, fastify.sms);

  const tokenService = new TokenServiceImpl(fastify.db, fastify.jwt);
  const deviceLinkService = new DeviceLinkServiceImpl(
    fastify.db,
    tokenService,
    userRepo,
  );

  fastify.decorate("deviceLinkService", deviceLinkService);
  const authService = new AuthService(userRepo, otpService, tokenService);

  fastify.decorate("authService", authService);

  await fastify.register(authRoutes, { prefix: "/auth" });
  await fastify.register(meRoutes);
  await fastify.register(deviceLinkRoutes, {
    prefix: "/auth/device-link",
    onOpened: (e) => {
      // اینجا اعلان realtime به دستگاه ۱ بفرست (بخش ۴ را ببین)
    },
  });
  const purge = setInterval(
    () => deviceLinkService.purgeExpired().catch(() => {}),
    10 * 60_000,
  );
  fastify.addHook("onClose", async () => clearInterval(purge));

  const tokenPurge = setInterval(
    () =>
      tokenService
        .purgeStale()
        .catch((err) => fastify.log.error({ err }, "token purge failed")),
    10 * 60_000,
  );
  tokenPurge.unref();
  fastify.addHook("onClose", async () => clearInterval(tokenPurge));
});
