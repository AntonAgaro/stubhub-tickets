export interface ApplicationErrorOptions {
  type: string;
  title: string;
  status: number;
  detail: string;
  cause?: unknown;
}

export class ApplicationError extends Error {
  readonly type: string;
  readonly title: string;
  readonly status: number;

  constructor(options: ApplicationErrorOptions) {
    super(options.detail, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = new.target.name;
    this.type = options.type;
    this.title = options.title;
    this.status = options.status;
  }
}
