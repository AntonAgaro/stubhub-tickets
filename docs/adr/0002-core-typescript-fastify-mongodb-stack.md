# ADR-0002: Use ESM, Mongoose, TypeBox, pnpm, and Vitest

Status: Accepted

Date: 2026-08-15

## Context

The golden repository needs one coherent TypeScript stack for HTTP validation, MongoDB persistence, development, builds, formatting, and tests. Alternative libraries in the base repository would add choices without serving its personal-use purpose.

## Decision

- Use stable releases and exclude prerelease dependencies from the baseline.
- Use the latest Node.js LTS release supported by the selected dependencies.
- Pin exact dependency versions and commit the pnpm lockfile.
- Use native ESM with `type: "module"` and TypeScript's `NodeNext` module mode.
- Use `tsx` for the development process and `tsc` to type-check and emit JavaScript for production.
- Use pnpm 11 as the package manager and pin its exact version in the repository.
- Use Mongoose as the MongoDB object-document mapper and target the latest MongoDB 8.0 patch release.
- Use TypeBox schemas with Fastify's TypeBox type provider for HTTP request validation and response serialization.
- Use Vitest 4 for unit and integration tests, `fastify.inject()` for in-process HTTP tests, and Testcontainers with a real MongoDB instance for persistence tests.
- Collect test coverage without enforcing an arbitrary percentage threshold.
- Colocate unit tests with modules and place container-backed tests under `test/integration/` with shared helpers under `test/support/`.
- Run ESLint and Prettier as separate tools, using `eslint-config-prettier` to prevent conflicting rules.
- Use ESLint's flat configuration with type-checked recommended TypeScript rules and focused additional safety rules.
- Use strict TypeScript settings, including unchecked-index, exact-optional-property, unchecked-side-effect-import, and verbatim-module checks.
- Use Husky for the pre-commit hook. Run lint-staged with ESLint fixes and Prettier on staged files, then type-check the complete TypeScript project once. Do not run tests in the commit hook.
- Provide composable package scripts for development, builds, checks, formatting, linting, unit tests, integration tests, coverage, and index management.

## Consequences

- HTTP contracts and persistence models remain distinct schema systems: TypeBox describes the transport boundary and Mongoose describes stored documents.
- Production runs emitted JavaScript rather than relying on Node.js TypeScript stripping.
- Persistence integration tests require a working Docker-compatible container runtime.
- The lockfile and pinned package-manager version make installations reproducible across cloned services.
- Version-specific configuration must use a mutually compatible set of stable tool releases.
- TypeScript remains on the newest stable 6.0 release until the normal typescript-eslint toolchain supports TypeScript 7 without a dual installation.
