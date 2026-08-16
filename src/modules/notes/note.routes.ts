import { Type, type FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox';

import { ProblemDetailsSchema } from '../../errors/problem-details.js';
import {
  CreateNoteBodySchema,
  ListNotesQuerySchema,
  NoteIdParamsSchema,
  NoteListSchema,
  NoteSchema,
  UpdateNoteBodySchema,
} from './note.schemas.js';
import type { NoteService } from './note.service.js';

interface NotesRoutesOptions {
  noteService: NoteService;
}

export const notesRoutes: FastifyPluginCallbackTypebox<NotesRoutesOptions> = (app, options, done) => {
  app.post(
    '',
    {
      schema: {
        operationId: 'createNote',
        tags: ['notes'],
        body: CreateNoteBodySchema,
        response: {
          201: NoteSchema,
          400: ProblemDetailsSchema,
        },
      },
    },
    async (request, reply) => {
      const note = await options.noteService.create(request.body);

      return reply.code(201).header('location', `/v1/notes/${note.id}`).send(note);
    }
  );

  app.get(
    '',
    {
      schema: {
        operationId: 'listNotes',
        tags: ['notes'],
        querystring: ListNotesQuerySchema,
        response: {
          200: NoteListSchema,
          400: ProblemDetailsSchema,
        },
      },
    },
    async (request) => {
      const limit = request.query.limit ?? 20;
      const input = request.query.after ? { limit, after: request.query.after } : { limit };
      return options.noteService.list(input);
    }
  );

  app.get(
    '/:id',
    {
      schema: {
        operationId: 'getNote',
        tags: ['notes'],
        params: NoteIdParamsSchema,
        response: {
          200: NoteSchema,
          400: ProblemDetailsSchema,
          404: ProblemDetailsSchema,
        },
      },
    },
    async (request) => options.noteService.findById(request.params.id)
  );

  app.patch(
    '/:id',
    {
      schema: {
        operationId: 'updateNote',
        tags: ['notes'],
        params: NoteIdParamsSchema,
        body: UpdateNoteBodySchema,
        response: {
          200: NoteSchema,
          400: ProblemDetailsSchema,
          404: ProblemDetailsSchema,
          409: ProblemDetailsSchema,
        },
      },
    },
    async (request) => options.noteService.update(request.params.id, request.body)
  );

  app.delete(
    '/:id',
    {
      schema: {
        operationId: 'deleteNote',
        tags: ['notes'],
        params: NoteIdParamsSchema,
        response: {
          204: Type.Null(),
          400: ProblemDetailsSchema,
          404: ProblemDetailsSchema,
        },
      },
    },
    async (request, reply) => {
      await options.noteService.delete(request.params.id);
      return reply.code(204).send(null);
    }
  );

  done();
};
