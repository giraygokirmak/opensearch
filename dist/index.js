import { Plugin as V2Plugin } from "@opencode/plugin";
import { tool } from "@opencode-ai/plugin";
import { defaultConfig, parsePluginConfig, parsePluginOptions, resolveSources, } from "./config.js";
import { noResultsResult, noSourcesResult, rawResultsResult, runSourceSearches, synthesizedResult, } from "./orchestrator.js";
import { DEPTHS, ResultSchema, SOURCE_IDS, toolInputJsonSchema, } from "./schema.js";
import { synthesize } from "./synth.js";
const BRAND = "OpenSearch";
const TAGLINE = "evidence-backed search";
const BRAND_ORIGIN = "@kagan-sh/opensearch";
const TOOL_DESCRIPTION = "OpenSearch // evidence-backed search across session history, SearXNG web search, and public code. Use it for broad investigation, comparison, docs gathering, and cross-source research.";
function sourceBadge(source) {
    if (source === "session")
        return "SESSION";
    if (source === "web")
        return "WEB";
    return "CODE";
}
function sourceBadges(sources) {
    if (sources.length === 0)
        return ["OFFLINE"];
    return sources.map(sourceBadge);
}
function serialize(result) {
    return JSON.stringify(result, null, 2);
}
function previewQuery(query, max = 64) {
    if (query.length <= max)
        return query;
    return `${query.slice(0, max - 1)}...`;
}
function describeSources(sources) {
    if (sources.length === 0)
        return "no sources";
    if (sources.length === 1)
        return `${sources[0]} only`;
    if (sources.length === 2)
        return `${sources[0]} + ${sources[1]}`;
    return "session + web + code";
}
function runningTitle(sources) {
    if (sources.length === 0)
        return `${BRAND} // checking sources`;
    return `${BRAND} // scanning ${describeSources(sources)}`;
}
function doneTitle(result) {
    if (result.status === "no_sources")
        return `${BRAND} // unavailable`;
    if (result.status === "no_results")
        return `${BRAND} // no matches`;
    if (result.status === "raw") {
        return `${BRAND} // ${result.meta.sources_yielded} raw result${result.meta.sources_yielded === 1 ? "" : "s"}`;
    }
    if (result.status === "raw_fallback")
        return `${BRAND} // evidence fallback`;
    return `${BRAND} // ${result.meta.sources_yielded} result${result.meta.sources_yielded === 1 ? "" : "s"}`;
}
function statusNote(phase, sources) {
    if (phase === "searching") {
        if (sources.length === 0)
            return "checking available sources";
        return `scanning ${describeSources(sources)}`;
    }
    if (phase === "synthesizing")
        return "assembling evidence";
    return undefined;
}
function toolMetadata(input) {
    const note = statusNote(input.phase, input.sources);
    return {
        brand: BRAND,
        brand_tagline: TAGLINE,
        brand_origin: BRAND_ORIGIN,
        brand_surface: "plugin",
        phase: input.phase,
        query: previewQuery(input.query),
        depth: input.depth,
        sources: input.sources,
        source_summary: describeSources(input.sources),
        source_badges: sourceBadges(input.sources),
        ...(note ? { status_note: note } : {}),
        ...(input.rawResults !== undefined ? { raw_results: input.rawResults } : {}),
        ...(input.fallback ? { fallback: input.fallback } : {}),
        ...(input.result
            ? {
                status: input.result.status,
                answer: input.result.answer,
                duration_ms: input.result.meta.duration,
                sources_requested: input.result.meta.sources_requested,
                sources_queried: input.result.meta.sources_queried,
                sources_yielded: input.result.meta.sources_yielded,
                source_errors: input.result.meta.source_errors.length,
                sources_unavailable: input.result.meta.sources_unavailable,
            }
            : {}),
    };
}
function parseResultOutput(output) {
    try {
        const parsed = ResultSchema.safeParse(JSON.parse(output));
        return parsed.success ? parsed.data : undefined;
    }
    catch {
        return undefined;
    }
}
function parseRequestedSources(value) {
    if (!Array.isArray(value))
        return undefined;
    return value.filter((source) => typeof source === "string" && SOURCE_IDS.includes(source));
}
function completionMetadata(input) {
    const resolved = resolveSources(input.cfg, input.requested);
    const sources = input.requested ?? resolved.sources;
    return toolMetadata({
        phase: "completed",
        query: input.result.meta.query,
        depth: input.depth,
        sources,
        result: input.result,
        fallback: input.fallback,
    });
}
async function executeOpensearch(input) {
    const start = Date.now();
    const searchDepth = input.args.depth ?? input.cfg.depth;
    const resolved = resolveSources(input.cfg, input.args.sources);
    await input.report({
        title: runningTitle(resolved.sources),
        metadata: toolMetadata({
            phase: "searching",
            query: input.args.query,
            depth: searchDepth,
            sources: resolved.sources,
        }),
    });
    const finish = async (result) => {
        await input.report({
            title: doneTitle(result),
            metadata: toolMetadata({
                phase: "completed",
                query: input.args.query,
                depth: searchDepth,
                sources: resolved.sources,
                result,
            }),
        });
        return serialize(result);
    };
    if (resolved.sources.length === 0) {
        return await finish(noSourcesResult({
            query: input.args.query,
            start,
            requested: resolved.requested,
            unavailable: resolved.unavailable,
        }));
    }
    const search = await runSourceSearches({
        client: input.client,
        directory: input.directory,
        config: input.cfg,
        query: input.args.query,
        depth: searchDepth,
        sources: resolved.sources,
    });
    if (search.raw.length === 0) {
        return await finish(noResultsResult({
            query: input.args.query,
            start,
            requested: resolved.requested,
            queried: resolved.sources,
            unavailable: resolved.unavailable,
            sourceErrors: search.sourceErrors,
        }));
    }
    if (!input.cfg.synth) {
        return await finish(rawResultsResult({
            query: input.args.query,
            start,
            requested: resolved.requested,
            queried: resolved.sources,
            unavailable: resolved.unavailable,
            sourceErrors: search.sourceErrors,
            raw: search.raw,
            status: "raw",
        }));
    }
    await input.report({
        title: `${BRAND} // assembling evidence`,
        metadata: {
            ...toolMetadata({
                phase: "synthesizing",
                query: input.args.query,
                depth: searchDepth,
                sources: resolved.sources,
            }),
            raw_results: search.raw.length,
        },
    });
    try {
        const synthesis = await synthesize(input.client, input.directory, search.raw, input.args.query);
        return await finish(synthesizedResult({
            query: input.args.query,
            start,
            requested: resolved.requested,
            queried: resolved.sources,
            unavailable: resolved.unavailable,
            sourceErrors: search.sourceErrors,
            raw: search.raw,
            synthesis,
        }));
    }
    catch {
        const result = rawResultsResult({
            query: input.args.query,
            start,
            requested: resolved.requested,
            queried: resolved.sources,
            unavailable: resolved.unavailable,
            sourceErrors: search.sourceErrors,
            raw: search.raw,
            status: "raw_fallback",
        });
        await input.report({
            title: doneTitle(result),
            metadata: {
                ...toolMetadata({
                    phase: "completed",
                    query: input.args.query,
                    depth: searchDepth,
                    sources: resolved.sources,
                    result,
                }),
                fallback: "synthesis_error",
            },
        });
        return serialize(result);
    }
}
const v2 = V2Plugin.define({
    id: "opensearch",
    async setup(ctx) {
        const cfg = parsePluginOptions(ctx.options) ?? defaultConfig();
        const directory = ctx.location.directory;
        await ctx.tool.transform((editor) => {
            editor.add({
                name: "opensearch",
                description: "OpenSearch // evidence-backed search. Queries session history, SearXNG web search, and public code in parallel, then returns a structured answer with explicit status and source metadata.",
                input: toolInputJsonSchema(),
                async execute(args, context) {
                    const content = await executeOpensearch({
                        args: args,
                        directory,
                        cfg,
                        client: ctx,
                        report(update) {
                            return context.progress({
                                ...(update.title ? { title: update.title } : {}),
                                ...update.metadata,
                            });
                        },
                    });
                    return { content };
                },
            });
        });
        await ctx.tool.hook("execute.after", (event) => {
            if (event.tool !== "opensearch")
                return;
            if (event.status !== "completed")
                return;
            const output = event.result.content;
            const text = typeof output === "string"
                ? output
                : Array.isArray(output)
                    ? output
                        .filter((part) => part.type === "text")
                        .map((part) => part.text)
                        .join("\n")
                    : undefined;
            if (!text)
                return;
            const result = parseResultOutput(text);
            if (!result)
                return;
            const metadata = completionMetadata({
                result,
                cfg,
                requested: parseRequestedSources(event.input?.sources),
                depth: typeof event.input?.depth ===
                    "string"
                    ? event.input.depth
                    : cfg.depth,
            });
            event.result.metadata = {
                ...(event.result.metadata ?? {}),
                ...metadata,
            };
        });
    },
});
export const OpensearchPlugin = async (pluginCtx) => {
    let cfg = defaultConfig();
    return {
        async config(input) {
            const next = parsePluginConfig(input);
            if (next)
                cfg = next;
        },
        "tool.definition": async (input, output) => {
            if (input.toolID !== "opensearch")
                return;
            output.description = TOOL_DESCRIPTION;
        },
        "tool.execute.after": async (input, output) => {
            if (input.tool !== "opensearch")
                return;
            const result = parseResultOutput(output.output);
            if (!result)
                return;
            const requested = parseRequestedSources(input.args?.sources);
            output.title = doneTitle(result);
            output.metadata = {
                ...(output.metadata ?? {}),
                ...completionMetadata({
                    result,
                    cfg,
                    requested,
                    depth: input.args && typeof input.args.depth === "string"
                        ? input.args.depth
                        : cfg.depth,
                }),
            };
        },
        tool: {
            opensearch: tool({
                description: "OpenSearch // evidence-backed search. Queries session history, SearXNG web search, and public code in parallel, then returns a structured answer with explicit status and source metadata.",
                args: {
                    query: tool.schema.string().describe("What to search for"),
                    sources: tool.schema
                        .array(tool.schema.enum(SOURCE_IDS))
                        .optional()
                        .describe("Sources to query. Defaults to all enabled."),
                    depth: tool.schema
                        .enum(DEPTHS)
                        .optional()
                        .describe("Search depth. Default: quick"),
                },
                async execute(args, context) {
                    return executeOpensearch({
                        args,
                        directory: context.directory,
                        cfg,
                        client: pluginCtx.client,
                        report(update) {
                            context.metadata(update);
                            return undefined;
                        },
                    });
                },
            }),
        },
    };
};
export default {
    ...v2,
    server: OpensearchPlugin,
};
/**
 * Build the minimal V2 domain context (`session.list` + `session.context`)
 * the tool needs, from a connected V2 OpenCode client. Domain methods already
 * scope to the location; session-source calls additionally pin `directory`.
 */
export function createV2ToolClient(client) {
    return client;
}
