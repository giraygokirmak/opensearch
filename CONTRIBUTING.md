# Contributing to @kagan-sh/opensearch

Keep the published README end-user facing. Put local setup, source-based plugin loading, and maintainer workflow details here.

## Requirements

- Bun 1.2+
- Node 20+
- OpenCode CLI (`opencode`)

## Local setup

```bash
bun install
npm install -g opencode-ai
```

## Run the plugin from source

For local development, point `opencode.json` at the source entrypoint:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["file:///absolute/path/to/opensearch/src/index.ts"]
}
```

This keeps the published package path in `README.md` while still giving contributors a zero-publish development loop.

## Validate changes

Run the full validation pipeline before opening a pull request:

```bash
bun run check
```

That runs:

1. `bun run typecheck`
2. `bun run test`
3. `bun run build`

Acceptance tests are integration-heavy and boot a real OpenCode server process.

## Docs

Install docs dependencies:

```bash
python3 -m pip install -r requirements-docs.txt
```

Run the local docs server:

```bash
mkdocs serve
```

Build docs with strict link validation:

```bash
mkdocs build --strict
```

## Release automation

This repo uses `semantic-release` on `main`.

- Prefer Conventional Commits for merge commits and direct commits to `main`
- Run `bun run release:dry-run` locally if you want to preview the next release
- npm publishing now uses GitHub Actions trusted publishing via OIDC for `@kagan-sh/opensearch`
- The npm package must be linked to this repository under the `kagan_sh` publisher account before the first release
- Local `semantic-release --dry-run` still fails auth checks unless GitHub and npm credentials are present; the OIDC npm path is validated in GitHub Actions, not in a regular local shell

## Project structure

- `src/index.ts` plugin entrypoint, source selection, and response assembly
- `src/schema.ts` zod schemas and JSON schema export
- `src/sources/*` source adapters for session, web, and code search
- `src/synth.ts` structured synthesis through `session.prompt`
- `tests/*` vitest coverage for schema and end-to-end plugin behavior
- `SKILL.md` optional skill guidance that nudges agent workflows toward `opensearch` for broad research tasks

## Testing policy

- Prefer acceptance-first coverage for behavior changes
- Test observable outcomes instead of internal wiring
- Avoid tautological tests and unnecessary mocks
- Mock only when the real contract cannot be exercised in runtime tests

## Release workflow

- CI workflow: `.github/workflows/ci.yml`
- Release workflow: `.github/workflows/release.yml`
- GitHub releases are automated with `semantic-release`
- npm publishing is configured to publish through OIDC without a long-lived npm token

## Pull requests

- Keep changes small and focused
- Add or update tests for behavior changes
- Keep `README.md` user-facing and keep contributor workflow details in `CONTRIBUTING.md`
