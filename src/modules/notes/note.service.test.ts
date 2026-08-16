import { describe, expect, it, vi } from 'vitest';

import type { NoteRepository } from './note.repository.js';
import { DefaultNoteService, type Note } from './note.service.js';

const newestNote: Note = {
  id: '66bc9b91d2f94b68b8ebc003',
  slug: 'newest-note',
  title: 'Newest note',
  createdAt: '2026-08-15T12:00:00.000Z',
  updatedAt: '2026-08-15T12:00:00.000Z',
};

const olderNote: Note = {
  id: '66bc9b91d2f94b68b8ebc002',
  slug: 'older-note',
  title: 'Older note',
  createdAt: '2026-08-15T11:00:00.000Z',
  updatedAt: '2026-08-15T11:00:00.000Z',
};

function createRepository(overrides: Partial<NoteRepository> = {}): NoteRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

describe('note service', () => {
  it('uses an opaque cursor without repeating notes between pages', async () => {
    const repository = createRepository({
      list: vi.fn(({ after }) => Promise.resolve(after ? [olderNote] : [newestNote, olderNote])),
    });
    const service = new DefaultNoteService(repository);

    const firstPage = await service.list({ limit: 1 });
    const secondPage = await service.list({ limit: 1, after: firstPage.nextCursor! });

    expect(firstPage.items).toEqual([newestNote]);
    expect(firstPage.nextCursor).toEqual(expect.any(String));
    expect(secondPage).toEqual({ items: [olderNote], nextCursor: null });
  });

  it('rejects malformed cursors as a public input error', async () => {
    const service = new DefaultNoteService(createRepository());

    await expect(service.list({ limit: 20, after: 'not-a-cursor' })).rejects.toMatchObject({
      status: 400,
      type: 'urn:problem-type:invalid-cursor',
    });
  });
});
