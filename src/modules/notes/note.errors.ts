import { ApplicationError } from '../../errors/application-error.js';

export class NoteNotFoundError extends ApplicationError {
  constructor(id: string) {
    super({
      type: 'urn:problem-type:note-not-found',
      title: 'Note not found',
      status: 404,
      detail: `No note exists with id ${id}.`,
    });
  }
}

export class NoteSlugConflictError extends ApplicationError {
  constructor(slug: string, cause?: unknown) {
    super({
      type: 'urn:problem-type:note-slug-conflict',
      title: 'Note slug already exists',
      status: 409,
      detail: `A note with slug ${slug} already exists.`,
      cause,
    });
  }
}

export class InvalidNoteCursorError extends ApplicationError {
  constructor(cause?: unknown) {
    super({
      type: 'urn:problem-type:invalid-cursor',
      title: 'Invalid pagination cursor',
      status: 400,
      detail: 'The pagination cursor is malformed or no longer valid.',
      cause,
    });
  }
}
