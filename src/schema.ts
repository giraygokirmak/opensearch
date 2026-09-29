import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const SOURCE_IDS = ["session", "web", "code"] as const;
export const DEPTHS = ["quick", "thorough"] as const;
export const RESULT_STATUSES = [
  "ok",
  "raw",
  "raw_fallback",
  "no_sources",
  "no_results",
] as const;

export const SourceIdSchema = z.enum(SOURCE_IDS);
export const DepthSchema = z.enum(DEPTHS);
export const ResultStatusSchema = z.enum(RESULT_STATUSES);

export const SourceSchema = z
  .object({
    id: z.string(),
    type: SourceIdSchema,
    url: z.string().optional(),
    title: z.string(),
    snippet: z.string(),
    relevance: z.number().min(0).max(1),
    timestamp: z.number().optional(),
  })
  .strict();

export const SourceErrorSchema = z
  .object({
    source: SourceIdSchema,
    code: z.enum(["unavailable", "request_failed", "invalid_response"]),
    message: z.string(),
  })
  .strict();

export const EvidenceSchema = z
  .object({
    claim: z.string(),
    sources: z.array(z.string()),
    confidence: z.enum(["high", "medium", "low"]),
  })
  .strict();

export const ResultSchema = z
  .object({
    status: ResultStatusSchema,
    answer: z.string(),
    confidence: z.enum(["high", "medium", "low", "none"]),
    evidence: z.array(EvidenceSchema),
    sources: z.array(SourceSchema),
    followups: z.array(z.string()),
    meta: z
      .object({
        query: z.string(),
        duration: z.number(),
        sources_requested: z.number(),
        sources_queried: z.number(),
        sources_yielded: z.number(),
        sources_unavailable: z.array(SourceIdSchema),
        source_errors: z.array(SourceErrorSchema),
      })
      .strict(),
  })
  .strict();

export const SynthesisSchema = ResultSchema.omit({
  status: true,
  sources: true,
  meta: true,
});

export const RawResultSchema = z
  .object({
    id: z.string(),
    type: SourceIdSchema,
    title: z.string(),
    snippet: z.string(),
    url: z.string().optional(),
    relevance: z.number(),
    timestamp: z.number().optional(),
  })
  .strict();

export const ConfigSchema = z
  .object({
    sources: z
      .object({
        session: z.boolean(),
        web: z
          .object({
            enabled: z.boolean(),
            url: z.string().url().optional(),
          })
          .strict(),
        code: z.boolean(),
      })
      .strict(),
    depth: DepthSchema,
    synth: z.boolean(),
  })
  .strict();

export const ToolInputSchema = z
  .object({
    query: z.string().describe("What to search for"),
    sources: z
      .array(SourceIdSchema)
      .optional()
      .describe("Sources to query. Defaults to all enabled."),
    depth: DepthSchema.optional().describe("Search depth. Default: quick"),
  })
  .strict();

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

export function resultJsonSchema() {
  return zodToJsonSchema(ResultSchema, "OpensearchResult");
}

export function synthesisJsonSchema() {
  return zodToJsonSchema(SynthesisSchema, "OpensearchSynthesis");
}

export function toolInputJsonSchema() {
  return zodToJsonSchema(ToolInputSchema, "OpensearchToolInput");
}
