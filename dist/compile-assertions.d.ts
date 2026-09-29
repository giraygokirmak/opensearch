import type { Plugin } from "@opencode/plugin";
type PluginDefinition = ReturnType<typeof Plugin.define>;
type Context = Parameters<PluginDefinition["setup"]>[0];
/**
 * The V2 `ctx.session` intentionally does NOT satisfy `SessionSearchClient`:
 * the plugin API's session domain excludes `list`, so session search is
 * `unavailable` on the V2 tool at runtime. This assertion pins that contract
 * so a future OpenCode release that restores session listing flips this
 * file's typecheck and we can re-enable the source.
 */
export declare function v2ContextLacksSessionListing(ctxSession: Context["session"]): import("@opencode/plugin/promise/session").SessionDomain;
export declare function assertContextUsable(): {
    text(input: {
        prompt: string;
    }): Promise<{
        text: string;
    }>;
};
export {};
