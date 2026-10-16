// Run 40S3 (the last connector safety run, D6): tests first for the four scope items of the 40S2 HANDOFF. Same file in every repo.
// (1) 40S2-1: "www" before "_" or "-" gets an invisible escape, so the "_" cannot open or close emphasis ("www_a ... www_ b").
// (2) 40S2-2: escapePiece answers a piece it has already read in the same call from a cache (one pass per value, not one per
//     generated line).
// (3) 40S2-3: CRAFT Content content_repurposer leaves its own "_" join as production writes it when the typed format name holds
//     no escaped character ("cut_late_deliveries_by_20%_in_90_days"), and still makes no emphasis from typed punctuation.
// (4) 40S2-4: Revenue proposal_section_writer: an implementation_approach of only digits never becomes a numbered item.
// Neutral values only (B81). No Markdown parser here: the run's property gates render with micromark, mdast and pandoc.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const G = existsSync(new URL("../netlify/functions/mcp-sse.js", import.meta.url));
const mcp = (await import(new URL(G ? "../netlify/functions/mcp-sse.js" : "../netlify/functions/mcp.mjs", import.meta.url))).default;
const mod = await import(new URL(G ? "../netlify/lib/escape-inputs.js" : "../dist/escape-inputs.js", import.meta.url));

// "_" and "*" no backslash escapes, leaving out "_" between two ASCII letters or digits (plain text there)
function liveEm(text) {
  let em = 0;
  for (const m of text.matchAll(/(\\*)([*_]+)/g)) {
    const at = m.index + m[1].length, run = m[2], b = text[at - 1] || " ", a = text[at + run.length] || " ";
    if (run[0] === "_" && /[A-Za-z0-9]/.test(b) && /[A-Za-z0-9]/.test(a) && m[1].length % 2 === 0) continue;
    em += run.length - (m[1].length % 2);
  }
  return em;
}
let id = 1;
const parse = (t) => { try { return JSON.parse(t); } catch { const m = t.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5)); return JSON.parse(m[m.length - 1]); } };
const call = async (method, params) => parse(await (await mcp(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: id++, method, params }) }), {})).text());
const tools = (await call("tools/list", {})).result.tools;
const sample = (p) => Array.isArray(p.enum) ? p.enum[0] : p.type === "number" || p.type === "integer" ? (typeof p.minimum === "number" && p.minimum > 100 ? p.minimum : 100) : p.type === "boolean" ? true : p.type === "array" ? [p.items && p.items.type === "object" ? {} : "B2B SaaS"] : p.type === "object" ? {} : "a regional logistics company";
const textOf = (r) => { const c = r.result && r.result.content; if (!c) return JSON.stringify(r); const t = c.map((x) => x.text || "").join("\n"); if (G) { try { const out = []; (function w(v) { if (typeof v === "string") out.push(v); else if (v && typeof v === "object") for (const x of Object.values(v)) w(x); })(JSON.parse(t)); return out.join("\n"); } catch {} } return t; };
const argsWith = (t, k, v) => { const props = (t.inputSchema || {}).properties || {}; const a = {}; for (const [k2, p2] of Object.entries(props)) a[k2] = sample(p2); a[k] = props[k].type === "array" ? [v] : v; return a; };
const freeFields = (t) => Object.entries((t.inputSchema || {}).properties || {}).filter(([, p]) => (p.type === "string" && !Array.isArray(p.enum)) || (p.type === "array" && p.items && p.items.type === "string")).map(([k]) => k);

test("40S2-1: www before _ or - is escaped invisibly, so two of them make no emphasis", () => {
  for (const v of ["see www_a and b www_ c", "WWW_x then y www_ z", "www_a_ b", "a www-b and www_c_"]) {
    const e = mod.escapeText(v);
    assert.equal(liveEm(e), 0, `${JSON.stringify(v)} -> ${JSON.stringify(e)}`);
    assert.ok(!/\\\\[_-]/.test(e), `no visible backslash before _ or -: ${JSON.stringify(e)}`);
    assert.equal(mod.escapePiece(e), e, "escapePiece keeps the pass's text");
  }
  assert.equal(mod.escapeText("www_host"), "www\\_host");
  assert.equal(mod.escapeText("www-host"), "www\\-host");
});

test("40S2-1: through every tool's first free field, www_ pairs make no emphasis beyond a twin's", async () => {
  for (const t of tools) {
    const f = freeFields(t)[0];
    if (!f) continue;
    const a = textOf(await call("tools/call", { name: t.name, arguments: argsWith(t, f, "Acme Example www_ops team and www_ pilot") }));
    const b = textOf(await call("tools/call", { name: t.name, arguments: argsWith(t, f, "Acme Example wwwxops team and wwwx pilot") }));
    assert.ok(liveEm(a) <= liveEm(b), `${t.name}.${f}: ${liveEm(a)} live "_" or "*" against ${liveEm(b)} in the twin`);
  }
});

test("40S2-2: escapePiece reads a long piece once per call (a cache), with the same output", () => {
  const big = ("x\n! - 1. www_a [b] <c> `d` ".repeat(40000)) + "end";
  const once = mod.escapePiece(mod.escapeText(big));
  const t0 = performance.now();
  mod.escapePiece(mod.escapeText(big));
  const first = performance.now() - t0;
  const e = mod.escapeText(big);
  const t1 = performance.now();
  for (let i = 0; i < 20; i++) assert.equal(mod.escapePiece(e), once);
  const twenty = performance.now() - t1;
  assert.ok(twenty < first * 3, `20 repeats took ${twenty.toFixed(0)} ms against ${first.toFixed(0)} ms for one escapeText and escapePiece`);
});

test("40S2-3: content_repurposer keeps its own _ join for an ordinary format name, and makes no emphasis from typed dots", async (t) => {
  const tool = tools.find((x) => x.name === "content_repurposer");
  if (!tool) return t.skip("no content_repurposer here");
  const a = argsWith(tool, "target_formats", "Cut late deliveries by 20% in 90 days");
  const o = textOf(await call("tools/call", { name: tool.name, arguments: a }));
  assert.ok(o.includes("cut_late_deliveries_by_20%_in_90_days"), JSON.stringify(o.slice(Math.max(0, o.indexOf("_90") - 60), o.indexOf("_90") + 20)));
  for (const v of ["a. b .", "x ._y_. z", "q. r! s ."]) {
    const h = textOf(await call("tools/call", { name: tool.name, arguments: argsWith(tool, "target_formats", v) }));
    const twin = textOf(await call("tools/call", { name: tool.name, arguments: argsWith(tool, "target_formats", "a b c") }));
    assert.ok(liveEm(h) <= liveEm(twin), `${JSON.stringify(v)}: ${liveEm(h)} against ${liveEm(twin)}`);
  }
});

test("40S2-4: proposal_section_writer never turns a digits only implementation_approach into a numbered item", async (t) => {
  const tool = tools.find((x) => x.name === "proposal_section_writer");
  if (!tool) return t.skip("no proposal_section_writer here");
  for (const v of ["2024", "7", "123456789", " 12 ", "2024."]) {
    const o = textOf(await call("tools/call", { name: tool.name, arguments: argsWith(tool, "implementation_approach", v) }));
    const lines = o.split(/\r\n|\r|\n/).filter((l) => /^ {0,3}\d{1,9}[.)](?:[ \t]|$)/.test(l) && l.trim().replace(/[.)]$/, "") === v.trim().replace(/[.]$/, ""));
    assert.deepEqual(lines, [], JSON.stringify(v));
  }
  // an ordinary approach is written as before
  const o = textOf(await call("tools/call", { name: tool.name, arguments: argsWith(tool, "implementation_approach", "Three phases over 2024") }));
  assert.ok(o.includes("\nThree phases over 2024.\n"));
});
