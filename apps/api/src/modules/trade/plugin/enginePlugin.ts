// plugins/engine.ts

import { MatchingEngine } from "@/engine";
import fp from "fastify-plugin";

export default fp(async (fastify) => {
  const engine = new MatchingEngine();

  fastify.decorate("engine", engine);
});
