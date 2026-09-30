// Run 15 R15-14 (Codex C-IMP-01, Claude chat M1): every version statement in this repo equals package.json.
// Surfaces: package-lock.json, manifest.json and server.json (when present), SERVER_VERSION in src, the serverInfo that /mcp
// initialize returns, README.md line 1 and its "newest version" sentence, the /docs/ "Server: ... version" line, and
// softwareVersion in the home page JSON-LD. Release-history rows are exempt (they list every version on purpose).
// The same file is in all 5 connector repos. Run: node --test (npm test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const has = (p) => existsSync(new URL(p, root));
const pkg = JSON.parse(read("package.json"));
const V = pkg.version;

test("package.json has a version", () => assert.match(V, /^\d+\.\d+\.\d+$/));

test("package-lock.json states the same version", () => {
  const lock = JSON.parse(read("package-lock.json"));
  assert.equal(lock.version, V);
  assert.equal(lock.packages[""].version, V);
});

test("manifest.json and server.json state the same version (when present)", () => {
  if (has("manifest.json")) assert.equal(JSON.parse(read("manifest.json")).version, V);
  if (has("server.json")) {
    const s = JSON.parse(read("server.json"));
    assert.equal(s.version, V);
    for (const p of s.packages || []) if (p.version) assert.equal(p.version, V);
  }
});

test("SERVER_VERSION in src states the same version", () => {
  const found = readdirSync(new URL("src/", root)).filter((f) => f.endsWith(".ts"))
    .map((f) => read("src/" + f).match(/export const SERVER_VERSION = ['"]([^'"]+)['"]/)).filter(Boolean);
  assert.ok(found.length >= 1, "SERVER_VERSION found");
  for (const m of found) assert.equal(m[1], V);
});

test("/mcp initialize returns serverInfo.version equal to package.json", async () => {
  const { default: handler } = await import(new URL("netlify/functions/mcp.mjs", root));
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } }),
  }));
  const j = await r.json();
  assert.equal(j.result.serverInfo.version, V);
});

test("README.md line 1 and its newest-version sentence state the same version", () => {
  const lines = read("README.md").split(/\r?\n/);
  assert.match(lines[0], new RegExp(`v${V.replace(/\./g, "\\.")}$`));
  const m = read("README.md").match(/always runs the newest version \(([^)]+)\)/);
  assert.ok(m, "newest-version sentence present");
  assert.equal(m[1], V);
  for (const t of read("README.md").matchAll(/against `tools\/list` of [a-z-]+ (\d+\.\d+\.\d+)/g)) assert.equal(t[1], V);
});

test("the /docs/ Server line and the home JSON-LD softwareVersion state the same version", () => {
  const docs = read("public/docs/index.html");
  const s = docs.match(/Server: <code>[^<]+<\/code> version ([0-9.]+)\./);
  assert.ok(s, "docs Server line present");
  assert.equal(s[1], V);
  assert.match(docs, new RegExp(`<td>${V.replace(/\./g, "\\.")} \\(this site\\)</td>`), "docs release history marks this version as this site");
  const home = read("public/index.html").match(/"softwareVersion": *"([^"]+)"/);
  assert.ok(home, "softwareVersion present");
  assert.equal(home[1], V);
});
