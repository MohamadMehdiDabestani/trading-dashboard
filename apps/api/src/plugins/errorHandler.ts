import type { FastifyError, FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { AppError } from "@/errors/appError";
import { parseValidationErrors } from "@/utils/validationError";
import { fail } from "@/utils/apiResponse";
import type { AllErrorCode } from "@repo/types";

const STATUS_TO_CODE: Record<number, AllErrorCode> = {
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  429: "RATE_LIMIT",
};

export default fp(async function (fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, req, reply) => {
    const meta = { requestId: req.id };

    if (error instanceof AppError) {
      return reply
        .status(error.statusCode)
        .send(fail(error.code, error.params, meta));
    }

    if (error.validation) {
      const fields = parseValidationErrors(error.validation);
      return reply
        .status(422)
        .send(fail("VALIDATION_ERROR", undefined, meta, fields));
    }

    const status = error.statusCode ?? 500;
    if (status < 500) {
      // خطاهای Fastify/پلاگین‌ها: rate-limit، JSON خراب، body بزرگ و...
      const code = STATUS_TO_CODE[status] ?? "BAD_REQUEST";
      return reply.status(status).send(fail(code, undefined, meta));
    }

    req.log.error({ err: error }, "unhandled error");
    return reply.status(500).send(fail("INTERNAL_SERVER_ERROR", undefined, meta));
  });

  fastify.setNotFoundHandler((req, reply) =>
    reply.status(404).send(fail("NOT_FOUND", undefined, { requestId: req.id })),
  );
});