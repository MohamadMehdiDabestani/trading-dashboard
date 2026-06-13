import { config } from "dotenv";
config();
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import dbPlugin from "./plugins/db";
import smsPlugin from "./plugins/sms";
import errorHandlerPlugin from "./plugins/errorHandler";
import { authPlugin } from "./modules/auth/plugin";
import { fail } from "./utils/apiResponse";
import { walletPlugin } from "./modules/wallet/plugin";
import engine from "./modules/trade/plugin/enginePlugin";
import eventBus from "./modules/trade/plugin/eventBus";
import ws from "./modules/trade/plugin/ws";

import { orders } from "@repo/db";
import { and, asc, inArray } from "drizzle-orm";
import { EngineOrder } from "@repo/types";
import {
  dbDecimalToScaledBigInt,
} from "./utils/scaleBigInt";
import { tradePlugin } from "./modules/trade/plugin";
const app = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
        singleLine: true,
      },
    },
  },
});

await app.register(errorHandlerPlugin);
await app.register(dbPlugin);

await app.register(cookie);

await app.register(jwt, {
  secret: process.env.JWT_SECRET!,
});
await app.register(smsPlugin);

app.decorate("authenticate", async function (req: any, reply: any) {
  try {
    await req.jwtVerify();
  } catch {
    reply.code(401).send(fail("UNAUTHORIZED"));
  }
});

app.register(engine);
app.register(eventBus);
app.register(ws);
app.addHook("onReady", async () => {
  app.log.info("Bootstrapping active orders into engine...");

  const dbOrders = await app.db
    .select()
    .from(orders)
    .where(and(inArray(orders.status, ["open", "partial"])))
    .orderBy(asc(orders.createdAt));

  const activeOrders: EngineOrder[] = dbOrders.map((o) => ({
    id: o.id,
    userId: o.userId,
    symbol: o.symbol,
    side: o.side, // "buy" | "sell"
    type: o.type, // "limit"
    price: dbDecimalToScaledBigInt(o.price ?? 0),
    quantity: dbDecimalToScaledBigInt(o.quantity),
    filled: dbDecimalToScaledBigInt(o.filledQuantity),
    timestamp: o.createdAt.getTime(),
  }));

  app.engine.bootstrapActiveOrders(activeOrders);
  app.engine.logActiveOrders();

  app.log.info(`Bootstrapped ${activeOrders.length} active orders.`);
});

app.get("/health", async () => {
  return { status: "ok" };
});
await app.register(authPlugin);

await app.register(walletPlugin);

app.register(tradePlugin);
app.post("/admin/engine/log-active-orders", async (req, reply) => {
  app.engine.logActiveOrders();
  return { ok: true };
});
const start = async () => {
  try {
    await app.listen({ port: 4000, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
