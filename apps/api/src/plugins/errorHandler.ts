// src/plugins/errorHandler.plugin.ts
import type { FastifyError, FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { AppError } from "@/errors";
import { parseValidationErrors } from "@/utils/validationError";
import { fail } from "@/utils/apiResponse";

export default fp(async function (fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, _req, reply) => {
    if (error instanceof AppError) {
      return reply
        .status(error.statusCode)
        .send(
          fail(error.code, error.messageKey, undefined, undefined, undefined),
        );
    }

    if (error.validation) {
      return reply
        .status(422)
        .send(
          fail(
            "VALIDATION_ERROR",
            "error.validation",
            undefined,
            undefined,
            parseValidationErrors(error.validation),
          ),
        );
    }

    fastify.log.error(error);
    return reply
      .status(500)
      .send(
        fail(
          "INTERNAL_ERROR",
          "error.internal",
          undefined,
          undefined,
          undefined,
        ),
      );
  });
});
