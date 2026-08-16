import type { CreateNoteInput, ListNotesInput, UpdateNoteInput } from './note.schemas.js';
import { InvalidNoteCursorError, NoteNotFoundError } from './note.errors.js';
import type { NoteCursorPosition, NoteRepository } from './note.repository.js';

export interface Note {
  id: string;
  slug: string;
  title: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteService {
  create(input: CreateNoteInput): Promise<Note>;
  findById(id: string): Promise<Note>;
  list(input: Required<Pick<ListNotesInput, 'limit'>> & Pick<ListNotesInput, 'after'>): Promise<NoteList>;
  update(id: string, input: UpdateNoteInput): Promise<Note>;
  delete(id: string): Promise<void>;
}

export interface NoteList {
  items: Note[];
  nextCursor: string | null;
}

interface EncodedCursor {
  createdAt: string;
  id: string;
}

function encodeCursor(note: Note): string {
  const cursor: EncodedCursor = { createdAt: note.createdAt, id: note.id };
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function decodeCursor(value: string): NoteCursorPosition {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<EncodedCursor>;
    const createdAt = new Date(parsed.createdAt ?? '');

    if (
      typeof parsed.createdAt !== 'string' ||
      Number.isNaN(createdAt.valueOf()) ||
      typeof parsed.id !== 'string' ||
      !/^[a-fA-F0-9]{24}$/.test(parsed.id)
    ) {
      throw new Error('Invalid cursor fields');
    }

    return { createdAt, id: parsed.id };
  } catch (error) {
    throw new InvalidNoteCursorError(error);
  }
}

export class DefaultNoteService implements NoteService {
  constructor(private readonly repository: NoteRepository) {}

  async create(input: CreateNoteInput): Promise<Note> {
    return this.repository.create(input);
  }

  async findById(id: string): Promise<Note> {
    const note = await this.repository.findById(id);
    if (!note) {
      throw new NoteNotFoundError(id);
    }
    return note;
  }

  async list(input: Required<Pick<ListNotesInput, 'limit'>> & Pick<ListNotesInput, 'after'>): Promise<NoteList> {
    const notes = await this.repository.list({
      limit: input.limit + 1,
      ...(input.after ? { after: decodeCursor(input.after) } : {}),
    });
    const hasNextPage = notes.length > input.limit;
    const items = hasNextPage ? notes.slice(0, input.limit) : notes;
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor: hasNextPage && lastItem ? encodeCursor(lastItem) : null,
    };
  }

  async update(id: string, input: UpdateNoteInput): Promise<Note> {
    const note = await this.repository.update(id, input);
    if (!note) {
      throw new NoteNotFoundError(id);
    }
    return note;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NoteNotFoundError(id);
    }
  }
}
