// Run 36D (connector safety run 4): tests first for the run 34D register items 34D-1 to 34D-8. Same file in all six repositories.
// Live is judged by pandoc 3 (gfm and commonmark) in one process, as in run34-parser.test.mjs (same judge); neutral targets only.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const gtmAlpha = fs.existsSync(path.join(here, "../netlify/lib/echo-safe.js"));
const MODULE = process.env.ECHO_MODULE || (gtmAlpha ? "../netlify/lib/echo-safe.js" : "../dist/echo-safe.js");
const { neutraliseText, neutraliseAnswer, neutraliseJsonText } = await import(new URL(MODULE, import.meta.url));
const { default: mcp } = await import(new URL(gtmAlpha ? "../netlify/functions/mcp-sse.js" : "../netlify/functions/mcp.mjs", import.meta.url));
const api = gtmAlpha ? null : (await import(new URL("../netlify/functions/api.mjs", import.meta.url))).default;

const JUDGE_LUA = "-- Run 34D live judge: reads cases (one JSON string per line) from the file named in arg[1], parses each with pandoc's own\n-- reader in the format arg[2] (\"gfm\" or \"commonmark\"), and prints one line per case: \"0\" (inert) or \"1 <kinds>\" (live).\n-- Live means: an Image; raw HTML (RawInline or RawBlock); a Link whose target is not https or mailto, or holds \"?\" or \"#\".\nlocal fmt = arg[2] or \"gfm\"\nlocal function badTarget(u)\n  local s = u:lower()\n  local scheme = s:match(\"^([a-z][a-z0-9+.-]*):\")\n  if scheme ~= \"https\" and scheme ~= \"mailto\" then return \"scheme\" end\n  if u:find(\"[?#]\") then return \"query\" end\n  return nil\nend\n-- run 34D fix round (GTM Alpha auditor): a query or fragment fails on a link of any scheme, http and ftp included\nlocal function hasQuery(u)\n  return u:find(\"[?#]\") ~= nil\nend\nfor line in io.lines(arg[1]) do\n  local text = pandoc.json.decode(line)\n  local ok, doc = pcall(pandoc.read, text, fmt)\n  if not ok then\n    print(\"E\")\n  else\n    local kinds = {}\n    local function add(k) kinds[k] = true end\n    doc:walk({\n      Image = function(el) add(\"image\") end,\n      RawInline = function(el) add(\"tag\") end,\n      RawBlock = function(el) add(\"tag\") end,\n      Link = function(el)\n        local b = badTarget(el.target)\n        if b == \"scheme\" then\n          local t = el.target:lower():gsub(\"%s\", \"\")\n          if t:find(\"^javascript\") or t:find(\"^vbscript\") then add(\"script\")\n          elseif t:find(\"^data\") then add(\"data\")\n          elseif t:find(\"^file\") then add(\"file\")\n          else add(\"otherlink\") end\n        end\n        if hasQuery(el.target) then add(\"query\") end\n      end,\n    })\n    local ks = {}\n    for k in pairs(kinds) do ks[#ks + 1] = k end\n    table.sort(ks)\n    if #ks == 0 then print(\"0\") else print(\"1 \" .. table.concat(ks, \",\")) end\n  end\nend\n";
let pandoc = true;
try {
  execFileSync("pandoc", ["--version"], { stdio: "ignore" });
} catch {
  pandoc = false;
}
const FAIL_KINDS = new Set(["image", "tag", "script", "data", "file", "query"]);
// Judges many answers at once; returns, per answer, the failing kinds in gfm or commonmark ([] when inert).
function liveKinds(answers) {
  if (!pandoc) return null;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "run36-judge-"));
  const lua = path.join(dir, "judge.lua");
  const input = path.join(dir, "in.jsonl");
  fs.writeFileSync(lua, JUDGE_LUA);
  fs.writeFileSync(input, answers.map((a) => JSON.stringify(a).replace(/[\u007f-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"))).join("\n") + "\n");
  const out = answers.map(() => new Set());
  for (const mode of ["gfm", "commonmark"]) {
    const lines = execFileSync("pandoc", ["lua", lua, input, mode], { encoding: "utf8", maxBuffer: 1 << 28 }).trim().split("\n");
    assert.equal(lines.length, answers.length, "judge line count");
    lines.forEach((l, i) => {
      if (l === "E") out[i].add("judge-error");
      else if (l.startsWith("1 ")) for (const k of l.slice(2).split(",")) if (FAIL_KINDS.has(k)) out[i].add(`${k}(${mode})`);
    });
  }
  fs.rmSync(dir, { recursive: true, force: true });
  return out.map((s) => [...s]);
}
function assertInert(items, label) {
  const kinds = liveKinds(items.map((x) => x.answer));
  if (kinds === null) return "skipped: pandoc not found";
  const live = items.map((x, i) => ({ ...x, kinds: kinds[i] })).filter((x) => x.kinds.length);
  assert.equal(live.length, 0, `${label}: ${live.length} of ${items.length} live, first: ${JSON.stringify(live.slice(0, 5).map((x) => ({ id: x.id, kinds: x.kinds, answer: x.answer.slice(0, 300) })))}`);
  return `${items.length} inert`;
}

const nt = (s) => neutraliseText(s);
const strings = (v, acc) => {
  if (typeof v === "string") acc.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, acc));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, acc));
  return acc;
};
let nextId = 1;
async function rpc(method, params) {
  const r = await mcp(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  }), {});
  return r.json();
}
const textsOf = (j) => (j.result && j.result.content ? j.result.content.map((c) => c.text) : [JSON.stringify(j.error || j)]);
function sample(p) {
  if (Array.isArray(p.enum) && p.enum.length) return p.enum[0];
  if (p.type === "number" || p.type === "integer") return typeof p.minimum === "number" && p.minimum > 100 ? p.minimum : 100;
  if (p.type === "boolean") return true;
  if (p.type === "array") return [p.items && p.items.type === "object" ? {} : "B2B SaaS"];
  if (p.type === "object") return {};
  return "a regional logistics company";
}
// every tool with its required fields filled, and its free text fields (strings without an enum)
async function toolFields() {
  const tools = (await rpc("tools/list", {})).result.tools;
  return tools.map((tool) => {
    const props = (tool.inputSchema || {}).properties || {};
    const req = Object.fromEntries(((tool.inputSchema || {}).required || []).map((k) => [k, sample(props[k])]));
    const free = Object.entries(props).filter(([, p]) => p.type === "string" && !Array.isArray(p.enum)).map(([k]) => k);
    return { tool, req, free };
  });
}
async function restTexts(tool, input) {
  if (gtmAlpha) return [];
  const r = await api(new Request(`https://x.gtmhelix.com/api/tools/${encodeURIComponent(tool)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input }) }), { params: { tool } });
  const text = await r.text();
  try {
    return strings(JSON.parse(text), []);
  } catch {
    return [text];
  }
}
async function gtmRest(body) {
  const { default: gtmApi } = await import(new URL("../netlify/functions/api.js", import.meta.url));
  const r = await gtmApi(new Request("https://gtmalpha.gtmhelix.com/api/epic-audit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), {});
  return r.text();
}
const GTM_VALID = { company: "a regional logistics company", industry: "logistics", company_stage: "growth", current_gtm: "partner-led", focus_areas: ["ecosystem", "inbound"] };

// Register 34D-1 (CRAFT Content round 2 auditor of run 34D): a query cut that takes the backslash before "<" must be followed by a
// parse again, so the raw HTML after it is found.
const CUT = [
  "see x_https://evil.example/c?x\\<?php x ?> end", "see mailto:a@evil.example?x\\<?php x ?> end", "see ftp://evil.example/c?x\\<?x?> end",
  "see https://evil.example/c&quest;x\\<?x?> end", "see mailto:a@evil.example?<?x?> end", "see x_https://evil.example/c?<?x?> end",
  "see ftp://evil.example/c?<?x?>#x end", "see https://evil.example/c?x\\<img src=x> end", "see https://evil.example/c?x\\<!-- c --> end",
  "see https://evil.example/c?x\\<javascript:alert(1)> end", "see https://evil.example/c?x\\<file:///sentinel> end", "see https://evil.example/c?x\\<data:,sentinel> end",
];
test("run 36D, 34D-1: a removed query is always followed by a parse again (direct, field path, tools, refusals, REST)", async (t) => {
  const items = [];
  for (const x of CUT) {
    items.push({ id: `direct ${x}`, answer: neutraliseAnswer(x) });
    items.push({ id: `field ${x}`, answer: neutraliseAnswer(nt(x)) });
    items.push({ id: `line ${x}`, answer: neutraliseAnswer(`# Newsletter Builder: ${nt(x)}\n**Next:** plan`) });
  }
  const tf = await toolFields();
  for (const { tool, req, free } of tf.slice(0, 3)) {
    for (const x of CUT.slice(0, 7)) {
      for (const f of free.slice(0, 2)) for (const a of textsOf(await rpc("tools/call", { name: tool.name, arguments: { ...req, [f]: x } }))) items.push({ id: `${tool.name}.${f} ${x}`, answer: a });
      for (const a of textsOf(await rpc("tools/call", { name: x, arguments: {} }))) items.push({ id: `unknown ${x}`, answer: a });
      for (const a of textsOf(await rpc("tools/call", { name: tool.name, arguments: { ...req, [x]: "a".repeat(4001) } }))) items.push({ id: `long field ${x}`, answer: a });
      for (const a of await restTexts(x, {})) items.push({ id: `rest unknown ${x}`, answer: a });
      for (const a of await restTexts(tool.name, { ...req, [x]: "x" })) items.push({ id: `rest field ${x}`, answer: a });
    }
  }
  t.diagnostic(assertInert(items, "34D-1"));
});

// Register 34D-7 (IMPACT search only auditor of run 34D): pandoc drops a lone carriage return; micromark reads it as a line end.
const CR_TARGETS = ["![a](https://evil.example/p.png)", "[c](javascript:alert(1))", "<img src=x>", "x https://evil.example/x?q=1", "[c](file:///sentinel)", "<script>x</script>"];
const CR_SHAPES = ["!\r[a](https://evil.example/p.png)", "<\rimg src=x>", "h\rttps://evil.example/x?q=1", "x [c]\r(javascript:alert(1))", "x [c]\r(file:///sentinel)",
  "x ![a]\r(https://evil.example/p.png)", "x https://evil.example/x\r?q", "[a](\rjavascript:alert(1))", "<scr\ript>x</script>", "x [c](file:///sentinel\r)"];
test("run 36D, 34D-7: a lone carriage return inside markup leaves nothing live (every position, field path, tools, REST)", async (t) => {
  const items = [];
  for (const target of CR_TARGETS) for (let i = 0; i <= target.length; i++) {
    const x = target.slice(0, i) + "\r" + target.slice(i);
    items.push({ id: `direct ${JSON.stringify(x)}`, answer: neutraliseAnswer(x) });
    items.push({ id: `field ${JSON.stringify(x)}`, answer: neutraliseAnswer(`**Product**: ${nt(x)}\n**Next:** plan`) });
  }
  const tf = await toolFields();
  for (const { tool, req, free } of tf.slice(0, 3)) for (const x of CR_SHAPES) {
    for (const a of textsOf(await rpc("tools/call", { name: tool.name, arguments: { ...req, [free[0]]: x } }))) items.push({ id: `${tool.name} ${JSON.stringify(x)}`, answer: a });
    for (const a of await restTexts(tool.name, { ...req, [free[0]]: x })) items.push({ id: `rest ${tool.name} ${JSON.stringify(x)}`, answer: a });
  }
  if (gtmAlpha) for (const x of CR_SHAPES) for (const a of strings(JSON.parse(await gtmRest({ ...GTM_VALID, industry: x })), [])) items.push({ id: `gtm rest ${JSON.stringify(x)}`, answer: a });
  t.diagnostic(assertInert(items, "34D-7"));
});

// Registers 34D-3 and 34D-4 (GTM Alpha round 2 auditor of run 34D): the JSON answer text stays valid JSON and inert, and the REST
// reply's JSON text is checked too.
const JSON_SHAPES = ["https://evil.example/a\nfoo?bar", "https://evil.example/a\nfoo#bar", "https://evil.example/a\nx&#63;y", "https://evil.example/a\"b?c",
  "https://evil.example/a\\\"?b", "x\\", "\\\"", "https://evil.example/a\tb?c", "](file:///sentinel)", "](data:,sentinel)", "](javascript:alert(1))",
  "[a", "x\n\n[r]: file:///sentinel", "![i", "](https://evil.example/c.png)", "<img src=x>", "a\\nb?c", "https://evil.example/a\\nfoo?bar\""];
test("run 36D, 34D-3: the JSON answer text of a JSON tool stays valid JSON and inert", async (t) => {
  const items = [];
  const docs = [];
  for (const a of JSON_SHAPES) for (const b of JSON_SHAPES) {
    docs.push(JSON.stringify({ company: a, scores: { x: 1 }, list: [b, a], text: b }, null, 2));
    docs.push(JSON.stringify([a, [b], { k: a + b }]));
  }
  for (const d of docs) {
    const out = neutraliseJsonText(d);
    assert.doesNotThrow(() => JSON.parse(out), `invalid JSON from ${JSON.stringify(d.slice(0, 200))}: ${JSON.stringify(out.slice(0, 300))}`);
    items.push({ id: `json ${d.slice(0, 60)}`, answer: out });
  }
  if (gtmAlpha) {
    for (const a of JSON_SHAPES) for (const [name, args] of [["epic_audit", { challenge: "Grow pipeline", company_name: a }], ["epic_audit", { challenge: a, company_name: "Acme Example" }], ["gtm_consultation", { company_name: "Acme Example", gtm_challenge: a }]]) {
      const j = await rpc("tools/call", { name, arguments: args });
      for (const x of textsOf(j)) {
        if (j.result && !j.result.isError) assert.doesNotThrow(() => JSON.parse(x), `${name} ${JSON.stringify(a)}: invalid JSON answer text`);
        items.push({ id: `${name} ${JSON.stringify(a)}`, answer: x });
      }
    }
  }
  t.diagnostic(assertInert(items, "34D-3"));
});
test("run 36D, 34D-4: the REST reply's JSON text of GTM Alpha is valid JSON and inert", { skip: gtmAlpha ? false : "GTM Alpha only" }, async (t) => {
  const items = [];
  for (const a of JSON_SHAPES) for (const f of ["company", "industry", "current_gtm"]) {
    const text = await gtmRest({ ...GTM_VALID, [f]: a });
    assert.doesNotThrow(() => JSON.parse(text), `invalid JSON reply for ${f}=${JSON.stringify(a)}`);
    items.push({ id: `rest json ${f} ${JSON.stringify(a)}`, answer: text });
  }
  t.diagnostic(assertInert(items, "34D-4"));
});

// Registers 34D-2 and 34D-8: backslash escapes, character references and comment or processing openers count in the budget.
test("run 36D, 34D-2 and 34D-8: no input of 100,000 characters takes more than 1 second (the run 34D auditors' slow shapes)", () => {
  const N = 100000;
  const fill = (s) => (s + " a".repeat(N)).slice(0, N);
  const inputs = [
    ("$ [a](https://evil.example/?q) " + "\\* ".repeat(N)).slice(0, N), ("[a](https://evil.example/?q) " + "\\* ".repeat(N)).slice(0, N),
    ("$ [a](https://evil.example/?q) " + "&amp; ".repeat(N)).slice(0, N), ("Acme Example & partners: see [notes](https://example.com/notes). " + "&amp; ".repeat(N)).slice(0, N),
    ("<!--".repeat(1990) + "x".repeat(N)).slice(0, N), ("<?".repeat(1990) + "x".repeat(N)).slice(0, N), ("<!a".repeat(1990) + "x".repeat(N)).slice(0, N),
    ("<![CDATA[".repeat(1990) + "x".repeat(N)).slice(0, N), ("[x] <!--".repeat(250) + "x".repeat(N)).slice(0, N),
    Array.from({ length: 481 }, (_, i) => `[l${i}]: file:///s${i}\n\n[l${i}] word word\n\n`).join("").padEnd(N, " w").slice(0, N),
    "www.a.example?b ".repeat(N / 16), "https://a.example/?b ".repeat(N / 21), "[a](https://evil.example/?q) x\n\n".repeat(N / 32),
    fill("[a ".repeat(990) + "a] ".repeat(990) + "<a ".repeat(1960) + "<!--".repeat(31) + "\\* ".repeat(990) + "&amp; ".repeat(990) + "| ".repeat(2990) + "` ".repeat(1990)),
    fill(("[a <a \\* &amp; | ` x\n").repeat(990)), fill(("[".repeat(1000) + "](x".repeat(500) + "]".repeat(500))),
    ("x https://evil.example/?q=1 y [a](file:///s)\n\n").repeat(N / 45), ("![a](https://evil.example/c.png)\n\n[b]: file:///s\n\n").repeat(N / 50),
  ];
  for (const s of inputs) {
    const t0 = performance.now();
    neutraliseAnswer(s);
    const ms = performance.now() - t0;
    assert.ok(ms < 1000, `${JSON.stringify(s.slice(0, 24))} x ${s.length}: ${Math.round(ms)} ms`);
  }
});

// (An "![" with a "](" anywhere after it is made plain in any answer, short or long: the run 34D rule, unchanged; so these
// ordinary blocks hold no "![".)
// Register 34D-5: an ordinary answer over the budget (for example over 120,000 characters) keeps its bytes (block wise pass), and
// a crafted one is inert.
const ORDINARY_BLOCKS = [
  "## Buyer group\n\n**Their Concern**: [Their main concern, in their words]\n**Our Answer**: [How we address it]",
  "- [ ] security review\n- [x] pricing agreed\nSee https://acme.example/plan and [our plan](https://gtmhelix.com/plan/).",
  "| **Author Credibility** | [your role] |\n|---|---|\n| Pilot [1] | RevOps |", "Use `![x](y)` and `<b>x</b>` in code, as a writer would.",
  "#Wow #B2B and Stop Doing [Common Practice]: What Actually Works", "- Date: [Deliverable]\n- [Owner] to confirm",
  "Score: 72/100 (target 80, hypothetical). Next: [book a call](https://gtmhelix.com/consultation).", "a < b and c > d, 5<10, x<=y, <3 teams & partners",
  "1. Map the ICP\n2. Draft the deck\n   - [ ] is a sign we use in notes", "> Quote from the call (as pasted, not yet checked)\n> second line",
];
function longOrdinary(n) {
  let s = "";
  for (let i = 0; s.length < n; i++) s += ORDINARY_BLOCKS[i % ORDINARY_BLOCKS.length] + "\n\n" + "Pasted note ".repeat(40 + (i % 7)) + "\n\n";
  return s;
}
test("run 36D, 34D-5: ordinary answers over the budget keep their bytes", () => {
  for (const n of [121000, 172164, 400000]) {
    const a = longOrdinary(n);
    assert.equal(neutraliseAnswer(a), a, `changed at ${n} characters`);
  }
  // over the budget by count, not by length: 1,100 task boxes in sections of 50 (one block by itself over the budget, with no
  // blank line in it, still gets the last resort: the recorded limit)
  const boxes = ("## Section\n\n" + "- [ ] item\n".repeat(50) + "\n" + "Pasted note ".repeat(300) + "\n\n").repeat(22) + "Done.";
  assert.equal(neutraliseAnswer(boxes), boxes);
  const lines = ("Line of the plan with [a](https://gtmhelix.com/) link\n\n" + "Pasted note ".repeat(40) + "\n\n").repeat(1100);
  assert.equal(neutraliseAnswer(lines), lines);
  // a tool's own placeholder definition lines, repeated in a long answer (no "![" in it)
  const timeline = ("## Week\n\n[Date]: [Deliverable]\n[Owner]: [Name]\n\n" + "Pasted note ".repeat(50) + "\n\n").repeat(250);
  assert.equal(neutraliseAnswer(timeline), timeline);
});
test("run 36D, 34D-5: crafted answers over the budget are inert (block wise pass)", (t) => {
  const pad = longOrdinary(125000);
  const items = [];
  const shapes = ["![x](https://evil.example/c.png)", "[a](javascript:alert(1))", "<img src=x>", "see https://evil.example/c?d=1 now", "[a](file:///sentinel)",
    "![x]\n\nlater", "[r]: file:///sentinel", "```\nx\n", "<!--\n\nx\n\n-->\n\n<img src=x>", "$`$ <?x?> `", "Note[^1]\n\n[^1]: a\n\n    [x](file:///sentinel)"];
  for (const a of shapes) for (const b of shapes) {
    items.push({ id: `over ${a}|${b}`, answer: neutraliseAnswer(a + "\n\n" + pad + "\n\n" + b + "\n\n[x]: https://evil.example/c.png\n\n[r]") });
    items.push({ id: `over mid ${a}|${b}`, answer: neutraliseAnswer(pad.slice(0, 60000) + "\n\n" + a + "\n\n" + pad.slice(60000) + "\n\n" + b) });
  }
  // a fence that opens in one part and closes in another
  items.push({ id: "fence", answer: neutraliseAnswer("```\n" + pad + "\n\n```\n\n[a](javascript:alert(1)) <img src=x>\n\n" + pad) });
  items.push({ id: "fence 2", answer: neutraliseAnswer(pad + "\n\n  ```\n  x\n\nb\n```\n<!-- -->\n\nc\n\n" + pad + "\n\n```\n\n[a](file:///sentinel)") });
  t.diagnostic(assertInert(items, "34D-5 crafted"));
});

// Run 36D, found by the lead before the fix commit: pandoc trims a reference label and treats a vertical tab, a form feed, U+0085
// and a no-break space as white space; micromark does not, so "[c][\vr]" uses "[r]: ..." in pandoc only.
test("run 36D: reference labels with white space that only pandoc folds are inert (every position, seven targets)", (t) => {
  const T = ["![a](https://evil.example/p.png)", "[c](javascript:alert(1))", "<img src=x>", "x https://evil.example/x?q=1", "[c](file:///sentinel)", "[c][r]\n\n[r]: file:///sentinel", "![c][r]\n\n[r]: https://evil.example/p.png"];
  const CH = ["\u0000", "\u000b", "\u000c", "\u0085", " ", " ", " ", "\u001c", "\u001e", "\t", "​", "﻿", "　", " "];
  const items = [];
  for (const x0 of T) for (const c of CH) for (let i = 0; i <= x0.length; i++) {
    const x = x0.slice(0, i) + c + x0.slice(i);
    items.push({ id: `direct ${JSON.stringify(x)}`, answer: neutraliseAnswer(x) });
    items.push({ id: `field ${JSON.stringify(x)}`, answer: neutraliseAnswer(nt(x)) });
  }
  t.diagnostic(assertInert(items, "label white space"));
});
