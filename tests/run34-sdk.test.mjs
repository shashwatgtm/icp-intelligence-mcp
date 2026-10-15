// Run 34D: npm audit --omit=dev reported one high severity item, @modelcontextprotocol/sdk 1.30.1 (GHSA-6qxp-vccf-f47h, an
// OAuth client could send credentials to an authorization server chosen by the MCP server; fixed in 1.31.0). These servers
// do not use the SDK's OAuth client, but the package is a production dependency, so it moves to 1.31.0.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const lock = JSON.parse(fs.readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const atLeast = (v, min) => {
  const a = v.split(".").map(Number);
  const b = min.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};

test("the MCP SDK is 1.31.0 or later (GHSA-6qxp-vccf-f47h fixed) in package.json, the lock file and node_modules", () => {
  assert.equal(pkg.dependencies["@modelcontextprotocol/sdk"], "^1.31.0");
  const locked = lock.packages["node_modules/@modelcontextprotocol/sdk"].version;
  assert.ok(atLeast(locked, "1.31.0"), `lock file has ${locked}`);
  const installed = JSON.parse(fs.readFileSync(new URL("../node_modules/@modelcontextprotocol/sdk/package.json", import.meta.url), "utf8")).version;
  assert.ok(atLeast(installed, "1.31.0"), `installed ${installed}`);
});
