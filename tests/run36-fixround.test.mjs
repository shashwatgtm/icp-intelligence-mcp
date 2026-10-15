// Run 36D fix round (R36D-03): tests first from the run 36D fresh auditors and the lead's corpus. Same file in all six
// repositories; live is judged by pandoc 3 (gfm and commonmark), walking metadata too, as in run36-parser.test.mjs.
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
let judgeErrors = 0;
function liveKinds(answers) {
  if (!pandoc) return null;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "run36f-judge-"));
  const lua = path.join(dir, "judge.lua");
  const input = path.join(dir, "in.jsonl");
  fs.writeFileSync(lua, JUDGE_LUA);
  fs.writeFileSync(input, answers.map((a) => JSON.stringify(a).replace(/[\u007f-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"))).join("\n") + "\n");
  const out = answers.map(() => new Set());
  for (const mode of ["gfm", "commonmark"]) {
    const lines = execFileSync("pandoc", ["lua", lua, input, mode], { encoding: "utf8", maxBuffer: 1 << 28 }).trim().split("\n");
    assert.equal(lines.length, answers.length, "judge line count");
    lines.forEach((l, i) => {
      // pandoc stops with an error and renders nothing (for example a YAML block made invalid by an added escape): not live,
      // counted apart (run 34D lead re-check row 29 classed it the same way)
      if (l === "E") judgeErrors++;
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
  return `${items.length} inert (pandoc errors, nothing rendered: ${judgeErrors})`;
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


const YAML = [
  "---\ntitle: \"\\x21[x](https://evil.example/p.png)\"\n---\n\nhi", "---\ntitle: \"\\x3cimg src=x onerror=alert(1)\\x3e\"\n---\nhi",
  "---\ntitle: \"[c](https://evil.example/x\\x3fq=1)\"\n---\nhi", "x\n\n---\ntitle: \"\\u0021[x](https://evil.example/p.png)\"\n...\n\ny",
  "---\na: \"\\x5bc\\x5d(file:///sentinel)\"\n---\n", "---\na: \"![x](https://evil.example/\\\n  p.png)\"\n---\n", "---\na: \"\\U00000021[x](https://evil.example/p.png)\"\n---\n",
];
YAML.push("---\ntitle: \"\\x5bc\\x5d(\\x6aavascript:alert(1))\"\n---\nhi", "---\ntitle: \"\\x5bc\\x5d(file:///sentinel)\"\n---\nhi",
  "---\ntitle: \"\\x5bc\\x5d\\x28javascript\\x3aalert(1))\"\n---\nhi", "---\ntitle: \"\\x5bc]\\\n  (file:///sentinel)\"\n---\nhi");
const GTM_AND_REVENUE = ["x[^a]\n\n[^a]: <?x", "[^a]: <?x\n\n[^a]", "[^a]:\n    <?x\n\n[^a]", "[^a]\n[^a]: <?x", "x [^b]\n\n[^b]: <?x\n> y", "x [^1]\n\n[^1]:  <?php",
  "[^a]: <?x\n<Title\n===\nhttps://evil.example/x?q=1\n?>\n\n[^a]", "Acme Example\n- [ ] <?php x",
  "https://evil.example/a&quest;<?x?> " + "<? ".repeat(40), "https://evil.example/a?<div> " + "[".repeat(1200)];
const ICP = [
  "[foo]\n\n- [ ] [foo]: //evil.example/x?y", "[foo]\n\n- [x] [foo]: //evil.example/x", "[foo]\n\n- [ ] [foo]: /x?y",
  "[^1]\n\n[^1]: [r]: data:,sentinel\n\n[r]", "[^1]\n\n[^1]: [r]: file:///sentinel\n\n[r]", "[^1]\n\n[^1]: [r]: //evil.example/?q\n\n[r]",
  "[^1]\n\n[^1]: [r]: javascript:alert(1)\n\n[r]", "- [ ] <!--\nx", "- [x] <img src=x>", "[^1]\n\n[^1]: <!--\nword", "[^1]\n\n[^1]: <img src=x>",
  ...GTM_AND_REVENUE,
  "- mailto:a@evil.example\\\\https://evil.example/c\\<<x>[image removed: r]: file:///sentinel`a\n_</\n    [^a]:\n    https://evil.example/c: `b` [image removed: `c]`](#frag) `c)",
];
test("run 36D fix round: YAML metadata blocks, footnote and task item definitions and HTML starts are inert (direct, field, tools, REST)", async (t) => {
  const items = [];
  for (const x of [...YAML, ...ICP]) {
    items.push({ id: `direct ${JSON.stringify(x)}`, answer: neutraliseAnswer(x) });
    items.push({ id: `field ${JSON.stringify(x)}`, answer: neutraliseAnswer(nt(x)) });
    items.push({ id: `after a line ${JSON.stringify(x)}`, answer: neutraliseAnswer(`# Report\n\n${nt(x)}\n\nNext: plan`) });
  }
  const tf = await toolFields();
  for (const { tool, req, free } of tf.slice(0, 3)) for (const x of [...YAML, ...ICP]) {
    for (const a of textsOf(await rpc("tools/call", { name: tool.name, arguments: { ...req, [free[0]]: x } }))) items.push({ id: `${tool.name} ${JSON.stringify(x)}`, answer: a });
    for (const a of await restTexts(tool.name, { ...req, [free[0]]: x })) items.push({ id: `rest ${tool.name} ${JSON.stringify(x)}`, answer: a });
  }
  if (gtmAlpha) for (const x of [...YAML, ...ICP]) {
    for (const a of strings(JSON.parse(await gtmRest({ ...GTM_VALID, company: x })), [])) items.push({ id: `gtm rest ${JSON.stringify(x)}`, answer: a });
    for (const s of textsOf(await rpc("tools/call", { name: "epic_audit", arguments: { challenge: "Grow pipeline", company_name: x } }))) {
      items.push({ id: `gtm text ${JSON.stringify(x)}`, answer: s });
      try { for (const a of strings(JSON.parse(s), [])) items.push({ id: `gtm value ${JSON.stringify(x)}`, answer: a }); } catch { /* refusal text */ }
    }
  }
  t.diagnostic(assertInert(items, "fix round"));
});
test("run 36D fix round: ordinary text with a YAML like block, footnotes and task items keeps its bytes", () => {
  for (const a of ["---\ntitle: Plan for Q3\nowner: RevOps\n---\n\nBody with [a link](https://gtmhelix.com/).", "Path C:\\x21\\docs and \\n in text", "- [ ] review <3 teams\n- [x] done",
    "Note[^1]\n\n[^1]: Source: the pasted call notes.", ("R&D and Q&A & P&L notes for the team. ").repeat(3000), "## Week\n\n---\n**Goal:** pilot\n\n---\n"]) assert.equal(neutraliseAnswer(a), a, JSON.stringify(a));
});
