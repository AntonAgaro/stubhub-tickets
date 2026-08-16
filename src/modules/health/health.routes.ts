import { type FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox';

import { LiveHealthSchema, ReadyHealthSchema, UnavailableHealthSchema } from './health.schemas.js';

interface HealthRoutesOptions {
  isReady: () => boolean;
}

export const healthRoutes: FastifyPluginCallbackTypebox<HealthRoutesOptions> = (app, options, done) => {
  app.get(
    '/live',
    {
      schema: {
        operationId: 'getLiveness',
        tags: ['health'],
        response: {
          200: LiveHealthSchema,
        },
      },
    },
    () => ({ status: 'ok' as const })
  );

  app.get(
    '/ready',
    {
      schema: {
        operationId: 'getReadiness',
        tags: ['health'],
        response: {
          200: ReadyHealthSchema,
          503: UnavailableHealthSchema,
        },
      },
    },
    async (_request, reply) => {
      if (!options.isReady()) {
        return reply.code(503).send({ status: 'unavailable' });
      }
      return reply.code(200).send({ status: 'ready' });
    }
  );

  done();
};
