// Run 11 (R11-A2-3, R11-A3-9, R11-A4-1): the /mcp limits and input checks, tested in-process through the Netlify
// function handler netlify/functions/mcp.mjs (no network, no deploy).
// Run: npm run build, then node --test tests/mcp-limits.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler, config } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));

// The fields that take a pasted document, article, transcript, notes or content (100,000 characters; every other text 4,000).
const LONG_TEXT = {"icp_interview_synthesizer": ["raw_transcripts"]};
const MAX_BODY = 262144;
const ACCEPT = "application/json, text/event-stream";
const TYPE_WORDS = { string: "text", number: "a number", integer: "a whole number", boolean: "true or false", array: "a list", object: "an object" };

const post = (body, extra = {}) =>
  handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: ACCEPT, ...extra }, body }));
const rpc = async (msg) => {
  const r = await post(JSON.stringify(msg));
  return { r, j: await r.json() };
};
let nextId = 1;
const call = (name, args) => rpc({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } });
const text = (j) => (j.result && j.result.content ? j.result.content.map((c) => c.text).join("\n") : JSON.stringify(j.error));
const secure = (r) =>
  r.headers.get("x-content-type-options") === "nosniff" &&
  r.headers.get("strict-transport-security") === "max-age=31536000" &&
  r.headers.get("cache-control") === "no-store";

const { r: listRes, j: listJson } = await rpc({ jsonrpc: "2.0", id: 0, method: "tools/list" });
const tools = listJson.result.tools;
const names = tools.map((t) => t.name);

// A plain value of the right type for a schema (used to fill required inputs).
function sample(p) {
  if (Array.isArray(p.enum) && p.enum.length) return p.enum[0];
  if (p.type === "number" || p.type === "integer") return typeof p.minimum === "number" && p.minimum > 100 ? p.minimum : 100;
  if (p.type === "boolean") return true;
  if (p.type === "array") return [p.items && p.items.type === "object" ? {} : "B2B SaaS"];
  if (p.type === "object") return {};
  return "B2B SaaS";
}
function required(tool) {
  const s = tool.inputSchema || {};
  const out = {};
  for (const k of s.required || []) out[k] = sample(s.properties[k]);
  return out;
}
// A value of the wrong JSON type for a schema.
const wrong = (type) => (type === "string" ? { a: 1 } : type === "boolean" ? "yes" : type === "number" || type === "integer" ? true : type === "array" ? "x" : 42);
const shortField = tools
  .map((t) => [t, Object.entries(t.inputSchema.properties || {}).find(([k, p]) => p.type === "string" && !p.enum && !(LONG_TEXT[t.name] || []).includes(k))])
  .find(([, f]) => f);
const [shortTool, [shortName]] = shortField;

test("tools/list answers with the security headers", () => {
  assert.equal(listRes.status, 200);
  assert.ok(tools.length > 0);
  assert.ok(secure(listRes));
});

test("POST only: GET, PUT, DELETE and OPTIONS answer 405 with Allow: POST", async () => {
  for (const method of ["GET", "PUT", "DELETE", "OPTIONS"]) {
    const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method }));
    const j = await r.json();
    assert.equal(r.status, 405, method);
    assert.equal(r.headers.get("allow"), "POST");
    assert.equal(j.error.code, -32000);
    assert.ok(secure(r));
  }
});

test("body size: 262,144 bytes accepted, 262,145 bytes and 3 MB answer 413, counted in bytes", async () => {
  const base = JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  const at = base.slice(0, -1) + " ".repeat(MAX_BODY - Buffer.byteLength(base)) + "}";
  assert.equal(Buffer.byteLength(at), MAX_BODY);
  assert.equal((await post(at)).status, 200);
  const over = base.slice(0, -1) + " ".repeat(MAX_BODY + 1 - Buffer.byteLength(base)) + "}";
  let r = await post(over);
  let j = await r.json();
  assert.equal(r.status, 413);
  assert.equal(j.error.code, -32600);
  assert.equal(j.error.message, "Invalid request: the request body is larger than 256 KB (262,144 bytes).");
  assert.ok(secure(r));
  r = await post(JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: shortTool.name, arguments: { [shortName]: "x".repeat(3 * 1024 * 1024) } } }));
  assert.equal(r.status, 413);
  const multi = base.slice(0, -1) + ',"pad":"' + "\u00e9".repeat(132000) + '"}';
  assert.ok(multi.length < MAX_BODY && Buffer.byteLength(multi) > MAX_BODY);
  assert.equal((await post(multi)).status, 413);
  r = await post(base, { "content-length": String(MAX_BODY + 1) });
  assert.equal(r.status, 413);
});

test("bad JSON answers 400 -32700", async () => {
  const r = await post('{"jsonrpc": "2.0", "id": 4, "method": ');
  const j = await r.json();
  assert.equal(r.status, 400);
  assert.equal(j.error.code, -32700);
  assert.ok(secure(r));
});

test("batches answer 400 -32600", async () => {
  for (const n of [2, 100]) {
    const r = await post(JSON.stringify(Array.from({ length: n }, (_, i) => ({ jsonrpc: "2.0", id: 100 + i, method: "tools/list" }))));
    const j = await r.json();
    assert.equal(r.status, 400);
    assert.equal(j.error.code, -32600);
    assert.equal(j.error.message, "Batch requests are not supported. Send one JSON-RPC message per request.");
  }
});

test("short text fields: 4,001 characters refused (also inside a list), 4,000 passes", async () => {
  let { r, j } = await call(shortTool.name, { ...required(shortTool), [shortName]: "x".repeat(4001) });
  assert.equal(r.status, 200);
  assert.equal(j.result.isError, true);
  assert.equal(text(j), `Invalid input for ${shortTool.name}: ${shortName} is longer than 4,000 characters. Shorten it.`);
  assert.ok(secure(r));
  ({ j } = await call(shortTool.name, { ...required(shortTool), [shortName]: "x".repeat(4000) }));
  assert.ok(!/longer than/.test(text(j)));
  const listTool = tools.find((t) => Object.values(t.inputSchema.properties || {}).some((p) => p.type === "array" && p.items && p.items.type === "string"));
  if (listTool) {
    const [lk] = Object.entries(listTool.inputSchema.properties).find(([, p]) => p.type === "array" && p.items && p.items.type === "string");
    ({ j } = await call(listTool.name, { ...required(listTool), [lk]: ["short", "y".repeat(4001)] }));
    assert.equal(j.result.isError, true);
    assert.match(text(j), new RegExp(`${lk}\\[1\\] is longer than 4,000 characters\\. Shorten it\\.`));
  }
  for (const [tool, fields] of Object.entries(LONG_TEXT)) {
    const t = tools.find((x) => x.name === tool);
    const other = Object.entries(t.inputSchema.properties).find(([k, p]) => p.type === "string" && !p.enum && !fields.includes(k));
    if (!other) continue;
    ({ j } = await call(tool, { ...required(t), [other[0]]: "z".repeat(4001) }));
    assert.equal(text(j), `Invalid input for ${tool}: ${other[0]} is longer than 4,000 characters. Shorten it.`);
  }
});

const PARAGRAPH =
  "Our go-to-market plan for the next two quarters focuses on mid-market SaaS finance teams. The ideal customer runs a " +
  "monthly close with a small team, uses a cloud accounting system, and feels the pain of manual reconciliation. " +
  "Customers say the close takes too long and errors reach the board pack. We will lead with a free close audit. ";
const doc = (n) => PARAGRAPH.repeat(Math.ceil(n / PARAGRAPH.length)).slice(0, n);

for (const [tool, fields] of Object.entries(LONG_TEXT)) {
  for (const field of fields) {
    test(`long text ${tool}.${field}: 20,000 and 99,000 characters answer within 8 seconds; 100,001 refused`, async () => {
      const t = tools.find((x) => x.name === tool);
      for (const n of [20000, 99000]) {
        const start = Date.now();
        const { r, j } = await call(tool, { ...required(t), [field]: doc(n) });
        const ms = Date.now() - start;
        assert.equal(r.status, 200);
        assert.notEqual(j.result.isError, true, `${n} characters: ${text(j).slice(0, 200)}`);
        assert.ok(ms < 8000, `${n} characters took ${ms} ms`);
      }
      const { j } = await call(tool, { ...required(t), [field]: doc(100001) });
      assert.equal(j.result.isError, true);
      assert.equal(text(j), `Invalid input for ${tool}: ${field} is longer than 100,000 characters. Shorten it or split it into parts.`);
    });
  }
}

test("wrong JSON types are refused before the tool runs, for every input of every tool", async () => {
  for (const t of tools) {
    for (const [k, p] of Object.entries(t.inputSchema.properties || {})) {
      if (!p.type) continue;
      const { r, j } = await call(t.name, { ...required(t), [k]: wrong(p.type) });
      assert.equal(r.status, 200);
      assert.equal(j.result.isError, true, `${t.name}.${k}`);
      assert.equal(text(j), `Invalid input for ${t.name}: ${k} must be ${TYPE_WORDS[p.type]}.`);
      if (p.type === "array" && p.items && p.items.type) {
        const { j: j2 } = await call(t.name, { ...required(t), [k]: [wrong(p.items.type)] });
        assert.equal(text(j2), `Invalid input for ${t.name}: ${k}[0] must be ${TYPE_WORDS[p.items.type]}.`);
      }
    }
  }
  const t = tools[0];
  const { j } = await call(t.name, "not an object");
  assert.equal(text(j), `Invalid input for ${t.name}: arguments must be an object.`);
});

test("a number sent as text is still passed to the tool (run 6 decision N2)", async () => {
  const t = tools.find((x) => Object.values(x.inputSchema.properties || {}).some((p) => p.type === "number"));
  if (!t) return;
  const [k] = Object.entries(t.inputSchema.properties).find(([, p]) => p.type === "number");
  const { j } = await call(t.name, { ...required(t), [k]: "100" });
  assert.notEqual(text(j), `Invalid input for ${t.name}: ${k} must be a number.`);
});

test("a tool name that is not text, or longer than 100 characters, answers Unknown tool and is never echoed", async () => {
  const expected = "Unknown tool. Available tools: " + names.join(", ") + ".";
  for (const name of ["Q".repeat(5000), "Q".repeat(101), 42, { a: 1 }, ["x"], null, undefined, true]) {
    const { r, j } = await rpc({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: {} } });
    assert.equal(r.status, 200);
    assert.equal(j.result.isError, true);
    assert.equal(text(j), expected);
    assert.ok(!text(j).includes("QQ"));
  }
  const { j } = await call("q".repeat(100), {});
  assert.equal(j.result.isError, true);
  assert.match(text(j), /^Unknown tool: q{100}\./);
});

test("a thrown error answers 500 -32603 with a plain message", async () => {
  const broken = {
    method: "POST",
    url: "https://x.gtmhelix.com/mcp",
    headers: { get() { throw new Error("boom at C:\\secret\\file.js:1:1"); } },
    arrayBuffer: async () => new ArrayBuffer(0),
  };
  const orig = console.error;
  console.error = () => {};
  const r = await handler(broken);
  console.error = orig;
  const j = await r.json();
  assert.equal(r.status, 500);
  assert.equal(j.error.code, -32603);
  assert.equal(j.error.message, "Internal error while handling the request. Please try again.");
  assert.ok(!("data" in j.error));
  assert.ok(secure(r));
});

test("config: path /mcp, rate limit 300 per 60 seconds by ip and domain", () => {
  assert.deepEqual(config, { path: "/mcp", rateLimit: { windowSize: 60, windowLimit: 300, aggregateBy: ["ip", "domain"] } });
});
