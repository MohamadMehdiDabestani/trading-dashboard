import type { FastifyError, FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { AppError } from "@/errors/appError";
import { parseValidationErrors } from "@/utils/validationError";
import { fail } from "@/utils/apiResponse";

export default fp(async function (fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, _req, reply) => {
    if (error instanceof AppError) {
      console.log("==========" , error.params) //  undefined
      return reply
      .status(error.statusCode)
      .send(
        fail(error.code,  error.params, undefined, undefined),
      );
    }
    
    if (error.validation) {
      return reply
        .status(422)
        .send(
          fail(
            "VALIDATION_ERROR",
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
          "VALIDATION_ERROR",
          undefined,
          undefined,
          undefined,
        ),
      );
  });
});
