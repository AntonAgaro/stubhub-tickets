# ADR-0001: Use a single-service HTTP golden repository

Status: Accepted

Date: 2026-08-15

## Context

The template is intended for personal reuse when starting TypeScript microservices. It needs enough working behavior to demonstrate the intended structure without becoming a sample product or a configurable framework.

## Decision

- Distribute the template as a cloneable golden repository.
- Keep exactly one independently deployable microservice in each repository.
- Target HTTP/JSON APIs only.
- Organize application behavior as internal domain modules under `src/`.
- Include one small, clearly removable example domain module demonstrating routing, validation, MongoDB persistence, errors, and tests.
- Provide a production Dockerfile while remaining independent of Kubernetes and other deployment platforms.
- Keep the base operational scope lean: tests are included; Kubernetes resources, asynchronous workers, message brokers, observability integrations, CI pipelines, and release automation are deferred.

## Consequences

- Cloning and renaming is the setup workflow; there is no generator or feature-selection mechanism to maintain.
- Separately deployable workloads use separate repositories instead of packages in a monorepo.
- The application architecture may expose extension seams, but the base repository carries no unused broker or orchestration dependencies.
- Deployment systems can run the resulting OCI image and supply configuration without repository-specific Kubernetes manifests.
