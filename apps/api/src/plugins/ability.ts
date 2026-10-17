import { AppAbility, defineAbilityFor, Role } from "@repo/casl";
import fp from "fastify-plugin";

export default fp(
  async (app) => {
    app.decorateRequest("ability", null as unknown as AppAbility);

    app.addHook("onRequest", async (req) => {
      let userId: string | null = null;
      try {
        await req.jwtVerify();
        userId = req.user.sub;
      } catch {
        // guest
      }
      req.ability = defineAbilityFor(
        userId ? { id: userId, role: Role.User } : null,
      );
    });
  },
  {
    name: "ability",
  },
);
