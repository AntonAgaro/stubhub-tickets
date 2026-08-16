import type { FastifyServerOptions } from 'fastify';
import { type ConnectionStates, createConnection } from 'mongoose';

import { buildApp } from './app.js';
import { createNoteModel } from './modules/notes/note.model.js';
import { MongooseNoteRepository } from './modules/notes/note.repository.js';
import { DefaultNoteService } from './modules/notes/note.service.js';

const MONGODB_CONNECTED_READY_STATE: ConnectionStates.connected = 1;

export interface CreateApplicationOptions {
  mongodbUri: string;
  autoIndex: boolean;
  openapiEnabled: boolean;
  swaggerUiEnabled?: boolean;
  corsOrigins: string[];
  logger?: FastifyServerOptions['logger'];
}

export async function createApplication(options: CreateApplicationOptions) {
  const connection = await createConnection(options.mongodbUri, { autoIndex: options.autoIndex }).asPromise();
  const noteModel = createNoteModel(connection);
  const noteRepository = new MongooseNoteRepository(noteModel);
  const noteService = new DefaultNoteService(noteRepository);

  try {
    const app = buildApp({
      noteService,
      openapiEnabled: options.openapiEnabled,
      corsOrigins: options.corsOrigins,
      isReady: () => connection.readyState === MONGODB_CONNECTED_READY_STATE,
      ...(options.logger === undefined ? {} : { logger: options.logger }),
      ...(options.swaggerUiEnabled === undefined ? {} : { swaggerUiEnabled: options.swaggerUiEnabled }),
    });
    app.addHook('onClose', async () => connection.close());
    await app.ready();
    return app;
  } catch (error) {
    await connection.close();
    throw error;
  }
}
