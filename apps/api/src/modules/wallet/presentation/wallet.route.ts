import { ok } from "@/utils/apiResponse";
import {
  APIResult,
  WalletAssetReply,
  WalletDepositDto,
  WalletGetReply,
  LedgerEntryType,
  WalletTrendRange,
  WalletTrendReply,
} from "@repo/types";
import Big from "big.js";
import { FastifyInstance } from "fastify";
import {
  walletAssetSchema,
  walletDepositSchema,
  walletTrendSchema,
} from "./DTO";
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
    Querystring: {
      page?: string;
      pageSize?: string;
      period?: WalletTrendRange;
      type?: LedgerEntryType[];
    };
  }>("/asset/:asset", { schema: walletAssetSchema }, async (req, reply) => {
    const { asset } = req.params;

    const page = Math.max(Number(req.query.page ?? 1), 1);

    const pageSize = Math.min(
      Math.max(Number(req.query.pageSize ?? 20), 1),
      100,
    );

    const res = await walletService.getSingleAsset(
      req.user.sub,
      asset,
      page,
      pageSize,
      { period: req.query.period, types: req.query.type },
    );

    return reply.code(200).send(ok(res));
  });

  // روند موجودی یک دارایی بر اساس ledger
  fastify.get<{
    Params: { asset: string };
    Querystring: { range?: WalletTrendRange };
    Reply: APIResult<WalletTrendReply>;
  }>(
    "/asset/:asset/trend",
    { schema: walletTrendSchema },
    async (req, reply) => {
      const res = await walletService.getTrend(
        req.user.sub,
        req.params.asset.toUpperCase(),
        req.query.range ?? "1M",
      );
      return reply.code(200).send(ok(res));
    },
  );

  fastify.post<{
    Body: WalletDepositDto;
    Reply: APIResult<void>;
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

      await walletService.deposit(req.user.sub, asset, bigAmount);

      return reply.code(200).send(ok(undefined));
    },
  );
}