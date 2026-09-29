import { failure, messageFromError } from "./shared.js";
function buildQueries(query) {
    const cleaned = query.trim();
    if (!cleaned)
        return [];
    if (cleaned.includes("site:"))
        return [cleaned];
    const repoLike = cleaned.match(/\b([a-z0-9_.-]+\/[a-z0-9_.-]+)\b/i)?.[1];
    return [
        cleaned,
        ...(repoLike ? [`site:github.com ${repoLike}`] : []),
        ...(repoLike ? [] : [`site:github.com ${cleaned}`]),
        `site:stackoverflow.com ${cleaned}`,
        `${cleaned} official docs`,
    ];
}
function normalizeResults(list, depth) {
    const limit = depth === "quick" ? 5 : 10;
    const deduped = new Map();
    for (const item of list) {
        const key = item.url ?? `${item.title ?? "untitled"}:${item.content ?? ""}`;
        if (!deduped.has(key))
            deduped.set(key, item);
    }
    return Array.from(deduped.values())
        .slice(0, limit)
        .map((item, i, arr) => ({
        id: `web-${i}`,
        type: "web",
        title: item.title ?? item.url ?? "Untitled",
        snippet: (item.content ?? item.url ?? "").slice(0, 700),
        url: item.url,
        relevance: Math.max(0.1, 1 - i / Math.max(1, arr.length)),
        timestamp: item.publishedDate
            ? Date.parse(item.publishedDate) || undefined
            : undefined,
    }));
}
export async function searchWeb(query, baseUrl, depth) {
    const source = "web";
    if (!baseUrl) {
        return failure(source, "unavailable", "Web source requires OPENSEARCH_WEB_URL.");
    }
    try {
        const collected = [];
        for (const candidate of buildQueries(query)) {
            const url = new URL("search", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
            url.searchParams.set("q", candidate);
            url.searchParams.set("format", "json");
            const res = await fetch(url, {
                headers: {
                    Accept: "application/json",
                },
            });
            if (!res.ok) {
                return failure(source, "request_failed", res.status === 403
                    ? "SearXNG search failed with status 403. Enable JSON output on the instance."
                    : `SearXNG search failed with status ${res.status}.`);
            }
            const body = (await res.json());
            if (!Array.isArray(body.results)) {
                return failure(source, "invalid_response", "SearXNG search returned an invalid payload.");
            }
            collected.push(...body.results);
            if (collected.length > 0)
                break;
        }
        const results = normalizeResults(collected, depth);
        return {
            source,
            results,
        };
    }
    catch (error) {
        return failure(source, "request_failed", `SearXNG search failed: ${messageFromError(error)}`);
    }
}
