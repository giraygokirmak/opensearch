import type { Config, SourceId } from "./schema.js";
export declare function defaultConfig(): Config;
export declare function mcpDefaultConfig(): Config;
/**
 * V1 plugin entrypoint: receives the whole OpenCode config and reads the
 * top-level `opensearch` field.
 */
export declare function parsePluginConfig(input: unknown): Config | undefined;
/**
 * V2 plugin options: reads `opensearch` from the plugin's own options object
 * (the `options` field of the plugin entry in `plugins`).
 */
export declare function parsePluginOptions(input: unknown): Config | undefined;
export declare function isSourceAvailable(config: Config, source: SourceId): boolean;
export declare function resolveSources(config: Config, requested?: SourceId[]): {
    requested: ("session" | "web" | "code")[];
    sources: ("session" | "web" | "code")[];
    unavailable: ("session" | "web" | "code")[];
};
