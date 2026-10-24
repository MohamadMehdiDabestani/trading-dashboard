import { AbilityUser, AppAbility, defineAbilityFor } from "@repo/casl";
import fp from "fastify-plugin";

export default fp(
  async (app) => {
    app.decorateRequest("ability", null as unknown as AppAbility);

    app.addHook("onRequest", async (req) => {
      let user: AbilityUser | null = null;
      try {
        await req.jwtVerify();
        user = { id: req.user.sub, role : req.user.role};
      } catch {}
      req.ability = defineAbilityFor(user);
    });
  },
  {
    name: "ability",
  },
);
