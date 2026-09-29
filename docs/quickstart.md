---
title: Quickstart
description: Install @kagan-sh/opensearch and run it from OpenCode or Claude Code.
---

# Quickstart

Board up. Search available. Under five minutes.

!!! tip "Using Claude Code? One command is all you need."
    ```bash
    claude mcp add opensearch -- npx -y @kagan-sh/opensearch
    ```
    Full details in the [Claude Code install guide](guides/claude-code.md).

## 1. Install the plugin (OpenCode)

Add the package to `opencode.json`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["@kagan-sh/opensearch"]
}
```

OpenCode installs npm plugins automatically at startup. On OpenCode V1, use the legacy `plugin` key instead of `plugins`; the plugin supports both.

## 2. Enable optional web search

The `web` source uses `SearXNG`, so web search needs a SearXNG instance with `format=json` enabled.

```bash
export OPENSEARCH_WEB_URL="http://localhost:8080"
```

See [SearXNG setup](guides/searxng.md) for the exact instance requirements.

## 3. Use it when the task is broad

Reach for `opensearch` when you need to search, compare evidence, gather official docs, or combine local context with public references.

Good prompts:

- "Search how this repo handles plugin loading and compare it with official docs"
- "Look into rate limiting patterns for SearXNG and grep.app"
- "Gather evidence for how source adapters should be extended"

## 4. Narrow the search when needed

The tool accepts:

- `query`
- `sources?: ("session" | "web" | "code")[]` (OpenCode: all three; Claude Code: `"web"` and `"code"` only)
- `depth?: "quick" | "thorough"`

Examples:

```json
{
  "query": "plugin loading order",
  "sources": ["code"],
  "depth": "quick"
}
```

```json
{
  "query": "semantic-release trusted publishing github actions",
  "sources": ["web"],
  "depth": "thorough"
}
```

## 5. Read the result status first

The response always includes an explicit `status`.

- `ok` means synthesis succeeded (OpenCode only)
- `raw` means raw results were returned
- `raw_fallback` means source collection worked but synthesis failed (OpenCode only)
- `no_sources` means nothing eligible could run
- `no_results` means searches ran but returned no usable evidence

See [Result contract](reference/result-contract.md) for the full shape.
