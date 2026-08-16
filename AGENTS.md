## Agent skills

### Issue tracker

Issues and specs are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

This repo uses a single-context domain docs layout: root `CONTEXT.md` plus root `docs/adr/`. See `docs/agents/domain.md`.

### Template integrity

Before changing architecture or public behavior, read `CONTEXT.md`, the relevant ADRs, and the active spec under `.scratch/`. Keep one deployable HTTP service, organize behavior by feature, use TypeBox at HTTP boundaries, and keep Mongoose inside repositories. The `notes` module must remain removable without changing shared infrastructure. Run the repository check script before handoff; if Docker is unavailable, report the skipped integration boundary explicitly.
