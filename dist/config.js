import { ConfigSchema, SOURCE_IDS } from "./schema.js";
function parseBoolean(name, value, fallback) {
    if (value === undefined)
        return fallback;
    if (value === "true")
        return true;
    if (value === "false")
        return false;
    throw new Error(`Invalid value for ${name}: expected true or false, got ${value}`);
}
function parseDepth(value) {
    if (value === undefined || value === "quick")
        return "quick";
    if (value === "thorough")
        return "thorough";
    throw new Error(`Invalid value for OPENSEARCH_DEPTH: expected quick or thorough, got ${value}`);
}
function formatIssuePath(path) {
    if (path.length === 0)
        return "opensearch";
    return `opensearch.${path.join(".")}`;
}
export function defaultConfig() {
    return {
        sources: {
            session: parseBoolean("OPENSEARCH_SOURCE_SESSION", process.env.OPENSEARCH_SOURCE_SESSION, true),
            web: {
                enabled: parseBoolean("OPENSEARCH_SOURCE_WEB", process.env.OPENSEARCH_SOURCE_WEB, true),
                url: process.env.OPENSEARCH_WEB_URL,
            },
            code: parseBoolean("OPENSEARCH_SOURCE_CODE", process.env.OPENSEARCH_SOURCE_CODE, true),
        },
        depth: parseDepth(process.env.OPENSEARCH_DEPTH),
        synth: parseBoolean("OPENSEARCH_SYNTH", process.env.OPENSEARCH_SYNTH, true),
    };
}
export function mcpDefaultConfig() {
    return {
        sources: {
            session: false,
            web: {
                enabled: parseBoolean("OPENSEARCH_SOURCE_WEB", process.env.OPENSEARCH_SOURCE_WEB, true),
                url: process.env.OPENSEARCH_WEB_URL,
            },
            code: parseBoolean("OPENSEARCH_SOURCE_CODE", process.env.OPENSEARCH_SOURCE_CODE, true),
        },
        depth: parseDepth(process.env.OPENSEARCH_DEPTH),
        synth: false,
    };
}
function toError(parsed) {
    const issues = parsed.error.issues
        .map((issue) => `${formatIssuePath(issue.path)} ${issue.message}`)
        .join("; ");
    return new Error(`Invalid opensearch config: ${issues}`);
}
/**
 * V1 plugin entrypoint: receives the whole OpenCode config and reads the
 * top-level `opensearch` field.
 */
export function parsePluginConfig(input) {
    if (!input || typeof input !== "object" || !("opensearch" in input)) {
        return undefined;
    }
    const parsed = ConfigSchema.safeParse(input.opensearch);
    if (parsed.success)
        return parsed.data;
    throw toError(parsed);
}
/**
 * V2 plugin options: reads `opensearch` from the plugin's own options object
 * (the `options` field of the plugin entry in `plugins`).
 */
export function parsePluginOptions(input) {
    if (!input || typeof input !== "object" || !("opensearch" in input)) {
        return undefined;
    }
    const parsed = ConfigSchema.safeParse(input.opensearch);
    if (parsed.success)
        return parsed.data;
    throw toError(parsed);
}
export function isSourceAvailable(config, source) {
    if (source === "session")
        return config.sources.session;
    if (source === "web") {
        return config.sources.web.enabled && Boolean(config.sources.web.url);
    }
    return config.sources.code;
}
export function resolveSources(config, requested) {
    const requestedSources = Array.from(new Set(requested ?? SOURCE_IDS));
    const sources = requestedSources.filter((source) => isSourceAvailable(config, source));
    const unavailable = requestedSources.filter((source) => !isSourceAvailable(config, source));
    return {
        requested: requestedSources,
        sources,
        unavailable,
    };
}
