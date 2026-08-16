import { Type } from '@fastify/type-provider-typebox';
import type { FastifyError, FastifyInstance } from 'fastify';

import { ApplicationError } from './application-error.js';

export const ProblemDetailsSchema = Type.Object(
  {
    type: Type.String(),
    title: Type.String(),
    status: Type.Integer(),
    detail: Type.String(),
    instance: Type.String(),
    requestId: Type.String(),
  },
  { additionalProperties: false }
);

function validationError(error: FastifyError): ApplicationError {
  return new ApplicationError({
    type: 'urn:problem-type:validation',
    title: 'Request validation failed',
    status: 400,
    detail: error.message,
  });
}

function isFastifyValidationError(error: unknown): error is FastifyError {
  return typeof error === 'object' && error !== null && 'validation' in error && Array.isArray(error.validation);
}

export function registerProblemDetailsHandlers(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    const applicationError =
      error instanceof ApplicationError ? error : isFastifyValidationError(error) ? validationError(error) : undefined;

    if (!applicationError) {
      request.log.error({ err: error }, 'Unexpected request error');
    }

    const problem =
      applicationError ??
      new ApplicationError({
        type: 'about:blank',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
      });

    return reply
      .type('application/problem+json')
      .code(problem.status)
      .send({
        type: problem.type,
        title: problem.title,
        status: problem.status,
        detail: problem.message,
        instance: request.url,
        requestId: String(request.id),
      });
  });
}
