import { FastifyInstance } from "fastify";
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
import { AppError } from "@/errors/appError";

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

        const bigIntQty = parseToScaledBigInt(quantity);

        const bigIntPrice = type === "limit" ? parseToScaledBigInt(price) : 0n;

        const { orderId, matchResult } = await tradeService.createOrder(
          userId,
          symbol,
          baseAsset,
          quoteAsset,
          side,
          type,
          bigIntPrice,
          bigIntQty,
        );

        const status =
          matchResult.updates.find((u) => u.orderId === orderId)?.status ||
          "open";

        return reply.code(201).send(
          ok({
            orderId,
            status,
          }),
        );
      } catch (error: any) {
        fastify.log.error(error);

        if (error instanceof AppError) {
          const mapped = mapAppErrorToHttp(error);
          return reply.code(mapped.statusCode).send(fail(mapped.code));
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
      try {
        const userId = request.user.sub;
        const { symbol, orderId } = request.body;

        await tradeService.cancelOrder(userId, symbol, orderId);

        return reply.send(
          ok("", { message: { key: "ORDER_CANCELLED_SUCCESSFULLY" } }),
        );
      } catch (error: any) {
        request.log.error(error);

        if (error instanceof AppError) {
          const mapped = mapAppErrorToHttp(error);
          return reply.code(mapped.statusCode).send(fail(mapped.code));
        }

        return reply.code(500).send(fail("INTERNAL_SERVER_ERROR"));
      }
    },
  );

  fastify.get<{
    Querystring: {
      page?: string;
      pageSize?: string;
    };
    Params: {
      symbol: string;
    };
    Reply: APIResult<GetRecentTradesReply>;
  }>(
    "/:symbol",
    {
      onRequest: [fastify.authenticate],
      schema: getRecentTradeSchema,
    },
    async (req, reply) => {
      try {
        const page = Number(req.query.page ?? 1);
        const pageSize = Number(req.query.pageSize ?? 20);

        const userId = req.user.sub;
        const { symbol } = req.params;

        const data = await tradeService.getRecentOrders(
          symbol,
          userId,
          page,
          pageSize,
        );

        return reply.status(200).send(ok(data));
      } catch (error: any) {
        req.log.error(error);

        if (error instanceof AppError) {
          const mapped = mapAppErrorToHttp(error);
          return reply.code(mapped.statusCode).send(fail(mapped.code));
        }

        return reply.status(500).send(fail("INTERNAL_SERVER_ERROR"));
      }
    },
  );
}
