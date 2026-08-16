import { type Model, type QueryFilter, Types } from 'mongoose';

import { NoteSlugConflictError } from './note.errors.js';
import type { NoteFields } from './note.model.js';
import type { CreateNoteInput, UpdateNoteInput } from './note.schemas.js';
import type { Note } from './note.service.js';

export interface NoteCursorPosition {
  createdAt: Date;
  id: string;
}

export interface NoteRepository {
  create(input: CreateNoteInput): Promise<Note>;
  findById(id: string): Promise<Note | null>;
  list(options: { limit: number; after?: NoteCursorPosition }): Promise<Note[]>;
  update(id: string, input: UpdateNoteInput): Promise<Note | null>;
  delete(id: string): Promise<boolean>;
}

interface NoteRecord extends NoteFields {
  _id: Types.ObjectId;
}

function toNote(record: NoteRecord): Note {
  return {
    id: record._id.toHexString(),
    slug: record.slug,
    title: record.title,
    ...(record.content === undefined ? {} : { content: record.content }),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11_000;
}

export class MongooseNoteRepository implements NoteRepository {
  constructor(private readonly model: Model<NoteFields>) {}

  async create(input: CreateNoteInput): Promise<Note> {
    try {
      const document = await this.model.create(input);
      return toNote(document.toObject());
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new NoteSlugConflictError(input.slug, error);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Note | null> {
    const record = (await this.model.findById(id).lean().exec()) as NoteRecord | null;
    return record ? toNote(record) : null;
  }

  async list(options: { limit: number; after?: NoteCursorPosition }): Promise<Note[]> {
    const filter: QueryFilter<NoteFields> = options.after
      ? {
          $or: [
            { createdAt: { $lt: options.after.createdAt } },
            { createdAt: options.after.createdAt, _id: { $lt: new Types.ObjectId(options.after.id) } },
          ],
        }
      : {};
    const records = (await this.model
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(options.limit)
      .lean()
      .exec()) as NoteRecord[];

    return records.map(toNote);
  }

  async update(id: string, input: UpdateNoteInput): Promise<Note | null> {
    try {
      const record = (await this.model
        .findByIdAndUpdate(id, { $set: input }, { returnDocument: 'after', runValidators: true })
        .lean()
        .exec()) as NoteRecord | null;
      return record ? toNote(record) : null;
    } catch (error) {
      if (isDuplicateKeyError(error) && input.slug) {
        throw new NoteSlugConflictError(input.slug, error);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).select({ _id: 1 }).lean().exec();
    return result !== null;
  }
}
