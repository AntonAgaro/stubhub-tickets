import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastify, { type FastifyServerOptions } from 'fastify';

import { registerProblemDetailsHandlers } from './errors/problem-details.js';
import { notesRoutes } from './modules/notes/note.routes.js';
import type { NoteService } from './modules/notes/note.service.js';

export interface BuildAppOptions {
  noteService: NoteService;
  logger?: FastifyServerOptions['logger'];
  openapiEnabled?: boolean;
  swaggerUiEnabled?: boolean;
  corsOrigins?: string[];
}

export function buildApp(options: BuildAppOptions) {
  const app = fastify({ logger: options.logger ?? true }).withTypeProvider<TypeBoxTypeProvider>();

  registerProblemDetailsHandlers(app);

  app.register(helmet);

  if (options.corsOrigins && options.corsOrigins.length > 0) {
    app.register(cors, {
      credentials: false,
      origin: options.corsOrigins.includes('*') ? '*' : options.corsOrigins,
    });
  }

  if (options.openapiEnabled) {
    app.register(swagger, {
      openapi: {
        info: {
          title: 'Fastify MongoDB service',
          version: '0.1.0',
        },
      },
    });
    app.get('/openapi.json', { schema: { hide: true } }, () => app.swagger());
    if (options.swaggerUiEnabled) {
      app.register(swaggerUi, { routePrefix: '/documentation' });
    }
  }

  app.register(notesRoutes, {
    prefix: '/v1/notes',
    noteService: options.noteService,
  });

  return app;
}
