import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../app.js';
import type { NoteService } from '../notes/note.service.js';

function createNoteService(): NoteService {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

describe('health HTTP API', () => {
  const apps: Array<Awaited<ReturnType<typeof buildApp>>> = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map(async (app) => app.close()));
  });

  it('reports process liveness without consulting dependencies', async () => {
    const isReady = vi.fn().mockReturnValue(false);
    const app = buildApp({ noteService: createNoteService(), isReady, logger: false });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/health/live' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(isReady).not.toHaveBeenCalled();
  });

  it('reports readiness while MongoDB is connected', async () => {
    const app = buildApp({
      noteService: createNoteService(),
      isReady: () => true,
      logger: false,
    });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ready' });
  });

  it('removes readiness while MongoDB is disconnected', async () => {
    const app = buildApp({
      noteService: createNoteService(),
      isReady: () => false,
      logger: false,
    });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'unavailable' });
  });
});
