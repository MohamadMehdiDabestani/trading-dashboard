import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { createDb, type Db } from "@repo/db";

declare module "fastify" {
  interface FastifyInstance {
    db: Db;
  }
}

export default fp(async function dbPlugin(fastify: FastifyInstance) {
  const db = createDb(process.env.DATABASE_URL!);
  fastify.decorate("db", db);
}, {
  name: "db",
});
