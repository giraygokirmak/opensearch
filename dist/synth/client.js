export function isV2SynthClient(client) {
    return "generate" in client;
}
