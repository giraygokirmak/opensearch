#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { mcpDefaultConfig, resolveSources } from "./config.js";
import {
  noResultsResult,
  noSourcesResult,
  rawResultsResult,
  runSourceSearches,
} from "./orchestrator.js";
import { SOURCE_IDS, type SourceId } from "./schema.js";

function serialize(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function parseSourceIds(raw: unknown): SourceId[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.filter(
    (s): s is SourceId => typeof s === "string" && SOURCE_IDS.includes(s as SourceId),
  );
}

const config = mcpDefaultConfig();

const server = new Server(
  { name: "opensearch", version: "0.0.1" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "opensearch",
      description:
        "Evidence-backed search across SearXNG web and public code. Returns structured JSON with sources, relevance scores, and follow-up suggestions.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "What to search for",
          },
          sources: {
            type: "array",
            items: { type: "string", enum: ["web", "code"] },
            description: "Sources to query. Defaults to all enabled.",
          },
          depth: {
            type: "string",
            enum: ["quick", "thorough"],
            description: "Search depth. Default: quick",
          },
        },
        required: ["query"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "opensearch") {
    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
    };
  }

  const args = request.params.arguments ?? {};
  const query = typeof args.query === "string" ? args.query : "";
  const depth =
    args.depth === "thorough" ? ("thorough" as const) : config.depth;
  const start = Date.now();
  const requested = parseSourceIds(args.sources);
  const resolved = resolveSources(config, requested);

  if (resolved.sources.length === 0) {
    const result = noSourcesResult({
      query,
      start,
      requested: resolved.requested,
      unavailable: resolved.unavailable,
    });
    return { content: [{ type: "text", text: serialize(result) }] };
  }

  const search = await runSourceSearches({
    directory: process.cwd(),
    config,
    query,
    depth,
    sources: resolved.sources,
  });

  if (search.raw.length === 0) {
    const result = noResultsResult({
      query,
      start,
      requested: resolved.requested,
      queried: resolved.sources,
      unavailable: resolved.unavailable,
      sourceErrors: search.sourceErrors,
    });
    return { content: [{ type: "text", text: serialize(result) }] };
  }

  const result = rawResultsResult({
    query,
    start,
    requested: resolved.requested,
    queried: resolved.sources,
    unavailable: resolved.unavailable,
    sourceErrors: search.sourceErrors,
    raw: search.raw,
    status: "raw",
  });
  return { content: [{ type: "text", text: serialize(result) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
