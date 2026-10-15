// Run 34D (connector safety run 3): tests first for the parser based answer pass. Same file in all six repositories.
// Every input of the run 32D and 33D fresh auditors (run34-auditor-cases.json), the direct shapes of their findings, made
// up tool and field names in refusals, REST replies, ordinary answers that must stay byte identical, and a time limit.
// "Live" is decided by pandoc 3 (gfm and commonmark), the auditors' own judge, run in one process with its Lua reader:
// an image, raw HTML, or a link whose target is not https or mailto (script, data, file) or holds a query or fragment.
// A link to http, a relative address or another scheme is counted as "otherlink" and not failed (a bare www address is one).
// Without pandoc on PATH the live judgement is skipped and says so; the byte identity and time tests always run.
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
const { neutraliseText, neutraliseAnswer } = await import(new URL(MODULE, import.meta.url));
const CASES = JSON.parse(fs.readFileSync(path.join(here, "run34-auditor-cases.json"), "utf8"));
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "run34-judge-"));
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
const JOINERS = [" ", "\n", "", "\n**Label:** ", " | ", "\n- "];
const nt = (s) => neutraliseText(s);

test("every input of the run 32D and 33D auditors is inert after the answer pass (pandoc gfm and commonmark)", (t) => {
  const items = [];
  for (const c of CASES) {
    if (c.expected !== "inert") continue;
    if (c.kind === "join" && Array.isArray(c.parts)) {
      for (const j of c.joiner === null || c.joiner === undefined ? JOINERS : [c.joiner]) items.push({ id: `${c.id} join ${JSON.stringify(j)}`, answer: neutraliseAnswer(c.parts.map(nt).join(j)) });
    } else if (c.kind === "answer" && typeof c.text === "string") {
      items.push({ id: `${c.id} answer`, answer: neutraliseAnswer(c.text) });
    } else if (typeof c.text === "string") {
      items.push({ id: `${c.id} field`, answer: neutraliseAnswer(nt(c.text)) });
      items.push({ id: `${c.id} field in a line`, answer: neutraliseAnswer(`**Goal:** ${nt(c.text)}\n**Next:** plan`) });
      items.push({ id: `${c.id} answer`, answer: neutraliseAnswer(c.text) });
    }
    if (c.fields && typeof c.fields === "object") {
      const vals = Object.values(c.fields).filter((v) => typeof v === "string");
      if (vals.length > 1) for (const j of JOINERS) items.push({ id: `${c.id} fields ${JSON.stringify(j)}`, answer: neutraliseAnswer(vals.map(nt).join(j)) });
      for (const v of vals) items.push({ id: `${c.id} one field`, answer: neutraliseAnswer(nt(v)) });
    }
  }
  assert.ok(items.length > 100, `only ${items.length} items`);
  t.diagnostic(assertInert(items, "auditor cases"));
});

// The finding shapes of the round 6 auditors and the lead (neutral targets only), in one field, joined, split over lines,
// inside quotes, lists and tables, and after characters that pandoc treats as the start of a bare address.
const LONG = "a".repeat(400);
const SHAPES = [
  "![x](https://evil.example/c.png)", "![x][r]\n\n[r]: https://evil.example/c.png", "![x]\n\n[x]: https://evil.example/c.png", "![x][]\n\n[x]: https://evil.example/c.png",
  "[a](javascript:alert(1))", "[a](JaVaScRiPt:alert(1))", "[a](&#106;avascript:alert(1))", "[a](data:,sentinel)", "[a](data:text/html,sentinel)", "[a](file:///sentinel)",
  "[a](<file:///sentinel>)", "<file:///sentinel>", "<javascript:alert(1)>", "<data:,sentinel>", "<https://evil.example/c?d=1>",
  `Note [${LONG}](data:,sentinel)`, `Note [a](file:///${"p".repeat(1600)})`, `Note [${LONG}](file:///etc/passwd)`,
  "See [x][r]\n\n> [r]: file:///sentinel", "- [r]: file:///sentinel\n\n[r]", "[x][r\\]]\n\n[r\\]]: file:///sentinel", "[x][a\nb]\n\n[a\nb]: file:///sentinel",
  "See [a](https://evil.example/c(x)?d=1)", "See [a](https://evil.example/c'x?d=1)", "See [a](https://evil.example/c\"x?d=1)", "see https://evil.example/c“x?d=1 now",
  "see <https://evil.example/c>\"t\"img#frag now", "see https://evil.example/c&quest;d=1", "see https://evil.example/c&#63;d=1", "see https://evil.example/c&#x3F;d=1",
  "see:https://evil.example/?d=1", "x(https://evil.example/?d=1)", "a\"https://evil.example/?d=1", "x\\https://evil.example/?d=1", "see https://evil.example/c)?d=1",
  "see https://user:pw@evil.example/c", "[a](https://user:pw@evil.example/c)", "[a](mailto:a@evil.example?body=x)",
  "<img src=x>", "<b>x</b>", "<!-- c -->", "<script>x</script>", "<svg onload=x>", "<div>\n\nx", "</p>", "<a href=\"file:///sentinel\">x</a>",
  "| a | b |\n|---|---|\n| [c](file:///sentinel) | d |", "> [a](data:,sentinel)", "- [ ] [a](file:///sentinel)", "# [a](javascript:alert(1))",
  "`a` [x](file:///sentinel) `b", "[a](https://evil.example/" + "p".repeat(1600) + "?d=1)",
];
const SPLITS = [
  ["[click", "here](file:///etc/passwd)"], ["see [a](", "file:///etc/passwd) now"], ["see [a](", "data:,hello) now"], ["x !", "[a](https://evil.example/c.png)"],
  ["Field A: [a](", "data:,hello) tail"], ["<im", "g src=x>"], ["see https://evil.example/p", "?d=1"], ["[x][r]", "[r]: file:///sentinel"],
  ["[a", "](javascript:alert(1))"], ["<", "b>x"], ["!", "[x](https://evil.example/c.png)"], ["![a", "b](https://evil.example/c.png)"],
  ["x `y", "z` ![a `\nb](https://evil.example/c.png)"], ["<https://evil.example/c", "?d=1>"], ["[a](https://evil.example/c", "?d=1)"],
];
test("the round 6 finding shapes are inert: one field, in a line, joined with every joiner, refusals of their text", (t) => {
  const items = [];
  for (const s of SHAPES) {
    items.push({ id: `shape ${s.slice(0, 40)}`, answer: neutraliseAnswer(nt(s)) });
    items.push({ id: `shape line ${s.slice(0, 40)}`, answer: neutraliseAnswer(`**Industry:** ${nt(s)}\n**Challenge:** next`) });
    items.push({ id: `shape answer ${s.slice(0, 40)}`, answer: neutraliseAnswer(s) });
  }
  for (const [a, b] of SPLITS) for (const j of JOINERS) items.push({ id: `split ${a}|${b} ${JSON.stringify(j)}`, answer: neutraliseAnswer(`**Industry:** ${nt(a)}${j}${nt(b)}\n**Solution:** plan`) });
  t.diagnostic(assertInert(items, "shapes"));
});

let nextId = 1;
async function rpc(method, params) {
  const r = await mcp(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  }), {});
  return r.json();
}
const textsOf = (j) => (j.result && j.result.content ? j.result.content.map((c) => c.text) : [JSON.stringify(j.error || j)]);
test("refusals: made up tool names and made up field names over 4,000 characters are inert (hosted MCP)", async (t) => {
  const tools = (await rpc("tools/list", {})).result.tools;
  const tool = tools[0];
  const req = Object.fromEntries(((tool.inputSchema || {}).required || []).map((k) => {
    const p = tool.inputSchema.properties[k];
    return [k, Array.isArray(p.enum) ? p.enum[0] : p.type === "number" || p.type === "integer" ? 100 : p.type === "boolean" ? true : p.type === "array" ? ["B2B SaaS"] : p.type === "object" ? {} : "B2B SaaS"];
  }));
  const items = [];
  const names = [...SHAPES.filter((s) => s.length < 90), ...SPLITS.map(([a, b]) => a + "\n" + b)];
  for (const name of names) {
    for (const x of textsOf(await rpc("tools/call", { name, arguments: {} }))) items.push({ id: `unknown tool ${name}`, answer: x });
    for (const x of textsOf(await rpc("tools/call", { name, arguments: { note: "a".repeat(4001) } }))) items.push({ id: `unknown tool long ${name}`, answer: x });
  }
  for (const [a, b] of SPLITS) {
    const args = { ...req, [`a\n${a}`]: "a".repeat(4001), [`x\n${b}`]: "a".repeat(4001) };
    for (const x of textsOf(await rpc("tools/call", { name: tool.name, arguments: args }))) items.push({ id: `field names ${a}|${b}`, answer: x });
    for (const x of textsOf(await rpc("tools/call", { name: tool.name, arguments: { ...req, extra: { [`a\n${a}`]: "a".repeat(4001), [`x\n${b}`]: "a".repeat(4001) } } }))) items.push({ id: `nested field names ${a}|${b}`, answer: x });
  }
  t.diagnostic(assertInert(items, "refusals"));
});

test("REST (GTM Alpha /api/epic-audit): every field with each short shape is inert in every string of the reply", { skip: gtmAlpha ? false : "GTM Alpha only" }, async (t) => {
  const { default: gtmApi } = await import(new URL("../netlify/functions/api.js", import.meta.url));
  const VALID = { company: "a regional logistics company", industry: "logistics", company_stage: "growth", current_gtm: "partner-led", focus_areas: ["ecosystem", "inbound"] };
  const strings = (v, acc) => {
    if (typeof v === "string") acc.push(v);
    else if (Array.isArray(v)) v.forEach((x) => strings(x, acc));
    else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, acc));
    return acc;
  };
  const items = [];
  for (const s of SHAPES.filter((x) => x.length < 90)) {
    for (const body of [{ ...VALID, company: s }, { ...VALID, company_id: s }, { ...VALID, industry: s }, { ...VALID, current_gtm: s }, { ...VALID, focus_areas: [s] }, { ...VALID, [s]: "x" }]) {
      const r = await gtmApi(new Request("https://gtmalpha.gtmhelix.com/api/epic-audit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), {});
      const text = await r.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }
      for (const x of strings(json, [])) items.push({ id: `epic-audit ${s}`, answer: x });
    }
  }
  t.diagnostic(assertInert(items, "gtm alpha rest"));
});

test("REST: unknown tool names and made up field names are inert in the reply text", { skip: api ? false : "GTM Alpha: see the /api/epic-audit test" }, async (t) => {
  const post = async (tool, body) => {
    const r = await api(new Request(`https://x.gtmhelix.com/api/tools/${encodeURIComponent(tool)}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    }), { params: { tool } });
    return r.text();
  };
  const tools = (await rpc("tools/list", {})).result.tools;
  const items = [];
  const strings = (v, acc) => {
    if (typeof v === "string") acc.push(v);
    else if (Array.isArray(v)) v.forEach((x) => strings(x, acc));
    else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, acc));
    return acc;
  };
  for (const s of SHAPES.filter((x) => x.length < 90)) {
    for (const x of strings(JSON.parse(await post(s, { input: {} })), [])) items.push({ id: `rest unknown ${s}`, answer: x });
    for (const x of strings(JSON.parse(await post(tools[0].name, { input: { [s]: "x" } })), [])) items.push({ id: `rest field ${s}`, answer: x });
  }
  t.diagnostic(assertInert(items, "rest"));
});

// Ordinary answers: no image, raw tag, bad link or attached query, so the answer pass returns them byte for byte.
const ORDINARY = [
  "#Wow![Great]onboarding", "Topic: Wow! [Great] onboarding\n#Wow![Great]onboarding #B2B", "2. Wow! [Big] win",
  "See [the guide](https://gtmhelix.com/guide) and <https://gtmhelix.com/> or write to <hello@gtmhelix.com>.",
  "- [ ] security review\n- [x] pricing page\n- [docs][d]\n\n[d]: https://gtmhelix.com/docs/",
  "Did you see https://gtmhelix.com/docs/?", "[d]: https://gtmhelix.com/docs/?\"]**", "Use `![x](y)` in code, and\n```\n<b>x</b>\n```\nin a block.",
  "| Stage | Owner |\n|---|---|\n| Pilot [1] | RevOps |", "Score: 72/100 (target 80). Next: [book a call](https://gtmhelix.com/consultation).",
  "a < b and c > d, 5<10, x<=y, <3 teams", "[1] footnote style, [a] and [b], (see above)!", "Visit www.gtmhelix.com for more.",
  "**Industry:** SaaS\n**Challenge:** churn [Q3]\n**Solution:** playbook", "Email: sales@example.com; phone: +91 98000 00000",
  "Plan note x !\n[logo] later", "1. Map the ICP\n2. Draft the deck\n   - ![ is a sign we use in notes",
];
test("ordinary answers stay byte identical", () => {
  for (const a of ORDINARY) assert.equal(neutraliseAnswer(a), a, `changed: ${JSON.stringify(a)} -> ${JSON.stringify(neutraliseAnswer(a))}`);
  for (const c of CASES) if (c.kind === "ordinary" && typeof c.base_output === "string" && c.base_output_is_answer === true) assert.equal(neutraliseAnswer(c.base_output), c.base_output, c.id);
});

test("no input of 100,000 characters takes more than 1 second in neutraliseAnswer", () => {
  const N = 100000;
  const inputs = ["[".repeat(N), "![".repeat(N / 2), "](".repeat(N / 2), "<".repeat(N), "<a".repeat(N / 2), "`".repeat(N), "*a".repeat(N / 2),
    "> ".repeat(N / 2), "- ".repeat(N / 2), "https://".repeat(N / 8), "www.a".repeat(N / 5), "&#63;".repeat(N / 5), "[a](".repeat(N / 4),
    "[a]: b\n".repeat(N / 7), "a\n".repeat(N / 2), "|a".repeat(N / 2), "\\".repeat(N), "x ".repeat(N / 2), "![a](https://evil.example/c.png)".repeat(N / 32),
    "[x](file:///s) ".repeat(N / 15), "<b>".repeat(N / 3), "https://evil.example/c?d=1 ".repeat(N / 27), "_a".repeat(N / 2), "~~a".repeat(N / 3),
    // shapes on which micromark itself is slower than linear, each with a "[" so the parse is not skipped
    "[" + "*a".repeat(N / 2), "[" + "](".repeat(N / 2), "[" + "]".repeat(N), "[" + "1. ".repeat(N / 3), "[" + "> ".repeat(N / 2), "[a][".repeat(N / 4),
    "[a](<".repeat(N / 5), "[a](b '".repeat(N / 7), "[^a]".repeat(N / 4), "- [x] a\n".repeat(N / 8), "[" + "* a\n  ".repeat(N / 6), "[" + "|a".repeat(N / 2),
    "[" + "a\n".repeat(N / 2), "[".repeat(N / 2) + "]".repeat(N / 2), "[".repeat(N / 3) + "](".repeat(N / 3), ("> ".repeat(12) + "[a](b)\n").repeat(N / 31)];
  for (const s of inputs) {
    const t0 = performance.now();
    neutraliseAnswer(s);
    const ms = performance.now() - t0;
    assert.ok(ms < 1000, `${JSON.stringify(s.slice(0, 12))} x ${s.length}: ${Math.round(ms)} ms`);
  }
});

// Run 34D fix round (tests first, from the fresh auditors of run 34D: IMPACT and CRAFT Content): a reference label that
// micromark matches and pandoc does not, quotes and ")" that pandoc keeps at the end of a bare address, TeX math ($...$ in
// pandoc's GFM) that hides a backtick, footnotes (indented continuation, "[^1]: ..." that is not a link definition).
const ROUND2 = [
  "[https://evil.example/(x)?q=1ı]\n\n[https://evil.example/(x)?q=1i]: https://safe.example/",
  "See https://evil.example/(a)?”’”’’ now", "See https://evil.example/c?\"x\" now", "See https://evil.example/c?x) now", "See https://evil.example/c?x; now",
  "Acme Example $`$ _https://evil.example/?q=1 ``", "Acme Example $`$ <?x?> ``", "Acme Example $`$ <img src=x> ``",
  "Acme $`$ [" + "a".repeat(320) + "](file:///sentinel) ``", "Acme $`$ [" + "a".repeat(320) + "](data:,sentinel) ``", "$`$ [x](file:///sentinel) `",
  "Note[^1]\n\n[^1]: Source.\n\n    [x](file:///sentinel) and https://evil.example/?q=1", "Note[^1]\n\n[^1]: [x](data:,sentinel)", "Note[^a]\n\n[^a]:\n    <img src=x>",
];
test("run 34D fix round: the shapes of the run 34D auditors are inert (one field, in a line, joined)", (t) => {
  const items = [];
  for (const x of ROUND2) {
    items.push({ id: `r2 ${x.slice(0, 40)}`, answer: neutraliseAnswer(x) });
    items.push({ id: `r2 field ${x.slice(0, 40)}`, answer: neutraliseAnswer(nt(x)) });
    items.push({ id: `r2 line ${x.slice(0, 40)}`, answer: neutraliseAnswer(`**Topic:** ${nt(x)}\n**Next:** plan`) });
  }
  t.diagnostic(assertInert(items, "round 2 shapes"));
});
test("run 34D fix round: a tool's own \"[Common Practice]:\" does not change a user's hashtag line, and many bare queries stay fast", () => {
  const a = "## Series\n#Wow![Great]onboarding #B2B\n\n[Common Practice]: what most teams do";
  assert.equal(neutraliseAnswer(a), a);
  const s = "www.a.example?b ".repeat(6250);
  const t0 = performance.now();
  neutraliseAnswer(s);
  assert.ok(performance.now() - t0 < 1000, `${Math.round(performance.now() - t0)} ms`);
});

// Run 34D fix round (GTM Alpha auditor): ftp addresses, footnote bodies and titles, the "Method not found" refusal, and the
// MCP answer text of a tool that answers JSON (JSON doubles each backslash the answer pass adds, so the text itself is checked).
const ROUND2B = [
  "see ftp://evil.example/c?d=1 now", "[a](ftp://evil.example/c?d=1)", "see (ftp://evil.example/c?d=1)",
  "Note[^1]\n\n[^1]: body https://evil.example/c?d=1 and <b>x</b>", "Note[^t]\n\n[^t]: \"https://evil.example/c\"?d=1",
  "see [https://evil.example/c\"?d=1](https://gtmhelix.com/)", "see [x (https://evil.example/c)?d=1](https://gtmhelix.com/)",
  "a $[x$](https://evil.example/c?d=1) b", "a $x$ https://evil.example/c?d=1 $y$",
];
test("run 34D fix round: ftp, footnote, link text and math shapes of the GTM Alpha auditor are inert", (t) => {
  const items = [];
  for (const x of ROUND2B) {
    items.push({ id: `r2b ${x.slice(0, 40)}`, answer: neutraliseAnswer(x) });
    items.push({ id: `r2b field ${x.slice(0, 40)}`, answer: neutraliseAnswer(nt(x)) });
  }
  t.diagnostic(assertInert(items, "round 2b shapes"));
});
test("run 34D fix round (GTM Alpha): the JSON answer text and the method refusal are inert", { skip: gtmAlpha ? false : "GTM Alpha only" }, async (t) => {
  const items = [];
  const pairs = [["x [a", "](file:///sentinel) y"], ["<im", "g src=x>"], ["a\n\n[r]", "[r]: data:,sentinel"], ["see [a](", "data:,sentinel)"]];
  const tools = (await rpc("tools/list", {})).result.tools;
  for (const tool of tools) {
    const props = (tool.inputSchema || {}).properties || {};
    const free = Object.entries(props).filter(([, p]) => p.type === "string" && !Array.isArray(p.enum)).map(([k]) => k);
    const req = Object.fromEntries(((tool.inputSchema || {}).required || []).map((k) => [k, Array.isArray(props[k].enum) ? props[k].enum[0] : props[k].type === "array" ? ["inbound"] : "a regional logistics company"]));
    for (const fa of free) for (const fb of free) {
      if (fa === fb) continue;
      for (const [a, b] of pairs) for (const x of textsOf(await rpc("tools/call", { name: tool.name, arguments: { ...req, [fa]: a, [fb]: b } }))) items.push({ id: `${tool.name} ${fa}+${fb}`, answer: x });
    }
    for (const x of textsOf(await rpc("tools/call", { name: tool.name, arguments: { ...req, [free[0]]: "x <img src=x> [a](data:,sentinel) ![i](https://evil.example/c.png)" } }))) items.push({ id: `${tool.name} one`, answer: x });
  }
  // the GTM Alpha auditor's own cases (c3 *-pi, c5 gc-para-*)
  for (const [name, args] of [["epic_audit", { challenge: "We sell to mid-market", company_name: "Acme Example <?php evil ?> tail" }],
    ["gtm_consultation", { gtm_challenge: "Acme Example <?php evil ?> tail", company_name: "Acme Example" }],
    ["gtm_consultation", { company_name: "[Acme Example", gtm_challenge: "\n\n](data:,sentinel) we sell to mid-market" }],
    ["gtm_consultation", { company_name: "[Acme Example", gtm_challenge: "\n\n](file:///sentinel) we sell to mid-market" }]]) {
    for (const x of textsOf(await rpc("tools/call", { name, arguments: args }))) items.push({ id: `${name} auditor case`, answer: x });
  }
  for (const m of ["[a](https://evil.example/c?d=1)", "<?x?>", "see https://evil.example/c\"?d=1", "x\n\n[r]: file:///sentinel\n\n[r]"]) {
    const r = await mcp(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 9, method: m, params: {} }) }), {});
    const j = await r.json();
    items.push({ id: `method ${m}`, answer: (j.error && j.error.message) || JSON.stringify(j) });
  }
  t.diagnostic(assertInert(items, "gtm alpha json text and method refusal"));
});
