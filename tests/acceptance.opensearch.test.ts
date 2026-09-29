import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { searchSessions } from "../src/sources/session";

type State = {
  dir: string;
  base: string;
  auth: string;
  proc: ReturnType<typeof spawn>;
};

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function port() {
  return await new Promise<number>((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (!addr || typeof addr === "string") {
        srv.close();
        reject(new Error("port resolve failed"));
        return;
      }
      srv.close(() => resolve(addr.port));
    });
  });
}

async function stop(proc: State["proc"]) {
  proc.kill();
  for (const _ of Array.from({ length: 20 })) {
    if (proc.exitCode !== null || proc.signalCode !== null) return;
    await sleep(100);
  }
  proc.kill("SIGKILL");
  for (const _ of Array.from({ length: 10 })) {
    if (proc.exitCode !== null || proc.signalCode !== null) return;
    await sleep(100);
  }
}

async function boot(dir: string) {
  const n = await port();
  const base = `http://127.0.0.1:${n}`;
  let auth = "";

  const proc = spawn(
    "opencode",
    ["serve", "--port", `${n}`, "--hostname", "127.0.0.1"],
    {
      env: { ...process.env, NO_COLOR: "1" },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      cwd: dir,
    },
  );

  await new Promise<void>((resolve) => {
    proc.stdout?.on("data", (d) => {
      const m = String(d).match(/server password (\S+)/);
      if (m) {
        auth = "Basic " + Buffer.from("opencode:" + m[1]).toString("base64");
        resolve();
      }
    });
    setTimeout(resolve, 5000);
  });

  return { dir, base, auth, proc } satisfies State;
}

function api(state: State) {
  return {
    async raw(path: string, init?: RequestInit) {
      return fetch(`${state.base}${path}`, {
        ...init,
        headers: {
          Authorization: state.auth,
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
      });
    },
    async call<T>(path: string, init?: RequestInit): Promise<T> {
      const res = await this.raw(path, init);
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(`${path} failed: ${res.status} ${JSON.stringify(body)}`);
      return body as T;
    },
  };
}

async function ready(state: State) {
  for (const _ of Array.from({ length: 100 })) {
    const ok = await fetch(`${state.base}/api/info`, {
      headers: { Authorization: state.auth },
    })
      .then((res) => res.ok)
      .catch(() => false);
    if (ok) return;
    await sleep(100);
  }
  throw new Error("opencode server did not become ready");
}

let state: State | undefined;

afterEach(async () => {
  if (!state) return;
  await stop(state.proc);
  await rm(state.dir, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 100,
  });
  state = undefined;
});

describe("opensearch V2 session source (live V2 server)", () => {
  it("finds a matching session body through the full V2 client", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opensearch-test-"));
    state = await boot(dir);
    await ready(state);

    const info = await api(state).call<{ version?: string; data?: { version?: string } }>(
      "/api/info",
    );
    expect((info.data ?? info).version).toMatch(/^2\./);

    const marker = `opensearch-acceptance-${Date.now()}`;
    const created = await api(state).call<{ id?: string; data?: { id?: string } }>(
      "/api/session",
      { method: "POST", body: JSON.stringify({ title: marker }) },
    );
    const session = created.data ?? created;
    expect(session.id).toBeTruthy();

    await api(state).call(`/api/session/${encodeURIComponent(session.id!)}/synthetic`, {
      method: "POST",
      body: JSON.stringify({ id: `msg_${Date.now()}`, text: `the marker is ${marker}` }),
    });

    // Full V2 HTTP client surface used by the session source.
    const { OpenCode } = await import("@opencode/client/promise");
    const client = OpenCode.make({
      baseUrl: state.base,
      headers: { Authorization: state.auth },
    });

    const outcome = await searchSessions(
      client as never,
      state.dir,
      marker,
      "quick",
    );

    expect(outcome.error).toBeUndefined();
    expect(outcome.results.length).toBeGreaterThan(0);
    expect(outcome.results[0]?.url).toBe(session.id);
    expect(outcome.results[0]?.snippet).toContain(marker);
    expect(outcome.results[0]?.relevance).toBeGreaterThan(0);
  });

  it("does not expose the removed V1 tool REST API", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opensearch-test-"));
    state = await boot(dir);
    await ready(state);

    // V2 removed the V1 tool-listing REST endpoints.
    const res = await fetch(`${state.base}/api/tool`, {
      headers: { Authorization: state.auth },
    });
    expect(res.status).toBe(404);
  });
});
