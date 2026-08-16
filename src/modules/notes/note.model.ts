import { type Connection, type Model, Schema } from 'mongoose';

export interface NoteFields {
  slug: string;
  title: string;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<NoteFields>(
  {
    slug: { type: String, required: true, unique: true, minlength: 1, maxlength: 120 },
    title: { type: String, required: true, minlength: 1, maxlength: 200 },
    content: { type: String, maxlength: 20_000 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

noteSchema.index({ createdAt: -1, _id: -1 });

export function createNoteModel(connection: Connection): Model<NoteFields> {
  return connection.models['Note'] ?? connection.model<NoteFields>('Note', noteSchema);
}
