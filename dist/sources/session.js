import { failure, messageFromError, sourceError } from "./shared.js";
function words(query) {
    return query.toLowerCase().split(/\s+/).filter(Boolean);
}
function count(text, key) {
    return text.toLowerCase().split(key.toLowerCase()).length - 1;
}
function partText(parts) {
    return (parts ?? [])
        .filter((part) => part.type === "text" || part.type === "reasoning")
        .map((part) => part.text ?? "")
        .join("\n");
}
function isV2(client) {
    return (typeof client.session.context === "function" &&
        typeof client.session.messages !== "function");
}
function hasV2SessionList(client) {
    return typeof client.session.list === "function";
}
function score(item, body, key) {
    const hit = key.reduce((sum, word) => sum + count(body, word), 0);
    const rel = Math.min(1, hit / Math.max(1, key.length * 4));
    if (hit === 0)
        return null;
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
async function searchV1(client, directory, top, key, depth) {
    const limit = depth === "quick" ? 50 : 200;
    return Promise.allSettled(top.map(async (item) => {
        const msgRes = await client.session.messages({
            path: { id: item.id },
            query: { directory, limit },
        });
        if (!Array.isArray(msgRes.data)) {
            throw new Error("invalid session transcript payload");
        }
        const body = msgRes.data.map((row) => partText(row.parts)).join("\n");
        return score(item, body, key);
    }));
}
async function searchV2(client, top, key) {
    return Promise.allSettled(top.map(async (item) => {
        let body;
        try {
            const messages = await client.session.context({ sessionID: item.id });
            if (!Array.isArray(messages)) {
                throw new Error("invalid session transcript payload");
            }
            body = messages
                .flatMap((message) => {
                if (typeof message.text === "string")
                    return [message.text];
                if (typeof message.payload?.text === "string")
                    return [message.payload.text];
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
        }
        catch {
            // Session transcripts may be unreadable (e.g. synthetic/steer-queued
            // messages); fall back to matching on the title alone.
            body = "";
        }
        if (!body.trim()) {
            body = item.title ?? "";
        }
        return score(item, body, key);
    }));
}
export async function searchSessions(client, directory, query, depth) {
    const source = "session";
    const key = words(query);
    if (key.length === 0) {
        return {
            source,
            results: [],
        };
    }
    let list;
    let settled;
    if (isV2(client)) {
        if (!hasV2SessionList(client)) {
            return failure(source, "unavailable", "Session search is unavailable in the OpenCode plugin runtime: " +
                "the plugin context cannot list sessions on the V2 API.");
        }
        let listRes;
        try {
            listRes = await client.session.list({ directory });
        }
        catch (error) {
            return failure(source, "request_failed", `Session search failed: ${messageFromError(error)}`);
        }
        if (!listRes || !Array.isArray(listRes.data)) {
            return failure(source, "invalid_response", "Session search returned an invalid session list.");
        }
        list = listRes.data;
        const top = list
            .filter((item) => {
            const title = item.title ?? "";
            return key.some((word) => title.toLowerCase().includes(word));
        })
            .slice(0, depth === "quick" ? 5 : 15);
        settled = await searchV2(client, top, key);
    }
    else {
        let listRes;
        try {
            listRes = await client.session.list({ query: { directory } });
        }
        catch (error) {
            return failure(source, "request_failed", `Session search failed: ${messageFromError(error)}`);
        }
        if (!Array.isArray(listRes?.data)) {
            return failure(source, "invalid_response", "Session search returned an invalid session list.");
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
        if (item.status !== "fulfilled" || item.value === null)
            return [];
        return [item.value];
    });
    const failed = settled.filter((item) => item.status === "rejected").length;
    return {
        source,
        results,
        ...(failed > 0
            ? {
                error: sourceError(source, "request_failed", `Failed to read ${failed} session ${failed === 1 ? "transcript" : "transcripts"}.`),
            }
            : {}),
    };
}
