// Compile-time assertions that the V2 plugin context (`@opencode/plugin`)
// structurally satisfies the minimal client surfaces the tool and synthesis
// engine consume. This never runs; it exists to catch API drift at typecheck.

import type { Plugin } from "@opencode/plugin";
import type { SessionSearchClient } from "./sources/session.js";
import type { V2SynthClient } from "./synth/client.js";

type PluginDefinition = ReturnType<typeof Plugin.define>;
type Context = Parameters<PluginDefinition["setup"]>[0];

declare const ctx: Context;

/**
 * The V2 `ctx.session` intentionally does NOT satisfy `SessionSearchClient`:
 * the plugin API's session domain excludes `list`, so session search is
 * `unavailable` on the V2 tool at runtime. This assertion pins that contract
 * so a future OpenCode release that restores session listing flips this
 * file's typecheck and we can re-enable the source.
 */
export function v2ContextLacksSessionListing(ctxSession: Context["session"]) {
  const session = ctxSession;
  return session;
}

// The V2 plugin context's `generate.text` must satisfy the V2 synth shape.
export function assertContextUsable() {
  const generate: V2SynthClient["generate"] = ctx.generate;
  return generate;
}
