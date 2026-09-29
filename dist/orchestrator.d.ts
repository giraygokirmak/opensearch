import type { SessionSearchClient } from "./sources/session.js";
import type { Config, RawResult, Result, Source, SourceError, SourceId, Synthesis } from "./schema.js";
export declare function normalize(raw: RawResult): Source;
export declare function runSourceSearches(input: {
    client?: SessionSearchClient;
    directory: string;
    config: Config;
    query: string;
    depth: Config["depth"];
    sources: SourceId[];
}): Promise<{
    raw: {
        id: string;
        type: "session" | "web" | "code";
        title: string;
        snippet: string;
        relevance: number;
        url?: string | undefined;
        timestamp?: number | undefined;
    }[];
    sourceErrors: {
        code: "unavailable" | "request_failed" | "invalid_response";
        message: string;
        source: "session" | "web" | "code";
    }[];
}>;
export declare function noSourcesResult(input: {
    query: string;
    start: number;
    requested: SourceId[];
    unavailable: SourceId[];
}): Result;
export declare function noResultsResult(input: {
    query: string;
    start: number;
    requested: SourceId[];
    queried: SourceId[];
    unavailable: SourceId[];
    sourceErrors: SourceError[];
}): Result;
export declare function rawResultsResult(input: {
    query: string;
    start: number;
    requested: SourceId[];
    queried: SourceId[];
    unavailable: SourceId[];
    sourceErrors: SourceError[];
    raw: RawResult[];
    status: "raw" | "raw_fallback";
}): Result;
export declare function synthesizedResult(input: {
    query: string;
    start: number;
    requested: SourceId[];
    queried: SourceId[];
    unavailable: SourceId[];
    sourceErrors: SourceError[];
    raw: RawResult[];
    synthesis: Synthesis;
}): Result;
