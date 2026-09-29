import type { Depth } from "../schema.js";
import { type SourceSearchOutcome } from "./shared.js";
export declare function searchWeb(query: string, baseUrl: string | undefined, depth: Depth): Promise<SourceSearchOutcome>;
