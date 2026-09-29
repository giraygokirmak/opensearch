import { isV2SynthClient } from "./synth/client.js";
import { SYNTH_PROMPT } from "./synth/prompt.js";
import { SynthesisSchema, synthesisJsonSchema, } from "./schema.js";
function parse(input) {
    const body = input.trim();
    if (!body)
        return null;
    try {
        return JSON.parse(body);
    }
    catch {
        const start = body.indexOf("{");
        const end = body.lastIndexOf("}");
        if (start < 0 || end <= start)
            return null;
        return JSON.parse(body.slice(start, end + 1));
    }
}
function validate(body) {
    const parsed = SynthesisSchema.safeParse(body);
    if (!parsed.success) {
        throw new Error("Synthesis returned an invalid payload.");
    }
    return parsed.data;
}
function buildInput(raw, query) {
    return `${SYNTH_PROMPT}\n\nUser query:\n${query}\n\nSources:\n${raw
        .map((item, i) => `${i + 1}. id=${item.id} type=${item.type} title=${item.title}\nurl=${item.url ?? ""}\nrelevance=${item.relevance}\nsnippet=${item.snippet}`)
        .join("\n\n")}`;
}
function text(parts) {
    return parts
        .filter((part) => part.type === "text" || part.type === "reasoning")
        .map((part) => part.text ?? "")
        .join("\n");
}
async function synthesizeV1(client, directory, input) {
    const made = await client.session.create({
        query: { directory },
        body: { title: "opensearch-synth" },
    });
    const id = made.data?.id;
    if (!id) {
        throw new Error("Unable to create a synthesis session.");
    }
    try {
        const req = {
            path: { id },
            query: { directory },
            body: {
                agent: undefined,
                noReply: false,
                parts: [{ type: "text", text: input }],
                format: {
                    type: "json_schema",
                    schema: synthesisJsonSchema(),
                    retryCount: 2,
                },
            },
        };
        const msg = await client.session.prompt(req);
        const body = parse(text(msg.data?.parts ?? []));
        if (!body) {
            throw new Error("Synthesis returned no JSON output.");
        }
        return validate(body);
    }
    finally {
        await client.session
            .delete({ path: { id }, query: { directory } })
            .catch(() => true);
    }
}
export async function synthesize(client, directory, raw, query) {
    const input = buildInput(raw, query);
    if (isV2SynthClient(client)) {
        const generated = await client.generate.text({ prompt: input });
        const body = parse(generated.text);
        if (!body) {
            throw new Error("Synthesis returned no JSON output.");
        }
        return validate(body);
    }
    return synthesizeV1(client, directory, input);
}
