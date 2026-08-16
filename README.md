# Fastify MongoDB microservice template

A personal golden repository for one independently deployable HTTP/JSON service. It uses strict TypeScript, Fastify, TypeBox, Mongoose, Vitest, and pnpm, and includes a removable notes module that demonstrates the intended architecture.

The repository produces a non-root OCI image suitable for Docker or an external orchestrator. It intentionally contains no Kubernetes manifests, CI pipeline, broker, telemetry backend, or repository-owned MongoDB stack.

## Requirements

- Node.js 24 LTS (the pinned development version is in `.node-version`)
- pnpm 11.21.0
- MongoDB 8.0; 8.0.28 is the current template baseline
- Docker-compatible container runtime for integration tests and image builds
- MongoDB Compass is recommended for inspecting local databases

## Start locally

Install dependencies and create your local configuration:

```sh
pnpm install --frozen-lockfile
cp .env.example .env
```

Run MongoDB separately from this repository. One shared local instance can serve several cloned services as long as each service uses a different database name. For example:

```sh
docker volume create local-mongodb-data
docker run -d \
  --name local-mongodb \
  -p 127.0.0.1:27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=dev \
  -e MONGO_INITDB_ROOT_PASSWORD=replace-me \
  -v local-mongodb-data:/data/db \
  mongo:8.0.28
```

Set a unique database and HTTP port in `.env`, then start the host process with watch mode:

```dotenv
PORT=3001
MONGODB_URI=mongodb://dev:replace-me@127.0.0.1:27017/my_service?authSource=admin
```

```sh
pnpm dev
```

When enabled, the OpenAPI document is available at `http://127.0.0.1:3001/openapi.json`. Swagger UI is available at `http://127.0.0.1:3001/documentation/` only in development.

## Configuration

Configuration is loaded from `.env` locally and from process environment in deployed environments. Invalid or missing required values stop startup.

| Variable          | Default       | Purpose                                                                        |
| ----------------- | ------------- | ------------------------------------------------------------------------------ |
| `NODE_ENV`        | `development` | `development`, `test`, or `production`                                         |
| `HOST`            | `127.0.0.1`   | HTTP bind address; use `0.0.0.0` in a container                                |
| `PORT`            | `3000`        | HTTP port                                                                      |
| `LOG_LEVEL`       | `info`        | Pino level from `fatal` through `trace`, or `silent`                           |
| `MONGODB_URI`     | required      | Complete Mongoose connection URI, including the service database               |
| `OPENAPI_ENABLED` | `true`        | Publishes `/openapi.json`; Swagger UI additionally requires development mode   |
| `CORS_ORIGINS`    | empty         | Comma-separated origin allowlist; empty disables CORS and `*` must be explicit |

CORS credentials are disabled. Authorization and cookie headers are redacted from structured logs.

## Example API

The removable example is mounted under `/v1/notes`:

| Method   | Path                           | Result                                           |
| -------- | ------------------------------ | ------------------------------------------------ |
| `POST`   | `/v1/notes`                    | Creates a note, returns 201 and `Location`       |
| `GET`    | `/v1/notes/:id`                | Returns one note                                 |
| `GET`    | `/v1/notes?limit=20&after=...` | Returns cursor-paginated `{ items, nextCursor }` |
| `PATCH`  | `/v1/notes/:id`                | Partially updates a note                         |
| `DELETE` | `/v1/notes/:id`                | Deletes a note and returns 204                   |

Errors use RFC 9457 Problem Details. Invalid input returns 400, missing notes return 404, and duplicate slugs return 409. MongoDB identifiers and Mongoose metadata never leak through the response schema.

## Commands

| Command                             | Purpose                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `pnpm dev`                          | Run TypeScript with `tsx` watch mode                                      |
| `pnpm build`                        | Clean and emit production JavaScript into `dist/`                         |
| `pnpm start`                        | Run emitted JavaScript                                                    |
| `pnpm typecheck`                    | Run strict TypeScript checks without emitting                             |
| `pnpm lint` / `pnpm lint:fix`       | Check or fix ESLint findings                                              |
| `pnpm format` / `pnpm format:check` | Write or verify Prettier formatting                                       |
| `pnpm test` / `pnpm test:unit`      | Run unit and in-process HTTP tests                                        |
| `pnpm test:integration`             | Run HTTP-to-MongoDB tests with Testcontainers                             |
| `pnpm test:coverage`                | Produce V8 coverage reports                                               |
| `pnpm db:indexes`                   | Reconcile declared Mongoose indexes explicitly                            |
| `pnpm check`                        | Run formatting, linting, type-checking, unit tests, and integration tests |

The Husky pre-commit hook runs ESLint fixes and Prettier on staged files, followed by one complete project type-check. Tests remain in `pnpm check`.

## Architecture

```text
src/
  app.ts                  Fastify construction and HTTP plugins
  bootstrap.ts            Mongoose and application composition
  server.ts               Process startup and signal handling
  config/                 Validated configuration and logging
  errors/                 Problem Details mapping
  modules/notes/          Removable feature example
  scripts/                Explicit operational commands
test/
  integration/            Testcontainers-backed boundary tests
```

TypeBox schemas define the transport contract. Mongoose schemas define stored documents and stay inside repositories. Services work with plain objects. `app.ts` never opens a listening socket, so HTTP contracts can be tested with `fastify.inject()`.

Read [CONTEXT.md](./CONTEXT.md) for vocabulary and [docs/adr/](./docs/adr/) for the design rationale.

## Database indexes

Development and test connections create declared indexes automatically. Production startup does not mutate indexes. Run `pnpm db:indexes` as an explicit deployment step using the target `MONGODB_URI`; review its output because `syncIndexes()` can remove indexes no longer declared by the application.

## Build and run the image

```sh
docker build -t fastify-mongodb-service .
docker run --rm \
  -p 3000:3000 \
  -e MONGODB_URI='mongodb://dev:replace-me@host.docker.internal:27017/my_service?authSource=admin' \
  fastify-mongodb-service
```

On Linux, add `--add-host=host.docker.internal:host-gateway` when the container connects to MongoDB on the host. In a deployed environment, inject all configuration and secrets externally. The process waits for MongoDB before listening and handles `SIGINT`/`SIGTERM` by closing Fastify and Mongoose.

## Turn the template into a service

1. Rename the package and OpenAPI title.
2. Choose a unique local database and port in `.env`.
3. Replace `src/modules/notes/` with the first real domain module.
4. Replace note model composition in `src/bootstrap.ts` and index synchronization in `src/scripts/sync-indexes.ts`.
5. Update the domain glossary, ADRs, API documentation, and tests with the service vocabulary.

Shared configuration, HTTP security, error handling, logging, process lifecycle, and build tooling do not depend on the notes module.
