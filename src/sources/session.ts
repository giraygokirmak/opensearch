import type { Depth, RawResult } from "../schema.js";
import { failure, messageFromError, sourceError, type SourceSearchOutcome } from "./shared.js";

type V1Client = {
  session: {
    list(input: {
      query: { directory: string };
    }): Promise<{
      data?: Array<{ id: string; title: string; time: { updated: number } }>;
    }>;
    messages(input: {
      path: { id: string };
      query: { directory: string; limit: number };
    }): Promise<{
      data?: Array<{ parts: Array<{ type: string; text?: string }> }>;
    }>;
  };
};

type V2Message = {
  type: string;
  text?: string;
  /** Synthetic/session messages may carry `payload.text` instead of `text`. */
  payload?: { text?: string };
  content?: Array<{
    type: string;
    text?: string;
    state?: {
      status?: string;
      content?: Array<{ type: string; text?: string }>;
    };
  }>;
};

type V2SessionList = {
  data?: Array<{ id: string; title?: string; time: { updated: number } }>;
};

type V2Client = {
  session: {
    /**
     * Only present on the full V2 HTTP client; the V2 plugin context's session
     * domain omits it. At runtime, missing `list` yields an explicit
     * `unavailable` outcome.
     */
    list?(input?: { directory?: string }): Promise<V2SessionList>;
    context(input: { sessionID: string }): Promise<V2Message[]>;
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

function words(query: string) {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

function count(text: string, key: string) {
  return text.toLowerCase().split(key.toLowerCase()).length - 1;
}

function partText(parts: Array<{ type: string; text?: string }> | undefined) {
  return (parts ?? [])
    .filter((part) => part.type === "text" || part.type === "reasoning")
    .map((part) => part.text ?? "")
    .join("\n");
}

function isV2(client: SessionSearchClient): client is V2Client {
  return (
    typeof (client as V2Client).session.context === "function" &&
    typeof (client as V1Client).session.messages !== "function"
  );
}

function hasV2SessionList(
  client: V2Client,
): client is V2Client & { session: { list(input?: { directory?: string }): Promise<V2SessionList> } } {
  return typeof client.session.list === "function";
}

function score(
  item: { id: string; title?: string; time: { updated: number } },
  body: string,
  key: string[],
): RawResult | null {
  const hit = key.reduce((sum, word) => sum + count(body, word), 0);
  const rel = Math.min(1, hit / Math.max(1, key.length * 4));
  if (hit === 0) return null;

  const title = item.title ?? "";

  return {
    id: item.id,
    type: "session",
    title,
    snippet: body.slice(0, 700) || title,
    url: item.id,
    relevance: rel,
    timestamp: item.time.updated,
  };
}

async function searchV1(
  client: V1Client,
  directory: string,
  top: Array<{ id: string; title?: string; time: { updated: number } }>,
  key: string[],
  depth: Depth,
): Promise<PromiseSettledResult<RawResult | null>[]> {
  const limit = depth === "quick" ? 50 : 200;

  return Promise.allSettled(
    top.map(async (item) => {
      const msgRes = await client.session.messages({
        path: { id: item.id },
        query: { directory, limit },
      });
      if (!Array.isArray(msgRes.data)) {
        throw new Error("invalid session transcript payload");
      }

      const body = msgRes.data.map((row) => partText(row.parts)).join("\n");
      return score(item, body, key);
    }),
  );
}

async function searchV2(
  client: V2Client,
  top: Array<{ id: string; title?: string; time: { updated: number } }>,
  key: string[],
): Promise<PromiseSettledResult<RawResult | null>[]> {
  return Promise.allSettled(
    top.map(async (item) => {
      let body: string;
      try {
        const messages = await client.session.context({ sessionID: item.id });
        if (!Array.isArray(messages)) {
          throw new Error("invalid session transcript payload");
        }

        body = messages
          .flatMap((message) => {
            if (typeof message.text === "string") return [message.text];
            if (typeof message.payload?.text === "string") return [message.payload.text];
            return (message.content ?? []).flatMap((part) => {
              if (part.type === "text" || part.type === "reasoning") {
                return part.text ? [part.text] : [];
              }
              if (part.type === "tool" && part.state?.status === "completed") {
                const text = partText(part.state.content);
                return text ? [text] : [];
              }
              return [];
            });
          })
          .join("\n");
      } catch {
        // Session transcripts may be unreadable (e.g. synthetic/steer-queued
        // messages); fall back to matching on the title alone.
        body = "";
      }

      if (!body.trim()) {
        body = item.title ?? "";
      }

      return score(item, body, key);
    }),
  );
}

export async function searchSessions(
  client: SessionSearchClient,
  directory: string,
  query: string,
  depth: Depth,
): Promise<SourceSearchOutcome> {
  const source = "session" as const;
  const key = words(query);
  if (key.length === 0) {
    return {
      source,
      results: [],
    };
  }

  let list: Array<{ id: string; title?: string; time: { updated: number } }>;
  let settled: PromiseSettledResult<RawResult | null>[];

  if (isV2(client)) {
    if (!hasV2SessionList(client)) {
      return failure(
        source,
        "unavailable",
        "Session search is unavailable in the OpenCode plugin runtime: " +
          "the plugin context cannot list sessions on the V2 API.",
      );
    }

    let listRes: V2SessionList | undefined;
    try {
      listRes = await client.session.list({ directory });
    } catch (error) {
      return failure(
        source,
        "request_failed",
        `Session search failed: ${messageFromError(error)}`,
      );
    }
    if (!listRes || !Array.isArray(listRes.data)) {
      return failure(
        source,
        "invalid_response",
        "Session search returned an invalid session list.",
      );
    }
    list = listRes.data;

    const top = list
      .filter((item) => {
        const title = item.title ?? "";
        return key.some((word) => title.toLowerCase().includes(word));
      })
      .slice(0, depth === "quick" ? 5 : 15);

    settled = await searchV2(client, top, key);
  } else {
    let listRes: Awaited<ReturnType<V1Client["session"]["list"]>> | undefined;
    try {
      listRes = await client.session.list({ query: { directory } });
    } catch (error) {
      return failure(
        source,
        "request_failed",
        `Session search failed: ${messageFromError(error)}`,
      );
    }
    if (!Array.isArray(listRes?.data)) {
      return failure(
        source,
        "invalid_response",
        "Session search returned an invalid session list.",
      );
    }
    list = listRes.data;

    const top = list
      .filter((item) => {
        const title = item.title ?? "";
        return key.some((word) => title.toLowerCase().includes(word));
      })
      .slice(0, depth === "quick" ? 5 : 15);

    settled = await searchV1(client, directory, top, key, depth);
  }

  const results = settled.flatMap((item) => {
    if (item.status !== "fulfilled" || item.value === null) return [];
    return [item.value];
  });
  const failed = settled.filter((item) => item.status === "rejected").length;

  return {
    source,
    results,
    ...(failed > 0
      ? {
          error: sourceError(
            source,
            "request_failed",
            `Failed to read ${failed} session ${failed === 1 ? "transcript" : "transcripts"}.`,
          ),
        }
      : {}),
  };
}
