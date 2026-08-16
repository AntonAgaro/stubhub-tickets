import { Type } from '@fastify/type-provider-typebox';

export const NoteSchema = Type.Object(
  {
    id: Type.String({ pattern: '^[a-fA-F0-9]{24}$' }),
    slug: Type.String({ minLength: 1, maxLength: 120, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' }),
    title: Type.String({ minLength: 1, maxLength: 200 }),
    content: Type.Optional(Type.String({ maxLength: 20_000 })),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
  },
  { additionalProperties: false }
);

export const CreateNoteBodySchema = Type.Object(
  {
    slug: Type.String({ minLength: 1, maxLength: 120, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' }),
    title: Type.String({ minLength: 1, maxLength: 200 }),
    content: Type.Optional(Type.String({ maxLength: 20_000 })),
  },
  { additionalProperties: false }
);

export const NoteIdParamsSchema = Type.Object(
  {
    id: Type.String({ pattern: '^[a-fA-F0-9]{24}$' }),
  },
  { additionalProperties: false }
);

export const ListNotesQuerySchema = Type.Object(
  {
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
    after: Type.Optional(Type.String({ minLength: 1, maxLength: 1_024 })),
  },
  { additionalProperties: false }
);

export const NoteListSchema = Type.Object(
  {
    items: Type.Array(NoteSchema),
    nextCursor: Type.Union([Type.String(), Type.Null()]),
  },
  { additionalProperties: false }
);

export const UpdateNoteBodySchema = Type.Object(
  {
    slug: Type.Optional(Type.String({ minLength: 1, maxLength: 120, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' })),
    title: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
    content: Type.Optional(Type.String({ maxLength: 20_000 })),
  },
  { additionalProperties: false, minProperties: 1 }
);

export type CreateNoteInput = Type.Static<typeof CreateNoteBodySchema>;
export type ListNotesInput = Type.Static<typeof ListNotesQuerySchema>;
export type UpdateNoteInput = Type.Static<typeof UpdateNoteBodySchema>;
