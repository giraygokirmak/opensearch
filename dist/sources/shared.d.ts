import type { RawResult, SourceError, SourceId } from "../schema.js";
export type SourceSearchOutcome = {
    source: SourceId;
    results: RawResult[];
    error?: SourceError;
};
export declare function sourceError(source: SourceId, code: SourceError["code"], message: string): SourceError;
export declare function failure(source: SourceId, code: SourceError["code"], message: string): SourceSearchOutcome;
export declare function messageFromError(error: unknown): string;
