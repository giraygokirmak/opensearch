import { z } from "zod";
export declare const SOURCE_IDS: readonly ["session", "web", "code"];
export declare const DEPTHS: readonly ["quick", "thorough"];
export declare const RESULT_STATUSES: readonly ["ok", "raw", "raw_fallback", "no_sources", "no_results"];
export declare const SourceIdSchema: z.ZodEnum<["session", "web", "code"]>;
export declare const DepthSchema: z.ZodEnum<["quick", "thorough"]>;
export declare const ResultStatusSchema: z.ZodEnum<["ok", "raw", "raw_fallback", "no_sources", "no_results"]>;
export declare const SourceSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["session", "web", "code"]>;
    url: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    snippet: z.ZodString;
    relevance: z.ZodNumber;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    id: string;
    type: "session" | "web" | "code";
    title: string;
    snippet: string;
    relevance: number;
    url?: string | undefined;
    timestamp?: number | undefined;
}, {
    id: string;
    type: "session" | "web" | "code";
    title: string;
    snippet: string;
    relevance: number;
    url?: string | undefined;
    timestamp?: number | undefined;
}>;
export declare const SourceErrorSchema: z.ZodObject<{
    source: z.ZodEnum<["session", "web", "code"]>;
    code: z.ZodEnum<["unavailable", "request_failed", "invalid_response"]>;
    message: z.ZodString;
}, "strict", z.ZodTypeAny, {
    code: "unavailable" | "request_failed" | "invalid_response";
    message: string;
    source: "session" | "web" | "code";
}, {
    code: "unavailable" | "request_failed" | "invalid_response";
    message: string;
    source: "session" | "web" | "code";
}>;
export declare const EvidenceSchema: z.ZodObject<{
    claim: z.ZodString;
    sources: z.ZodArray<z.ZodString, "many">;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
}, "strict", z.ZodTypeAny, {
    claim: string;
    sources: string[];
    confidence: "high" | "medium" | "low";
}, {
    claim: string;
    sources: string[];
    confidence: "high" | "medium" | "low";
}>;
export declare const ResultSchema: z.ZodObject<{
    status: z.ZodEnum<["ok", "raw", "raw_fallback", "no_sources", "no_results"]>;
    answer: z.ZodString;
    confidence: z.ZodEnum<["high", "medium", "low", "none"]>;
    evidence: z.ZodArray<z.ZodObject<{
        claim: z.ZodString;
        sources: z.ZodArray<z.ZodString, "many">;
        confidence: z.ZodEnum<["high", "medium", "low"]>;
    }, "strict", z.ZodTypeAny, {
        claim: string;
        sources: string[];
        confidence: "high" | "medium" | "low";
    }, {
        claim: string;
        sources: string[];
        confidence: "high" | "medium" | "low";
    }>, "many">;
    sources: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["session", "web", "code"]>;
        url: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
        snippet: z.ZodString;
        relevance: z.ZodNumber;
        timestamp: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        id: string;
        type: "session" | "web" | "code";
        title: string;
        snippet: string;
        relevance: number;
        url?: string | undefined;
        timestamp?: number | undefined;
    }, {
        id: string;
        type: "session" | "web" | "code";
        title: string;
        snippet: string;
        relevance: number;
        url?: string | undefined;
        timestamp?: number | undefined;
    }>, "many">;
    followups: z.ZodArray<z.ZodString, "many">;
    meta: z.ZodObject<{
        query: z.ZodString;
        duration: z.ZodNumber;
        sources_requested: z.ZodNumber;
        sources_queried: z.ZodNumber;
        sources_yielded: z.ZodNumber;
        sources_unavailable: z.ZodArray<z.ZodEnum<["session", "web", "code"]>, "many">;
        source_errors: z.ZodArray<z.ZodObject<{
            source: z.ZodEnum<["session", "web", "code"]>;
            code: z.ZodEnum<["unavailable", "request_failed", "invalid_response"]>;
            message: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            code: "unavailable" | "request_failed" | "invalid_response";
            message: string;
            source: "session" | "web" | "code";
        }, {
            code: "unavailable" | "request_failed" | "invalid_response";
            message: string;
            source: "session" | "web" | "code";
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        query: string;
        duration: number;
        sources_requested: number;
        sources_queried: number;
        sources_yielded: number;
        sources_unavailable: ("session" | "web" | "code")[];
        source_errors: {
            code: "unavailable" | "request_failed" | "invalid_response";
            message: string;
            source: "session" | "web" | "code";
        }[];
    }, {
        query: string;
        duration: number;
        sources_requested: number;
        sources_queried: number;
        sources_yielded: number;
        sources_unavailable: ("session" | "web" | "code")[];
        source_errors: {
            code: "unavailable" | "request_failed" | "invalid_response";
            message: string;
            source: "session" | "web" | "code";
        }[];
    }>;
}, "strict", z.ZodTypeAny, {
    status: "ok" | "raw" | "raw_fallback" | "no_sources" | "no_results";
    sources: {
        id: string;
        type: "session" | "web" | "code";
        title: string;
        snippet: string;
        relevance: number;
        url?: string | undefined;
        timestamp?: number | undefined;
    }[];
    confidence: "high" | "medium" | "low" | "none";
    answer: string;
    evidence: {
        claim: string;
        sources: string[];
        confidence: "high" | "medium" | "low";
    }[];
    followups: string[];
    meta: {
        query: string;
        duration: number;
        sources_requested: number;
        sources_queried: number;
        sources_yielded: number;
        sources_unavailable: ("session" | "web" | "code")[];
        source_errors: {
            code: "unavailable" | "request_failed" | "invalid_response";
            message: string;
            source: "session" | "web" | "code";
        }[];
    };
}, {
    status: "ok" | "raw" | "raw_fallback" | "no_sources" | "no_results";
    sources: {
        id: string;
        type: "session" | "web" | "code";
        title: string;
        snippet: string;
        relevance: number;
        url?: string | undefined;
        timestamp?: number | undefined;
    }[];
    confidence: "high" | "medium" | "low" | "none";
    answer: string;
    evidence: {
        claim: string;
        sources: string[];
        confidence: "high" | "medium" | "low";
    }[];
    followups: string[];
    meta: {
        query: string;
        duration: number;
        sources_requested: number;
        sources_queried: number;
        sources_yielded: number;
        sources_unavailable: ("session" | "web" | "code")[];
        source_errors: {
            code: "unavailable" | "request_failed" | "invalid_response";
            message: string;
            source: "session" | "web" | "code";
        }[];
    };
}>;
export declare const SynthesisSchema: z.ZodObject<Omit<{
    status: z.ZodEnum<["ok", "raw", "raw_fallback", "no_sources", "no_results"]>;
    answer: z.ZodString;
    confidence: z.ZodEnum<["high", "medium", "low", "none"]>;
    evidence: z.ZodArray<z.ZodObject<{
        claim: z.ZodString;
        sources: z.ZodArray<z.ZodString, "many">;
        confidence: z.ZodEnum<["high", "medium", "low"]>;
    }, "strict", z.ZodTypeAny, {
        claim: string;
        sources: string[];
        confidence: "high" | "medium" | "low";
    }, {
        claim: string;
        sources: string[];
        confidence: "high" | "medium" | "low";
    }>, "many">;
    sources: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["session", "web", "code"]>;
        url: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
        snippet: z.ZodString;
        relevance: z.ZodNumber;
        timestamp: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        id: string;
        type: "session" | "web" | "code";
        title: string;
        snippet: string;
        relevance: number;
        url?: string | undefined;
        timestamp?: number | undefined;
    }, {
        id: string;
        type: "session" | "web" | "code";
        title: string;
        snippet: string;
        relevance: number;
        url?: string | undefined;
        timestamp?: number | undefined;
    }>, "many">;
    followups: z.ZodArray<z.ZodString, "many">;
    meta: z.ZodObject<{
        query: z.ZodString;
        duration: z.ZodNumber;
        sources_requested: z.ZodNumber;
        sources_queried: z.ZodNumber;
        sources_yielded: z.ZodNumber;
        sources_unavailable: z.ZodArray<z.ZodEnum<["session", "web", "code"]>, "many">;
        source_errors: z.ZodArray<z.ZodObject<{
            source: z.ZodEnum<["session", "web", "code"]>;
            code: z.ZodEnum<["unavailable", "request_failed", "invalid_response"]>;
            message: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            code: "unavailable" | "request_failed" | "invalid_response";
            message: string;
            source: "session" | "web" | "code";
        }, {
            code: "unavailable" | "request_failed" | "invalid_response";
            message: string;
            source: "session" | "web" | "code";
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        query: string;
        duration: number;
        sources_requested: number;
        sources_queried: number;
        sources_yielded: number;
        sources_unavailable: ("session" | "web" | "code")[];
        source_errors: {
            code: "unavailable" | "request_failed" | "invalid_response";
            message: string;
            source: "session" | "web" | "code";
        }[];
    }, {
        query: string;
        duration: number;
        sources_requested: number;
        sources_queried: number;
        sources_yielded: number;
        sources_unavailable: ("session" | "web" | "code")[];
        source_errors: {
            code: "unavailable" | "request_failed" | "invalid_response";
            message: string;
            source: "session" | "web" | "code";
        }[];
    }>;
}, "status" | "sources" | "meta">, "strict", z.ZodTypeAny, {
    confidence: "high" | "medium" | "low" | "none";
    answer: string;
    evidence: {
        claim: string;
        sources: string[];
        confidence: "high" | "medium" | "low";
    }[];
    followups: string[];
}, {
    confidence: "high" | "medium" | "low" | "none";
    answer: string;
    evidence: {
        claim: string;
        sources: string[];
        confidence: "high" | "medium" | "low";
    }[];
    followups: string[];
}>;
export declare const RawResultSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["session", "web", "code"]>;
    title: z.ZodString;
    snippet: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
    relevance: z.ZodNumber;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    id: string;
    type: "session" | "web" | "code";
    title: string;
    snippet: string;
    relevance: number;
    url?: string | undefined;
    timestamp?: number | undefined;
}, {
    id: string;
    type: "session" | "web" | "code";
    title: string;
    snippet: string;
    relevance: number;
    url?: string | undefined;
    timestamp?: number | undefined;
}>;
export declare const ConfigSchema: z.ZodObject<{
    sources: z.ZodObject<{
        session: z.ZodBoolean;
        web: z.ZodObject<{
            enabled: z.ZodBoolean;
            url: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            enabled: boolean;
            url?: string | undefined;
        }, {
            enabled: boolean;
            url?: string | undefined;
        }>;
        code: z.ZodBoolean;
    }, "strict", z.ZodTypeAny, {
        session: boolean;
        web: {
            enabled: boolean;
            url?: string | undefined;
        };
        code: boolean;
    }, {
        session: boolean;
        web: {
            enabled: boolean;
            url?: string | undefined;
        };
        code: boolean;
    }>;
    depth: z.ZodEnum<["quick", "thorough"]>;
    synth: z.ZodBoolean;
}, "strict", z.ZodTypeAny, {
    sources: {
        session: boolean;
        web: {
            enabled: boolean;
            url?: string | undefined;
        };
        code: boolean;
    };
    depth: "quick" | "thorough";
    synth: boolean;
}, {
    sources: {
        session: boolean;
        web: {
            enabled: boolean;
            url?: string | undefined;
        };
        code: boolean;
    };
    depth: "quick" | "thorough";
    synth: boolean;
}>;
export declare const ToolInputSchema: z.ZodObject<{
    query: z.ZodString;
    sources: z.ZodOptional<z.ZodArray<z.ZodEnum<["session", "web", "code"]>, "many">>;
    depth: z.ZodOptional<z.ZodEnum<["quick", "thorough"]>>;
}, "strict", z.ZodTypeAny, {
    query: string;
    sources?: ("session" | "web" | "code")[] | undefined;
    depth?: "quick" | "thorough" | undefined;
}, {
    query: string;
    sources?: ("session" | "web" | "code")[] | undefined;
    depth?: "quick" | "thorough" | undefined;
}>;
export type SourceId = z.infer<typeof SourceIdSchema>;
export type Depth = z.infer<typeof DepthSchema>;
export type ResultStatus = z.infer<typeof ResultStatusSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type SourceError = z.infer<typeof SourceErrorSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Result = z.infer<typeof ResultSchema>;
export type Synthesis = z.infer<typeof SynthesisSchema>;
export type RawResult = z.infer<typeof RawResultSchema>;
export type Config = z.infer<typeof ConfigSchema>;
export type ToolInput = z.infer<typeof ToolInputSchema>;
export declare function resultJsonSchema(): import("zod-to-json-schema").JsonSchema7Type & {
    $schema?: string | undefined;
    definitions?: {
        [key: string]: import("zod-to-json-schema").JsonSchema7Type;
    } | undefined;
};
export declare function synthesisJsonSchema(): import("zod-to-json-schema").JsonSchema7Type & {
    $schema?: string | undefined;
    definitions?: {
        [key: string]: import("zod-to-json-schema").JsonSchema7Type;
    } | undefined;
};
export declare function toolInputJsonSchema(): import("zod-to-json-schema").JsonSchema7Type & {
    $schema?: string | undefined;
    definitions?: {
        [key: string]: import("zod-to-json-schema").JsonSchema7Type;
    } | undefined;
};
