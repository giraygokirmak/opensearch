import { failure, messageFromError } from "./shared.js";
export async function searchCode(query, depth) {
    const source = "code";
    try {
        const url = `https://grep.app/api/search?q=${encodeURIComponent(query)}&limit=${depth === "quick" ? 5 : 10}`;
        const res = await fetch(url);
        if (!res.ok) {
            return failure(source, "request_failed", `grep.app search failed with status ${res.status}.`);
        }
        const body = (await res.json());
        if (body.hits && !Array.isArray(body.hits.hits)) {
            return failure(source, "invalid_response", "grep.app search returned an invalid payload.");
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
                    relevance: typeof hit.score === "number"
                        ? Math.min(1, Math.max(0, hit.score / 100))
                        : 0.5,
                };
            }),
        };
    }
    catch (error) {
        return failure(source, "request_failed", `grep.app search failed: ${messageFromError(error)}`);
    }
}
