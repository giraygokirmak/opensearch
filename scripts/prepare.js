#!/usr/bin/env node
/**
 * Build script for npm git dependencies.
 *
 * When npm installs this package from a git URL it runs `prepare` after deps
 * are installed. Our build artifacts live in `dist/` (gitignored), so we must
 * compile TypeScript at install time or the installed package is empty.
 *
 * Strictly uses plain Node.js APIs—no bun, no npm-specific environment vars—so
 * it works in any environment where the user may have installed us from git.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");

const tscBin = path.join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsc.cmd" : "tsc",
);

if (!existsSync(tscBin)) {
  console.error(
    "[opensearch] TypeScript is not installed. " +
      "Run `npm install` first to fetch devDependencies.",
  );
  process.exit(1);
}

console.log("[opensearch] Building dist/ for git-based installation…");
execSync(JSON.stringify(tscBin), {
  stdio: "inherit",
  cwd: root,
  shell: false,
});
