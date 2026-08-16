# ADR-0003: Use feature-first modules with explicit transport and persistence boundaries

Status: Accepted

Date: 2026-08-15

## Context

The example must teach a structure that remains navigable as a service grows. Fastify route schemas, application behavior, and Mongoose persistence have different responsibilities even when they describe related data.

## Decision

- Organize behavior in feature-first modules under `src/modules/`.
- Separate application construction in `app.ts` from process startup in `server.ts`.
- Give each feature its own routes, TypeBox schemas, service, repository, Mongoose model, errors, and tests as needed.
- Keep Mongoose inside repositories. Repositories return plain objects rather than Mongoose documents.
- Use TypeBox response schemas as an explicit serialization boundary; never expose Mongoose metadata through HTTP.
- Include a removable `notes` module demonstrating create, fetch, list, update, and delete behavior.
- Place its routes under `/v1/notes`.
- Represent a note with `id`, unique `slug`, `title`, optional `content`, `createdAt`, and `updatedAt`; expose identifiers and timestamps as strings and omit MongoDB-specific metadata.
- Create notes with `POST` and a 201 response plus `Location`; partially update them with `PATCH` and a 200 response; delete them with a 204 response. Reject empty updates and unknown fields and provide no `PUT` route.
- Use bounded cursor pagination for note lists, returning `items` and `nextCursor` without a total count. Sort newest-first and encode `{ createdAt, id }` as an opaque base64url cursor backed by a compound `{ createdAt: -1, _id: -1 }` index.
- Return errors as RFC 9457 Problem Details through one central error handler.
- Map invalid input and malformed identifiers to 400, missing resources to 404, MongoDB duplicate-key errors to 409, and unexpected failures to 500 without exposing internal details.
- Generate OpenAPI from route schemas and expose Swagger UI only in development.
- Apply Helmet headers and explicit CORS handling. Read an optional comma-separated allowlist from `CORS_ORIGINS`; an empty value disables CORS, `*` requires an explicit value, and credentials remain disabled by default.
- Declare indexes in Mongoose schemas. Permit automatic index creation in development and tests, disable it in production, and provide an explicit production index command.

## Consequences

- Similar data shapes may be represented separately at the HTTP and MongoDB boundaries; explicit mapping prevents those representations from becoming accidentally coupled.
- `fastify.inject()` can test a constructed application without opening a network listener.
- Removing the example module does not require deleting infrastructure-specific behavior from unrelated layers.
- Production deployments choose when database indexes change instead of application startup mutating them implicitly.
- The example's unique slug creates a real duplicate-key path without inventing uniqueness for human-readable titles.
