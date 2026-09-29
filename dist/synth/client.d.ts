import type { createOpencodeClient } from "@opencode-ai/sdk";
/**
 * V1 synthesis client: the OpenCode SDK client exposed to V1 plugins.
 */
export type V1SynthClient = Pick<ReturnType<typeof createOpencodeClient>, "session">;
/**
 * V2 synthesis client: sessionless text generation from the plugin context
 * (`ctx.generate.text`).
 */
export type V2SynthClient = {
    generate: {
        text(input: {
            prompt: string;
        }): Promise<{
            text: string;
        }>;
    };
};
export type SynthClient = V1SynthClient | V2SynthClient;
export declare function isV2SynthClient(client: SynthClient): client is V2SynthClient;
