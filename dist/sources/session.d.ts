import type { Depth } from "../schema.js";
import { type SourceSearchOutcome } from "./shared.js";
type V1Client = {
    session: {
        list(input: {
            query: {
                directory: string;
            };
        }): Promise<{
            data?: Array<{
                id: string;
                title: string;
                time: {
                    updated: number;
                };
            }>;
        }>;
        messages(input: {
            path: {
                id: string;
            };
            query: {
                directory: string;
                limit: number;
            };
        }): Promise<{
            data?: Array<{
                parts: Array<{
                    type: string;
                    text?: string;
                }>;
            }>;
        }>;
    };
};
type V2Message = {
    type: string;
    text?: string;
    /** Synthetic/session messages may carry `payload.text` instead of `text`. */
    payload?: {
        text?: string;
    };
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
};
type V2SessionList = {
    data?: Array<{
        id: string;
        title?: string;
        time: {
            updated: number;
        };
    }>;
};
type V2Client = {
    session: {
        /**
         * Only present on the full V2 HTTP client; the V2 plugin context's session
         * domain omits it. At runtime, missing `list` yields an explicit
         * `unavailable` outcome.
         */
        list?(input?: {
            directory?: string;
        }): Promise<V2SessionList>;
        context(input: {
            sessionID: string;
        }): Promise<V2Message[]>;
    };
};
/**
 * Minimal structural surface for session search.
 *
 * - V1 supplies the SDK client (list + read).
 * - The full V2 HTTP client (`@opencode/client`) can list + read.
 * - The V2 **plugin context** can read message context but cannot list
 *   sessions, so the session source reports `unavailable` there rather than
 *   silently failing.
 */
export type SessionSearchClient = V1Client | V2Client;
export declare function searchSessions(client: SessionSearchClient, directory: string, query: string, depth: Depth): Promise<SourceSearchOutcome>;
export {};
