import Fastify from "fastify";
import { engine } from "./engine";

const app = Fastify({
  logger: true,
});

app.get("/health", async () => {
  return { status: "ok" };
});

const schema = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          hello: {
            type: 'string'
          }
        }
      }
    }
  }
}
app.get('/', schema, function (_req, reply) {
  reply.send({ hello: 'world' })
})


// ALL OF THESE CODES ARE UNDER TEST ...

// وقتی order می‌رسه این sequence اجرا میشه:
// async function handleNewOrder(input: NewOrderInput, db: Db) {
//   // 1. Validate + lock balance (در DB)
//   // await lockBalance(db, input.userId, input.asset, input.amount);

//   // 2. ثبت order در DB با status = "open"
//   // const [order] = await db.insert(orders).values({...}).returning();

//   // 3. به engine بده
//   const result = engine.submitOrder(toEngineOrder(order));

//   // 4. همه trade ها و status update ها را در یک transaction ذخیره کن
//   await db.transaction(async (tx) => {
//     for (const trade of result.trades) {
//       await tx.insert(trades).values(fromEngineTrade(trade));
//       await settleBalances(tx, trade);
//     }
//     for (const update of result.filledOrders) {
//       await tx.update(orders)
//         .set({ filledQuantity: update.filledQty.toString(), status: update.status })
//         .where(eq(orders.id, update.orderId));
//     }
//   });

//   return result;
// }

const start = async () => {
  try {
    await app.listen({ port: 4000, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
