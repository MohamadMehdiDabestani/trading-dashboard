import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { ok, fail } from "@/utils/apiResponse";
import { parseToScaledBigInt } from "@/utils/scaleBigInt";
import {
  cancelOrderSchema,
  createOrderSchema,
  getRecentTradeSchema,
} from "./DTO";
import {
  APIResult,
  CancelOrderDTO,
  CancelOrderReply,
  CreateOrderDTO,
  CreateOrderReply,
  GetRecentTradesReply,
} from "@repo/types";

export async function tradeRoutes(fastify: FastifyInstance) {
  const tradeService = fastify.tradeService;

  fastify.post<{
    Reply: APIResult<CreateOrderReply>;
    Body: CreateOrderDTO;
  }>(
    "/new",
    {
      onRequest: [fastify.authenticate],
      schema: createOrderSchema,
    },
    async (request, reply) => {
      try {
        const userId = request.user.sub;
        const { symbol, baseAsset, quoteAsset, side, type, quantity, price } =
          request.body as any;
        const BigIntQty = parseToScaledBigInt(quantity);
        const BigIntPrice = type === "limit" ? parseToScaledBigInt(price) : 0n;

        const { orderId, matchResult } = await tradeService.createOrder(
          userId,
          symbol,
          baseAsset,
          quoteAsset,
          side,
          type,
          BigIntPrice,
          BigIntQty,
        );

        return reply.code(201).send(
          ok({
            orderId,
            status:
              matchResult.updates.find((u) => u.orderId === orderId)?.status ||
              "open",
          }),
        );
      } catch (error: any) {
        fastify.log.error(error);
        if (error.message === "INSUFFICIENT_BALANCE") {
          return reply.code(400).send(fail("OTP_INVALID"));
        }
        return reply.code(500).send(fail("INTERNAL_SERVER_ERROR"));
      }
    },
  );

  fastify.delete<{
    Body: CancelOrderDTO;
    Reply: APIResult<CancelOrderReply>;
  }>(
    "/cancel",
    {
      onRequest: [fastify.authenticate],
      schema: cancelOrderSchema,
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { symbol, orderId } = request.body;

      await tradeService.cancelOrder(userId, symbol, orderId);
      return reply.send(ok("ORDER_CANCELLED_SUCCESSFULLY"));
    },
  );

  fastify.get<{
    Querystring: { page?: string; pageSize?: string };
    Params: { symbol: string };
    Reply: APIResult<GetRecentTradesReply>;
  }>("/:symbol", {
    // schema: getRecentTradeSchema,

    handler: async (req, reply) => {
      try {
        const page = Math.max(Number(req.query.page ?? 1), 1);
        const pageSize = Math.min(
          Math.max(Number(req.query.pageSize ?? 20), 1),
          100,
        );
        const user = req.user;
        const { symbol } = req.params;
        const data = await tradeService.getRecentOrders(
          symbol,
          user.sub,
          page,
          pageSize,
        );
        return reply.status(200).send(ok(data));
      } catch (error) {
        req.log.error(error);
        return reply.status(500).send(fail("AUTH_FAIL"));
      }
    },
  });
}
