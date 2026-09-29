---
title: Configuration
description: Runtime configuration for @kagan-sh/opensearch.
---

# Configuration

OpenSearch is configured with environment variables. The OpenCode plugin also accepts plugin config in `opencode.json`.

## Environment variables

The current `web` provider is `SearXNG`.

| Variable | Default | Meaning |
| --- | --- | --- |
| `OPENSEARCH_WEB_URL` | unset | Base URL for the `web` source SearXNG instance |
| `OPENSEARCH_SOURCE_WEB` | `true` | Enable web search (requires URL above) |
| `OPENSEARCH_SOURCE_CODE` | `true` | Enable public code search |
| `OPENSEARCH_DEPTH` | `quick` | Default search depth |
| `OPENSEARCH_SOURCE_SESSION` | `true` | Enable session-history search |
| `OPENSEARCH_SYNTH` | `true` | Enable structured synthesis after collecting raw results |

!!! note "Defaults differ in Claude Code MCP mode"
    `OPENSEARCH_SOURCE_SESSION` and `OPENSEARCH_SYNTH` are always `false` in MCP mode because they depend on the OpenCode runtime. Claude Code synthesizes results natively. All other defaults are the same.

## OpenCode plugin config shape

The `opensearch` config shape is the same on both OpenCode versions.

**V2** (native, `plugins` + `options`):

```jsonc
{
  "plugins": [
    {
      "package": "@kagan-sh/opensearch",
      "options": {
        "opensearch": {
          "sources": {
            "session": true,
            "web": { "enabled": true, "url": "http://localhost:8080" },
            "code": true
          },
          "depth": "quick",
          "synth": true
        }
      }
    }
  ]
}
```

**V1** (legacy, `plugin` + top-level config):

```jsonc
{
  "plugin": ["@kagan-sh/opensearch"],
  "opensearch": {
    "sources": {
      "session": true,
      "web": { "enabled": true, "url": "http://localhost:8080" },
      "code": true
    },
    "depth": "quick",
    "synth": true
  }
}
```

## Claude Code MCP config

Environment variables are passed through the MCP server definition:

```json
{
  "mcpServers": {
    "opensearch": {
      "command": "npx",
      "args": ["-y", "@kagan-sh/opensearch"],
      "env": {
        "OPENSEARCH_WEB_URL": "http://localhost:8080",
        "OPENSEARCH_DEPTH": "quick"
      }
    }
  }
}
```

See the [Claude Code install guide](../guides/claude-code.md) for setup instructions.

## Availability rules

- `session` is available when enabled (OpenCode only)
- `code` is available when enabled
- `web` is available only when enabled **and** `OPENSEARCH_WEB_URL` exists

If you request a source that is unavailable, the tool reports it explicitly in `meta.sources_unavailable`.

## Invalid config behavior

Invalid plugin config is not ignored.

The plugin fails explicitly so bad config does not silently degrade behavior.
