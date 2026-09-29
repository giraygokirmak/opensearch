import type { SessionSearchClient } from "./sources/session.js";
import type {
  Config,
  RawResult,
  Result,
  ResultStatus,
  Source,
  SourceError,
  SourceId,
  Synthesis,
} from "./schema.js";
import { searchCode } from "./sources/code.js";
import { searchSessions } from "./sources/session.js";
import { failure } from "./sources/shared.js";
import { searchWeb } from "./sources/web.js";

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function normalize(raw: RawResult): Source {
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    snippet: raw.snippet,
    url: raw.url,
    relevance: clampUnit(raw.relevance),
    timestamp: raw.timestamp,
  };
}

function resultMeta(input: {
  query: string;
  start: number;
  requested: SourceId[];
  queried: SourceId[];
  yielded: number;
  unavailable: SourceId[];
  sourceErrors: SourceError[];
}): Result["meta"] {
  return {
    query: input.query,
    duration: Date.now() - input.start,
    sources_requested: input.requested.length,
    sources_queried: input.queried.length,
    sources_yielded: input.yielded,
    sources_unavailable: input.unavailable,
    source_errors: input.sourceErrors,
  };
}

function createResult(input: {
  status: ResultStatus;
  answer: string;
  confidence: Result["confidence"];
  evidence: Result["evidence"];
  sources: Source[];
  followups: string[];
  meta: Result["meta"];
}): Result {
  return {
    status: input.status,
    answer: input.answer,
    confidence: input.confidence,
    evidence: input.evidence,
    sources: input.sources,
    followups: input.followups,
    meta: input.meta,
  };
}

export async function runSourceSearches(input: {
  client?: SessionSearchClient;
  directory: string;
  config: Config;
  query: string;
  depth: Config["depth"];
  sources: SourceId[];
}) {
  const outcomes = await Promise.all(
    input.sources.map((source) => {
      if (source === "session") {
        if (!input.client) {
          return failure("session", "unavailable", "Session search requires the OpenCode runtime.");
        }
        return searchSessions(
          input.client,
          input.directory,
          input.query,
          input.depth,
        );
      }

      if (source === "web") {
        return searchWeb(input.query, input.config.sources.web.url, input.depth);
      }

      return searchCode(input.query, input.depth);
    }),
  );

  return {
    raw: outcomes.flatMap((outcome) => outcome.results),
    sourceErrors: outcomes.flatMap((outcome) =>
      outcome.error ? [outcome.error] : [],
    ),
  };
}

export function noSourcesResult(input: {
  query: string;
  start: number;
  requested: SourceId[];
  unavailable: SourceId[];
}): Result {
  return createResult({
    status: "no_sources",
    answer: "No sources available",
    confidence: "none",
    evidence: [],
    sources: [],
    followups: [
      "Enable at least one search source in opensearch config",
      "Set OPENSEARCH_WEB_URL to enable web search",
    ],
    meta: resultMeta({
      query: input.query,
      start: input.start,
      requested: input.requested,
      queried: [],
      yielded: 0,
      unavailable: input.unavailable,
      sourceErrors: [],
    }),
  });
}

export function noResultsResult(input: {
  query: string;
  start: number;
  requested: SourceId[];
  queried: SourceId[];
  unavailable: SourceId[];
  sourceErrors: SourceError[];
}): Result {
  const followups = [
    `Use broader terms for: ${input.query}`,
    `Search only web for: ${input.query}`,
  ];

  if (input.sourceErrors.length > 0) {
    followups.unshift("Inspect meta.source_errors for failed search sources");
  }

  return createResult({
    status: "no_results",
    answer: "No results found",
    confidence: "none",
    evidence: [],
    sources: [],
    followups,
    meta: resultMeta({
      query: input.query,
      start: input.start,
      requested: input.requested,
      queried: input.queried,
      yielded: 0,
      unavailable: input.unavailable,
      sourceErrors: input.sourceErrors,
    }),
  });
}

export function rawResultsResult(input: {
  query: string;
  start: number;
  requested: SourceId[];
  queried: SourceId[];
  unavailable: SourceId[];
  sourceErrors: SourceError[];
  raw: RawResult[];
  status: "raw" | "raw_fallback";
}): Result {
  const answer =
    input.status === "raw"
      ? "Raw results (synthesis disabled)"
      : "Unable to synthesize structured answer. Returning raw evidence.";
  const followups =
    input.status === "raw"
      ? [
          `Enable synthesis for: ${input.query}`,
          `Filter to one source for: ${input.query}`,
        ]
      : [
          `Refine: ${input.query}`,
          `Find contradictory sources for: ${input.query}`,
        ];

  return createResult({
    status: input.status,
    answer,
    confidence: "none",
    evidence: [],
    sources: input.raw.map(normalize),
    followups,
    meta: resultMeta({
      query: input.query,
      start: input.start,
      requested: input.requested,
      queried: input.queried,
      yielded: input.raw.length,
      unavailable: input.unavailable,
      sourceErrors: input.sourceErrors,
    }),
  });
}

export function synthesizedResult(input: {
  query: string;
  start: number;
  requested: SourceId[];
  queried: SourceId[];
  unavailable: SourceId[];
  sourceErrors: SourceError[];
  raw: RawResult[];
  synthesis: Synthesis;
}): Result {
  return createResult({
    status: "ok",
    answer: input.synthesis.answer,
    confidence: input.synthesis.confidence,
    evidence: input.synthesis.evidence,
    sources: input.raw.map(normalize),
    followups: input.synthesis.followups,
    meta: resultMeta({
      query: input.query,
      start: input.start,
      requested: input.requested,
      queried: input.queried,
      yielded: input.raw.length,
      unavailable: input.unavailable,
      sourceErrors: input.sourceErrors,
    }),
  });
}
