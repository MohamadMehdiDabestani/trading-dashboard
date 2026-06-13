// plugins/eventBus.ts

import { MarketEventBus } from "@/utils/eventBus";
import fp from "fastify-plugin";

export default fp(async (fastify) => {
  const bus = new MarketEventBus();

  fastify.decorate("eventBus", bus);
});
