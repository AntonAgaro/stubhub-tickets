import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../app.js';
import { NoteNotFoundError } from './note.errors.js';
import type { Note, NoteService } from './note.service.js';

const createdNote: Note = {
  id: '66bc9b91d2f94b68b8ebc001',
  slug: 'first-note',
  title: 'First note',
  content: 'Hello from Fastify',
  createdAt: '2026-08-15T10:00:00.000Z',
  updatedAt: '2026-08-15T10:00:00.000Z',
};

function createNoteService(overrides: Partial<NoteService> = {}): NoteService {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

describe('notes HTTP API', () => {
  const apps: Array<Awaited<ReturnType<typeof buildApp>>> = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map(async (app) => app.close()));
  });

  it('creates a note through the public HTTP contract', async () => {
    const noteService = createNoteService({
      create: vi.fn().mockResolvedValue(createdNote),
    });
    const app = buildApp({ noteService, logger: false });
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/notes',
      payload: {
        slug: 'first-note',
        title: 'First note',
        content: 'Hello from Fastify',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.headers.location).toBe('/v1/notes/66bc9b91d2f94b68b8ebc001');
    expect(response.json()).toEqual(createdNote);
    expect(noteService.create).toHaveBeenCalledWith({
      slug: 'first-note',
      title: 'First note',
      content: 'Hello from Fastify',
    });
  });

  it('returns problem details when a note does not exist', async () => {
    const noteId = '66bc9b91d2f94b68b8ebc099';
    const noteService = createNoteService({
      findById: vi.fn().mockRejectedValue(new NoteNotFoundError(noteId)),
    });
    const app = buildApp({ noteService, logger: false });
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: `/v1/notes/${noteId}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toEqual({
      type: 'urn:problem-type:note-not-found',
      title: 'Note not found',
      status: 404,
      detail: `No note exists with id ${noteId}.`,
      instance: `/v1/notes/${noteId}`,
      requestId: expect.any(String),
    });
  });

  it('lists notes using the public cursor contract', async () => {
    const noteService = createNoteService({
      list: vi.fn().mockResolvedValue({
        items: [createdNote],
        nextCursor: 'eyJjcmVhdGVkQXQiOiIyMDI2LTA4LTE1VDEwOjAwOjAwLjAwMFoiLCJpZCI6IjY2YmM5YjkxZDJmOTRiNjhiOGViYzAwMSJ9',
      }),
    });
    const app = buildApp({ noteService, logger: false });
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/v1/notes?limit=10&after=opaque-cursor',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      items: [createdNote],
      nextCursor: expect.any(String),
    });
    expect(noteService.list).toHaveBeenCalledWith({ limit: 10, after: 'opaque-cursor' });
  });

  it('partially updates a note', async () => {
    const updatedNote = {
      ...createdNote,
      title: 'Updated note',
      updatedAt: '2026-08-15T11:00:00.000Z',
    };
    const noteService = createNoteService({
      update: vi.fn().mockResolvedValue(updatedNote),
    });
    const app = buildApp({ noteService, logger: false });
    apps.push(app);

    const response = await app.inject({
      method: 'PATCH',
      url: `/v1/notes/${createdNote.id}`,
      payload: { title: 'Updated note' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(updatedNote);
    expect(noteService.update).toHaveBeenCalledWith(createdNote.id, { title: 'Updated note' });
  });

  it('deletes a note without a response body', async () => {
    const noteService = createNoteService({
      delete: vi.fn().mockResolvedValue(undefined),
    });
    const app = buildApp({ noteService, logger: false });
    apps.push(app);

    const response = await app.inject({
      method: 'DELETE',
      url: `/v1/notes/${createdNote.id}`,
    });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
    expect(noteService.delete).toHaveBeenCalledWith(createdNote.id);
  });

  it('publishes the OpenAPI document without enabling Swagger UI', async () => {
    const app = buildApp({
      noteService: createNoteService(),
      logger: false,
      openapiEnabled: true,
      swaggerUiEnabled: false,
    });
    apps.push(app);

    const schemaResponse = await app.inject({ method: 'GET', url: '/openapi.json' });
    const uiResponse = await app.inject({ method: 'GET', url: '/documentation/' });

    expect(schemaResponse.statusCode).toBe(200);
    expect(schemaResponse.json<{ paths: Record<string, unknown> }>().paths).toMatchObject({
      '/v1/notes': expect.any(Object),
      '/v1/notes/{id}': expect.any(Object),
    });
    expect(uiResponse.statusCode).toBe(404);
  });

  it('rejects an empty update with problem details', async () => {
    const noteService = createNoteService();
    const app = buildApp({ noteService, logger: false });
    apps.push(app);

    const response = await app.inject({
      method: 'PATCH',
      url: `/v1/notes/${createdNote.id}`,
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({
      type: 'urn:problem-type:validation',
      title: 'Request validation failed',
      status: 400,
    });
    expect(noteService.update).not.toHaveBeenCalled();
  });

  it('allows only configured CORS origins', async () => {
    const app = buildApp({
      noteService: createNoteService(),
      logger: false,
      corsOrigins: ['https://allowed.example'],
    });
    apps.push(app);

    const allowed = await app.inject({
      method: 'OPTIONS',
      url: '/v1/notes',
      headers: {
        origin: 'https://allowed.example',
        'access-control-request-method': 'POST',
      },
    });
    const denied = await app.inject({
      method: 'OPTIONS',
      url: '/v1/notes',
      headers: {
        origin: 'https://denied.example',
        'access-control-request-method': 'POST',
      },
    });

    expect(allowed.headers['access-control-allow-origin']).toBe('https://allowed.example');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('does not expose unexpected internal errors', async () => {
    const app = buildApp({
      noteService: createNoteService({ create: vi.fn().mockRejectedValue(new Error('database-password')) }),
      logger: false,
    });
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/notes',
      payload: { slug: 'safe-error', title: 'Safe error' },
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain('database-password');
    expect(response.json()).toMatchObject({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
    });
  });
});
