import type { Depth, RawResult } from "../schema.js";
import { failure, messageFromError, type SourceSearchOutcome } from "./shared.js";

type Hit = {
  repo?: { raw?: string };
  path?: { raw?: string };
  content?: { snippet?: string };
  score?: number;
};

type Body = {
  hits?: {
    hits?: Hit[];
  };
};

export async function searchCode(
  query: string,
  depth: Depth,
): Promise<SourceSearchOutcome> {
  const source = "code" as const;
  try {
    const url = `https://grep.app/api/search?q=${encodeURIComponent(query)}&limit=${depth === "quick" ? 5 : 10}`;
    const res = await fetch(url);
    if (!res.ok) {
      return failure(
        source,
        "request_failed",
        `grep.app search failed with status ${res.status}.`,
      );
    }

    const body = (await res.json()) as Body;
    if (body.hits && !Array.isArray(body.hits.hits)) {
      return failure(
        source,
        "invalid_response",
        "grep.app search returned an invalid payload.",
      );
    }

    const list = body.hits?.hits ?? [];

    return {
      source,
      results: list.map((hit, i) => {
        const repo = hit.repo?.raw ?? "unknown";
        const path = hit.path?.raw ?? "";
        return {
          id: `code-${repo}-${path}-${i}`,
          type: source,
          title: path ? `${repo}/${path}` : repo,
          snippet: (hit.content?.snippet ?? "").slice(0, 700),
          url: `https://grep.app/search?q=${encodeURIComponent(query)}`,
          relevance:
            typeof hit.score === "number"
              ? Math.min(1, Math.max(0, hit.score / 100))
              : 0.5,
        } satisfies RawResult;
      }),
    };
  } catch (error) {
    return failure(
      source,
      "request_failed",
      `grep.app search failed: ${messageFromError(error)}`,
    );
  }
}
