# ADR-0005: Validate configuration and use Fastify structured logging

Status: Accepted

Date: 2026-08-15

## Context

The same application runs directly on a developer laptop and as emitted JavaScript inside a container. Configuration failures must be visible before the server accepts work, while logging must remain useful without selecting an external observability platform.

## Decision

- Load and validate environment configuration with `env-schema` and TypeBox.
- Read `.env` for local development and normal process environment in deployed environments.
- Support `NODE_ENV`, `HOST`, `PORT`, `LOG_LEVEL`, `MONGODB_URI`, `OPENAPI_ENABLED`, and optional `CORS_ORIGINS`.
- Fail startup when required values are missing or invalid.
- Use Fastify's Pino logger directly with structured JSON output.
- Use `pino-pretty` only during local development.
- Redact authorization and cookie data from logs and retain Fastify request identifiers.

## Consequences

- `.env.example` can document configuration keys without containing usable credentials.
- Application modules consume validated values instead of repeatedly reading and parsing `process.env`.
- Production logs remain machine-readable without a custom logger abstraction or telemetry backend.
