import { Plugin as V2Plugin } from "@opencode/plugin";
import type { Plugin as V1Plugin } from "@opencode-ai/plugin";
import type { V2SynthClient } from "./synth/client.js";
type SearchClient = import("./sources/session").SessionSearchClient | undefined;
export declare const OpensearchPlugin: V1Plugin;
declare const _default: {
    server: V1Plugin;
    id: string;
    setup: (context: V2Plugin.Context) => Promise<V2Plugin.Cleanup | void> | V2Plugin.Cleanup | void;
};
export default _default;
/**
 * Build the minimal V2 domain context (`session.list` + `session.context`)
 * the tool needs, from a connected V2 OpenCode client. Domain methods already
 * scope to the location; session-source calls additionally pin `directory`.
 */
export declare function createV2ToolClient(client: {
    session: {
        list(input?: {
            directory?: string;
        }): Promise<{
            data: Array<{
                id: string;
                title?: string;
                time: {
                    updated: number;
                };
            }>;
        }>;
        context(input: {
            sessionID: string;
        }): Promise<Array<{
            type: string;
            text?: string;
            content?: Array<{
                type: string;
                text?: string;
                state?: {
                    status?: string;
                    content?: Array<{
                        type: string;
                        text?: string;
                    }>;
                };
            }>;
        }>>;
    };
    generate: {
        text(input: {
            prompt: string;
        }): Promise<{
            text: string;
        }>;
    };
}): SearchClient & V2SynthClient;
