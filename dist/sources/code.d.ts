import type { Depth } from "../schema.js";
import { type SourceSearchOutcome } from "./shared.js";
export declare function searchCode(query: string, depth: Depth): Promise<SourceSearchOutcome>;
