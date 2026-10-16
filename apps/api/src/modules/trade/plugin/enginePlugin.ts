
import { engine } from "@/engine";
import fp from "fastify-plugin";

export default fp(async (fastify) => {

  fastify.decorate("engine", engine);
});
