# ADR-0004: Share local MongoDB and keep the service container self-contained

Status: Accepted

Date: 2026-08-15

## Context

Several services may be developed simultaneously on one laptop. Giving every cloned repository its own long-running MongoDB and database interface wastes resources and creates host-port conflicts. The service must still produce a container suitable for an external orchestrator.

## Decision

- Manage one persistent MongoDB 8.0 container outside this repository and use MongoDB Compass as the local database interface.
- Give each local service a unique MongoDB database and HTTP port through its ignored `.env` file.
- Keep real local credentials out of version control and provide only placeholders in `.env.example`.
- Do not include Docker Compose or MongoDB administration containers in this repository.
- Handle termination signals by closing Fastify and disconnecting Mongoose.
- Establish the initial Mongoose connection before the HTTP listener starts; log and exit non-zero when the database is unavailable.
- Build the production application with a multi-stage Debian slim Node.js image.
- Pin the readable Node.js image tag to an immutable digest.
- Install from the frozen pnpm lockfile, copy only runtime artifacts into the final stage, run as the non-root `node` user, and use exec-form `CMD`.

## Consequences

- `pnpm dev` runs the application directly on the host and connects to user-managed local infrastructure.
- Cloned services coexist by selecting different ports and database names rather than creating separate Docker networks.
- Integration tests remain isolated because Testcontainers creates disposable MongoDB instances independently of the shared development database.
- Docker and Kubernetes can deliver termination signals without abruptly abandoning active application resources.
- An external container supervisor can restart failed startup attempts instead of routing traffic to an application without persistence.
