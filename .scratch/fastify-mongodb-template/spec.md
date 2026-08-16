# Fastify MongoDB microservice golden repository

Status: Implemented and verified

Verified: 2026-08-15

## Objective

Build a personal, cloneable golden repository for one independently deployable HTTP/JSON microservice. Use a stable modern TypeScript, Fastify, and MongoDB stack; keep the base lean; demonstrate its architecture with one removable notes module; and produce an OCI image that can run under Docker or an external orchestrator without repository-owned Kubernetes resources.

## Scope

Include:

- Latest mutually compatible stable tool releases, with Node.js on its latest LTS line
- TypeScript with native ESM and strict checks
- Fastify HTTP server and TypeBox route contracts
- Mongoose targeting the latest MongoDB 8.0 patch line
- Validated environment configuration and structured Fastify/Pino logging
- Helmet, configurable CORS, OpenAPI, and development-only Swagger UI
- Unit, HTTP, and container-backed MongoDB integration tests with coverage
- ESLint, Prettier, Husky, and lint-staged
- A production multi-stage, non-root, digest-pinned Debian slim Docker image
- Human documentation, concise agent guidance, and the accepted ADRs

Exclude:

- Multiple deployable services, monorepo or generator behavior
- Workers, scheduled jobs, message brokers, and extra runtime datastores
- Kubernetes manifests, Helm, and Kustomize
- Metrics, tracing, hosted observability integrations, CI, release automation, and dependency bots
- Repository-owned MongoDB Compose or administration services
- CORS credentials and default wildcard origins
- Git commit-message tooling and tests in the pre-commit hook

## Version policy

- Select the latest stable releases at implementation time and exclude prereleases.
- Use the latest Node.js LTS supported by the selected stack; currently Node.js 24.
- Pin exact dependency versions, the exact pnpm 11 release, the lockfile, and the Docker base digest.
- Use TypeScript 6.0 until the regular typescript-eslint toolchain supports TypeScript 7 without a dual compiler installation.

## Runtime architecture

- Use `type: "module"`, `NodeNext`, `tsx` for development, and `tsc`-emitted JavaScript for production.
- Construct Fastify in `app.ts` and listen from `server.ts`.
- Organize behavior by feature under `src/modules/`; keep shared Fastify integrations under `src/plugins/` and validated configuration under `src/config/`.
- Establish Mongoose before listening. On startup failure, log and exit non-zero.
- On termination, close Fastify and disconnect Mongoose.
- Keep Mongoose models and documents inside repository modules; expose plain objects to services and routes.
- Use TypeBox response schemas to constrain serialized output.

## Example notes module

A note contains:

- `id`: MongoDB ObjectId serialized as a 24-character string
- `slug`: required and unique
- `title`: required
- `content`: optional
- `createdAt` and `updatedAt`: ISO 8601 strings

Routes:

- `POST /v1/notes` returns 201 and `Location`.
- `GET /v1/notes/:id` returns one note.
- `GET /v1/notes` returns `{ items, nextCursor }` using bounded newest-first cursor pagination over `{ createdAt, id }`.
- `PATCH /v1/notes/:id` returns 200 and rejects empty or unknown updates.
- `DELETE /v1/notes/:id` returns 204.

Use RFC 9457 Problem Details. Map validation and malformed identifiers to 400, missing notes to 404, duplicate slugs to 409, and unexpected errors to 500. Do not expose stack traces or persistence details.

## Database indexes

- Declare the unique slug and pagination indexes in the Mongoose schema.
- Permit automatic index creation only in development and tests.
- Provide `pnpm db:indexes` for an explicit production workflow.

## Configuration and local development

Validate `NODE_ENV`, `HOST`, `PORT`, `LOG_LEVEL`, `MONGODB_URI`, `OPENAPI_ENABLED`, and optional `CORS_ORIGINS` with `env-schema` and TypeBox. Load `.env` locally and process environment in deployed environments. Commit placeholders only in `.env.example`.

Run the application on the host with `pnpm dev`. Manage one persistent MongoDB 8.0 container outside the repository, inspect it with MongoDB Compass, and give each cloned service a unique database and HTTP port through its ignored `.env`.

`CORS_ORIGINS` is a comma-separated allowlist. Empty disables CORS; wildcard access must be explicit; credentials are disabled by default.

## Tests

- Use Vitest 4 and collect coverage without a percentage threshold.
- Colocate unit tests as `*.test.ts`.
- Use `fastify.inject()` for HTTP tests without a listening socket.
- Put container-backed suites under `test/integration/` and helpers under `test/support/`.
- Use Testcontainers with real MongoDB; do not mock Mongoose internals.

## Code quality

- Use ESLint 10 flat configuration with type-checked recommended TypeScript rules and focused safety rules.
- Run Prettier separately with the requested 120-column, two-space, semicolon, single-quote, ES5-trailing-comma, bracket-spacing, always-parenthesized-arrow, and LF rules.
- Husky pre-commit runs lint-staged with ESLint fixes and Prettier for staged files, followed by one full-project type-check. Tests remain in `pnpm check`.
- Provide `dev`, `build`, `start`, `typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:unit`, `test:integration`, `test:coverage`, `db:indexes`, and `check` scripts.

## Documentation

- `README.md` covers prerequisites, shared MongoDB setup, environment variables, commands, Docker, OpenAPI, tests, and removing or replacing the example module.
- `AGENTS.md` points to the domain context, ADRs, and local issues; it records the feature-first and transport/persistence guardrails and the verification expectation without duplicating discoverable configuration.

## Acceptance criteria

- A fresh install with the pinned pnpm version succeeds from the committed lockfile.
- Formatting, linting, strict type-checking, builds, unit tests, HTTP tests, and MongoDB integration tests pass.
- The development server connects to a user-provided MongoDB URI and reloads through `tsx`.
- The complete notes API follows its documented schemas, status codes, pagination, and Problem Details behavior.
- OpenAPI represents every example route and Swagger UI is unavailable when disabled.
- The production image builds reproducibly, runs as non-root, starts emitted JavaScript, and handles termination.
- No Kubernetes, CI, observability backend, broker, or repository-owned MongoDB stack is introduced.
