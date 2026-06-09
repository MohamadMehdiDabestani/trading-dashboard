import { WalletDepositDto } from "./../../../../node_modules/@repo/types/src/dtoTypes/walletDTO.types";
import { ok } from "@/utils/apiResponse";
import {
  APIResult,
  PaginatedResult,
  WalletAssetReply,
  WalletGetReply,
} from "@repo/types";
import Big from "big.js";
import { FastifyInstance } from "fastify";
import { walletDepositSchema } from "./DTO";
import { AppError } from "@/errors/appError";

export async function walletRoutes(fastify: FastifyInstance) {
  const walletService = fastify.walletService;

  fastify.get<{ Reply: APIResult<WalletGetReply[]> }>(
    "/get",
    async (req, reply) => {
      const user = req.user;
      const res = await walletService.getBalance(user.sub);

      return reply.code(200).send(ok(res));
    },
  );

  fastify.get<{
    Params: { asset: string };
    Reply: APIResult<WalletAssetReply>;
    Querystring: { page?: string; pageSize?: string };
  }>("/asset/:asset", async (req, reply) => {
    const { asset } = req.params;
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = Math.min(
      Math.max(Number(req.query.pageSize ?? 20), 1),
      100,
    );

    const res = await walletService.getSingleAssest(
      req.user.sub,
      asset,
      page,
      pageSize,
    );
    return reply.code(200).send(ok(res));
  });

  fastify.post<{
    Body: WalletDepositDto;
    Reply: APIResult<any>;
  }>(
    "/deposit",
    {
      schema: walletDepositSchema,
    },
    async (req, reply) => {
      const { asset, amount } = req.body;

      const bigAmount = new Big(amount);

      if (bigAmount.lte(0)) {
        throw new AppError("WALLET_INVALID_AMOUNT");
      }

      const res = await walletService.deposit(req.user.sub, asset, bigAmount);
      return reply.code(200).send(ok(res));
    },
  );
}
