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
  OrderStatus,
  OrderSortField,
  SortDirection,
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
          request.body;

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
          return reply.code(error.statusCode).send(fail(error.code));
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
          return reply.code(error.statusCode).send(fail(error.code));
        }

        return reply.code(500).send(fail("INTERNAL_SERVER_ERROR"));
      }
    },
  );

  fastify.get<{
    Querystring: {
      page?: string;
      pageSize?: string;
      status?: OrderStatus;
      symbol: string;
      sortBy?: OrderSortField;
      sortOrder?: SortDirection;
    };
    Reply: APIResult<GetRecentTradesReply>;
  }>(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: getRecentTradeSchema,
    },
    async (req, reply) => {
      try {
        const userId = req.user.sub;
        const {
          symbol,
          status,
          page = 1,
          pageSize = 20,
          sortBy,
          sortOrder,
        } = req.query;
        const data = await tradeService.getRecentOrders({
          symbol : symbol.toUpperCase(),
          userId,
          status,
          page: Math.max(1, Number(page) || 1),
          pageSize: Math.min(100, Math.max(1, Number(pageSize) || 20)),
          sortBy,
          sortOrder,
        });

        return reply.status(200).send(ok(data));
      } catch (error: any) {
        req.log.error(error);

        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(fail(error.code));
        }

        return reply.status(500).send(fail("INTERNAL_SERVER_ERROR"));
      }
    },
  );
}