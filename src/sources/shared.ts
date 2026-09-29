import type { RawResult, SourceError, SourceId } from "../schema.js";

export type SourceSearchOutcome = {
  source: SourceId;
  results: RawResult[];
  error?: SourceError;
};

export function sourceError(
  source: SourceId,
  code: SourceError["code"],
  message: string,
): SourceError {
  return {
    source,
    code,
    message,
  };
}

export function failure(
  source: SourceId,
  code: SourceError["code"],
  message: string,
): SourceSearchOutcome {
  return {
    source,
    results: [],
    error: sourceError(source, code, message),
  };
}

export function messageFromError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return String(error);
}
