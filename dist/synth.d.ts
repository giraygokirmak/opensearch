import type { SynthClient } from "./synth/client.js";
import { type RawResult, type Synthesis } from "./schema.js";
export declare function synthesize(client: SynthClient, directory: string, raw: RawResult[], query: string): Promise<Synthesis>;
