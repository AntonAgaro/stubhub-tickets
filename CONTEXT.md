# Context

## Purpose

This repository is a personal golden repository for starting a single Node.js microservice. A consumer clones the repository and replaces the example domain module with service-specific behavior.

## Glossary

### Golden repository

A cloneable starting repository maintained as working source code. It is not a code generator or a monorepo template.

### Microservice

One independently buildable and deployable HTTP/JSON application contained in one repository. Internal modules share the application process; separately deployable services belong in separate repositories.

### Domain module

A feature-oriented unit under `src/` that owns its HTTP routes, validation, errors, persistence behavior, and tests. The template includes one small removable example.

### Runtime dependency

An external system required by the running application. MongoDB is the only runtime dependency selected for the base template.

### Transport schema

A TypeBox schema attached to a Fastify route. It defines the HTTP request or response contract and drives validation, serialization, OpenAPI generation, and the corresponding TypeScript type.

### Persistence model

A Mongoose schema and model describing documents stored in MongoDB. Persistence models remain inside repository modules and are mapped to plain objects before crossing into application or HTTP code.

### Problem details

The RFC 9457 `application/problem+json` representation returned for HTTP errors. A central error handler maps validation, domain, and unexpected failures into this contract.

### Note

The removable example resource used to demonstrate the template's module boundaries. A note has a public string identifier, unique slug, title, optional content, and creation and update timestamps. It carries no business meaning for services cloned from the template.

## Scope

The base template includes TypeScript, Fastify, MongoDB integration, automated tests, code-quality tooling, local-development support, and a production Dockerfile.

Kubernetes resources, asynchronous workers, message brokers, observability integrations, CI pipelines, and release automation are extensions rather than base-template features.
