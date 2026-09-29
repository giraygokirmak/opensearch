---
title: Contributing
description: Local development and validation workflow for @kagan-sh/opensearch.
---

# Contributing

Keep `README.md` user-facing. Put contributor workflow here.

## Requirements

- Bun 1.2+
- Node 20+
- OpenCode CLI (`opencode`)
- Python 3.11+

## Local setup

```bash
bun install
npm install -g opencode-ai
python3 -m pip install -r requirements-docs.txt
```

## Run from source

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["file:///absolute/path/to/opensearch/src/index.ts"]
}
```

## Validate

```bash
bun run check
mkdocs build --strict
```

`bun run check` runs typecheck and tests. Build with `bun tsc` (there is no
top-level `build` npm script so git-based installs are not marked as needing
preparation).

## Release

- releases run through `semantic-release` on `main`
- npm publish runs through GitHub Actions trusted publishing via OIDC
- the docs site publishes from GitHub Pages

For maintainer detail, see the repository root `CONTRIBUTING.md`.
