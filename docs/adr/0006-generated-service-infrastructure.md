# ADR-0006: Add generated-service infrastructure outside the golden repository

Status: Accepted

Date: 2026-08-16

## Context

This repository was generated from `AntonAgaro/fastify-template`. Kubernetes needs explicit health signals, and an independently deployable service needs its own verification and image publication. These capabilities are service-repository concerns for this project and must not expand the golden repository beyond its development Dockerfile.

## Decision

- Keep the template's application and removable notes behavior unchanged.
- Add `/health/live` for process liveness and `/health/ready` for Mongoose readiness.
- Add independent CI and amd64 GHCR image publication with immutable action pins and least-privilege permissions.
- Keep Kubernetes, MongoDB, NATS, Skaffold, and production deployment configuration in `AntonAgaro/stubhub-clone`.
- Add no StubHub business behavior or NATS integration in this infrastructure phase.

## Consequences

- Kubernetes receives meaningful liveness and readiness signals.
- The service verifies and releases independently.
- This repository deliberately differs from the golden repository only at its generated-service infrastructure and identity seams.
- Future domain work can remove the notes module without changing health or release infrastructure.
