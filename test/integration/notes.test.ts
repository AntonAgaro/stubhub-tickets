import { MongoDBContainer, type StartedMongoDBContainer } from '@testcontainers/mongodb';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApplication } from '../../src/bootstrap.js';

describe('notes with MongoDB', () => {
  let app: FastifyInstance;
  let mongo: StartedMongoDBContainer;

  beforeAll(async () => {
    mongo = await new MongoDBContainer('mongo:8.0.28').start();
    const uri = new URL(mongo.getConnectionString());
    const hostOverride = process.env['TESTCONTAINERS_HOST_OVERRIDE'];
    if (hostOverride) {
      uri.hostname = hostOverride;
      uri.searchParams.set('directConnection', 'true');
    }
    uri.pathname = '/fastify_template_test';

    app = await createApplication({
      mongodbUri: uri.toString(),
      autoIndex: true,
      openapiEnabled: false,
      corsOrigins: [],
      logger: false,
    });
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it('persists a note and retrieves it through HTTP', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/v1/notes',
      payload: {
        slug: 'persistent-note',
        title: 'Persistent note',
        content: 'Stored in MongoDB',
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json<{ id: string }>();

    const getResponse = await app.inject({
      method: 'GET',
      url: `/v1/notes/${created.id}`,
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({
      id: created.id,
      slug: 'persistent-note',
      title: 'Persistent note',
      content: 'Stored in MongoDB',
    });
  });

  it('maps duplicate slugs to conflict problem details', async () => {
    const payload = { slug: 'duplicate-note', title: 'Duplicate note' };

    expect((await app.inject({ method: 'POST', url: '/v1/notes', payload })).statusCode).toBe(201);
    const duplicateResponse = await app.inject({ method: 'POST', url: '/v1/notes', payload });

    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json()).toMatchObject({
      type: 'urn:problem-type:note-slug-conflict',
      status: 409,
    });
  });

  it('updates, paginates, and deletes notes through HTTP', async () => {
    const createdIds: string[] = [];
    for (const slug of ['page-one', 'page-two', 'page-three']) {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/notes',
        payload: { slug, title: slug },
      });
      createdIds.push(response.json<{ id: string }>().id);
    }

    const firstPage = await app.inject({ method: 'GET', url: '/v1/notes?limit=2' });
    const firstPageBody = firstPage.json<{ items: Array<{ id: string }>; nextCursor: string }>();
    const secondPage = await app.inject({
      method: 'GET',
      url: `/v1/notes?limit=2&after=${encodeURIComponent(firstPageBody.nextCursor)}`,
    });
    const secondPageBody = secondPage.json<{ items: Array<{ id: string }>; nextCursor: string | null }>();

    expect(firstPageBody.items).toHaveLength(2);
    expect(secondPageBody.items.length).toBeGreaterThan(0);
    expect(secondPageBody.items.map(({ id }) => id)).not.toContain(firstPageBody.items[0]?.id);

    const id = createdIds[0]!;
    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/v1/notes/${id}`,
      payload: { title: 'Updated through MongoDB' },
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({ title: 'Updated through MongoDB' });

    expect((await app.inject({ method: 'DELETE', url: `/v1/notes/${id}` })).statusCode).toBe(204);
    expect((await app.inject({ method: 'GET', url: `/v1/notes/${id}` })).statusCode).toBe(404);
  });
});
