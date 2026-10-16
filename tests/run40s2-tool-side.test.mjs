// Run 40S2 (owner decision D6, "Safe by design", second run): the tool side. Run 40S escaped every caller value once where the
// connector receives it; its fresh auditors then broke the property through what the TOOLS do afterwards (40S register 40S-1 to
// 40S-5): they cut typed text at a comma, a dot, a bracket or a word and a marker reached a line start; the hosted length
// refusal repeated a made up tool name raw; the fix round's backslash after a last line of digits escaped the tool's own bold;
// a "--:" line became a table delimiter row; GTM Alpha's JSON text wrote a line feed before "@" as "\n", so "n@host" was a mail
// address in the raw text. Tests first, from every one of those findings and their generators. Same file in every repo.
// Neutral targets only (evil.example, B81). No Markdown parser here: a line reader of block markers and emphasis runs, compared
// with a TWIN value of the same layout (the run's property tests render with micromark, mdast and pandoc: work/run40s2/prop/).
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const G = existsSync(new URL("../netlify/functions/mcp-sse.js", import.meta.url));
const mcp = (await import(new URL(G ? "../netlify/functions/mcp-sse.js" : "../netlify/functions/mcp.mjs", import.meta.url))).default;
const api = (await import(new URL(G ? "../netlify/functions/api.js" : "../netlify/functions/api.mjs", import.meta.url))).default;
const mod = await import(new URL(G ? "../netlify/lib/escape-inputs.js" : "../dist/escape-inputs.js", import.meta.url)).catch(() => null);
const S = (...c) => String.fromCharCode(...c);

const LIVE = [
  [/\]\s*\(\s*<?[^)\s]*evil\.example/i, "a link or image to the caller's address"],
  [/<[^>\s]*evil\.example/i, "an autolink or tag holding the caller's address"],
  [/(?:https?|ftp):\/\/[^\s]*evil\.example/i, "a bare address a reader links"],
  [/(?:^|[^A-Za-z0-9\\])www\.evil\.example/i, "a bare www address"],
  [/[A-Za-z0-9._+-]@evil\.example/i, "a bare mail address"],
  [/<(?:img|script|svg)\b/i, "a raw HTML tag"],
  [/`qzcode`/, "a code span"],
];
function liveIn(text) {
  const found = [];
  for (const [re, what] of LIVE) {
    for (const m of text.matchAll(new RegExp(re.source, re.flags + "g"))) {
      let at = m.index, k = 0;
      if (m[0][0] !== "<" && m[0][0] !== "]" && m[0][0] !== "`" && !/^(?:https?|ftp|www)/i.test(m[0])) at += 1;
      for (let i = at - 1; i >= 0 && text[i] === "\\"; i--) k++;
      if (k % 2 === 0) found.push(`${what}: ${JSON.stringify(text.slice(Math.max(0, m.index - 20), m.index + m[0].length + 20))}`);
    }
  }
  return found;
}

// The block structure a line reader sees: list and quote markers peeled off each line (nested ones too), headings, heading
// underlines, table delimiter rows, rules and fences; plus the number of "*" and "_" characters no backslash escapes.
function marks(text) {
  const out = [];
  let fence = false;
  for (let line of text.split(/\r\n|\r|\n/)) {
    if (/^ {0,3}(?:```|~~~)/.test(line)) { fence = !fence; out.push("fence"); continue; }
    if (fence) continue;
    for (let g = 0; g < 20; g++) {
      const m = /^ {0,3}(?:([-+*])|(\d{1,9})([.)]))(?=[ \t]|$)[ \t]?|^ {0,3}>[ \t]?/.exec(line);
      if (!m) break;
      out.push(m[1] ? "ul" : m[2] ? "ol" : "quote");
      line = line.slice(m[0].length);
    }
    if (/^ {0,3}#{1,6}(?:[ \t]|$)/.test(line)) out.push("h");
    else if (/^ {0,3}(?:=+|-+)[ \t]*$/.test(line)) out.push("setext");
    else if (/^ {0,3}\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/.test(line) && /[:|]/.test(line)) out.push("delim");
    else if (/^ {0,3}(?:(?:\*[ \t]*){3,}|(?:_[ \t]*){3,})$/.test(line)) out.push("hr");
  }
  // "*" no backslash escapes, and "_" no backslash escapes that is not between two letters or digits (there it is plain text)
  let em = 0;
  for (const m of text.matchAll(/(\\*)([*_]+)/g)) {
    const at = m.index + m[1].length, run = m[2], b = text[at - 1] || " ", a = text[at + run.length] || " ";
    if (run[0] === "_" && /[A-Za-z0-9]/.test(b) && /[A-Za-z0-9]/.test(a) && m[1].length % 2 === 0) continue;
    em += run.length - (m[1].length % 2);
  }
  out.push("em" + em);
  return out.join(",");
}

let id = 1;
const rawCall = async (method, params) => {
  const r = await mcp(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: id++, method, params }) }), {});
  return r.text();
};
const parse = (t) => { try { return JSON.parse(t); } catch { const m = t.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5)); return JSON.parse(m[m.length - 1]); } };
const call = async (method, params) => parse(await rawCall(method, params));
const tools = (await call("tools/list", {})).result.tools;
const sample = (p) => Array.isArray(p.enum) ? p.enum[0] : p.type === "number" || p.type === "integer" ? (typeof p.minimum === "number" && p.minimum > 100 ? p.minimum : 100) : p.type === "boolean" ? true : p.type === "array" ? [p.items && p.items.type === "object" ? {} : "B2B SaaS"] : p.type === "object" ? {} : "a regional logistics company";
const freeFields = (t) => Object.entries((t.inputSchema || {}).properties || {}).filter(([, p]) => (p.type === "string" && !Array.isArray(p.enum)) || (p.type === "array" && p.items && p.items.type === "string")).map(([k, p]) => [k, p.type]);
const argsWith = (t, k, type, v) => {
  const args = Object.fromEntries(Object.entries((t.inputSchema || {}).properties || {}).map(([key, p]) => [key, sample(p)]));
  args[k] = type === "array" ? [v] : v;
  return args;
};
const strings = (v) => typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => [k, ...strings(x)]) : [];
const textOf = (res) => strings(res.result ? res.result : res.error).join("\n");
// the answer a reader is shown: the tool's text (GTM Alpha: every string of its JSON answer, one paragraph each)
const shown = (res) => {
  const x = ((res.result && res.result.content) || []).map((c) => c.text).join("\n");
  if (G) { try { return strings(JSON.parse(x)).join("\n\n"); } catch { /* not JSON */ } }
  return x || textOf(res);
};

// value and twin (the same layout, every marker character made "x"): from the 40S auditors' findings and generators
const NL = S(10), CR = S(13);
const CASES = [
  ["alpha,-,+,#,##,1.,1),beta", "alpha,x,x,x,xx,xx,xx,beta"],                      // IMPACT F1: a marker before the split comma
  ["alpha;-;+;#;12.;beta", "alpha;x;x;x;xxx;beta"],
  ["Acme Example cut churn 20%" + NL + "-.", "Acme Example cut churn 20%" + NL + "x."],     // IMPACT F4: a marker kept by a cut "."
  ["Acme Example cut churn 20%" + NL + "##.", "Acme Example cut churn 20%" + NL + "xx."],
  ["Acme Example cut churn 20%" + NL + "1).", "Acme Example cut churn 20%" + NL + "xx."],
  ["Regional distributors (fleet" + NL + "-)", "Regional distributors (fleet" + NL + "x)"],  // IMPACT F6: a marker before ")" or "("
  ["Regional distributors (fleet" + NL + "#)", "Regional distributors (fleet" + NL + "x)"],
  ["Regional distributors" + NL + "-(fleet)", "Regional distributors" + NL + "x(fleet)"],
  ["on-time delivery" + NL + "2024 ", "on-time delivery" + NL + "xxxx "],                // IMPACT F5: digits, then white space
  ["fleet managers" + CR + NL + "12" + CR + NL, "fleet managers" + CR + NL + "xx" + CR + NL],
  ["Acme Example" + NL + "12", "Acme Example" + NL + "xx"],                             // IMPACT F3, ICP F1: the digit tail
  ["notes" + NL + "1", "notes" + NL + "x"],                                              // Revenue F4
  ["x" + NL + "123456789", "x" + NL + "xxxxxxxxx"],
  ["cut churn 20% at Acme Example" + NL + "--:", "cut churn 20% at Acme Example" + NL + "xxx"], // IMPACT F7: a delimiter row
  ["cut churn 20% at Acme Example" + NL + "-:", "cut churn 20% at Acme Example" + NL + "xx"],
  ["cut churn 20% at Acme Example" + NL + ":-", "cut churn 20% at Acme Example" + NL + "xx"],
  ["Routeco helps_ab_helps fleets", "Routeco helpsxabxhelps fleets"],                   // IMPACT F2 (b): a cut at a word
  ["Teams ship faster now!" + NL + "-! Onboarding is done.", "Teams ship faster now!" + NL + "xx Onboarding is done."],
  ["ab" + S(92), "abx"],                                                                  // ICP F2: a value ending in a backslash
];

test("a marker before any character a tool cuts at is escaped; no digit tail backslash (unit)", () => {
  assert.ok(mod && typeof mod.escapePiece === "function", "escapePiece is missing");
  const MARK = /^(?:[-+*]|#{1,6}|\d{1,9}[.)])(?:[ \t]|$)|^-+:?$|^:?-+$|^=+$/;
  const bad = [];
  for (const sep of [",", ".", ";", "!", "?", ":", "(", ")", "|", "/"]) for (const m of ["-", "+", "#", "##", "1.", "1)", "12.", "=", "--", "-:", "--:"]) {
    const o = mod.escapeText(`alpha${sep}${m}${sep}beta`);
    for (const piece of o.split(sep)) if (MARK.test(piece.trim())) bad.push(`${JSON.stringify(sep + m)}: ${JSON.stringify(piece)}`);
    for (const piece of o.split(sep).map((p) => mod.escapePiece(p.trim()))) if (MARK.test(piece)) bad.push(`piece ${JSON.stringify(sep + m)}: ${JSON.stringify(piece)}`);
  }
  assert.deepEqual(bad, []);
  // the tool's own markup after a value is never touched: no value ends in a backslash the caller did not type
  for (const v of ["Acme Example" + NL + "12", "notes" + NL + "1", "x" + CR + NL + "  42", "2024"]) assert.ok(!mod.escapeText(v).endsWith(S(92)), v);
  // a digits line the caller typed cannot take the tool's "." or ")" after any cut
  for (const v of ["on-time delivery" + NL + "2024 ", "fleet managers" + CR + NL + "12" + CR + NL, "a" + NL + "12.5", "a" + NL + "12, b", "notes" + NL + "1"]) {
    const e = mod.escapeText(v);
    for (const piece of [e, ...e.split(/[.,;]/)]) for (const tail of [". Unlike", ") x", "."]) {
      const o = mod.escapePiece(piece.trim()) + tail;
      // a line the caller started (a piece that starts a line only because a tool put it there is the tool's layout, as in production)
      assert.doesNotMatch(o, /[\n\r][ \t]*\d{1,9}[.)](?:\s|$)/, JSON.stringify(o));
    }
  }
  // a tool trims values: trailing white space counts as the end (an emoji name running to the end, GTM Alpha wiring helper's finding)
  for (const v of [":q  ", ":rocket\t", "see :tada" + NL]) assert.ok(mod.escapeText(v).trim().startsWith(S(92)) || mod.escapeText(v).includes(S(92) + ":"), JSON.stringify(mod.escapeText(v)));
  // ordinary text stays as typed
  for (const v of ["2024", "50000", "Founded in 2024", "Goals" + NL + "2024 revenue grew 20%", "100+ engineers", "C# and C++", "30-day pilot", "$75,000 a year", "(hypothetical) 3.5x"]) assert.equal(mod.escapeText(v), v);
});

test("escapePiece: a cut, a join or a case change never undoes an escape (unit)", () => {
  const VALUES = ["[q](https://evil.example/c?d=1)", "![i](https://evil.example/p.png)", "<img src=x>", "q@evil.example", "www.evil.example/c", "see https://evil.example/c now", "`qzcode`", "a" + NL + "@evil.example", "x" + NL + "-" + NL + "#" + NL + "1.", "Acme" + NL + "12", "r&#58;x"];
  const bad = [];
  for (const v of VALUES) {
    const e = mod.escapeText(v);
    assert.equal(mod.escapePiece(e), e, `not the same on an uncut value: ${JSON.stringify(v)}`);
    assert.equal(mod.escapePiece(mod.escapePiece(e)), mod.escapePiece(e));
    for (let k = 0; k <= e.length; k++) {
      for (const p of [e.slice(0, k), e.slice(k)]) {
        const q = mod.escapePiece(p);
        for (const f of liveIn(q)) bad.push(`cut ${k} of ${JSON.stringify(v)}: ${f}`);
        if (/\\$/.test(q) && !/\\\\$/.test(q)) bad.push(`lone backslash at the end: ${JSON.stringify(q)}`);
      }
    }
    for (const w of [e.toUpperCase(), e.toLowerCase()]) for (const f of liveIn(mod.escapePiece(w).replace(/EVIL\.EXAMPLE/g, "evil.example"))) bad.push(`case of ${JSON.stringify(v)}: ${f}`);
  }
  // joins: words joined with "-" or nothing, an address split from its neighbour
  for (const [a, b] of [["q", "@evil.example"], ["www", ".evil.example"], ["https", "://evil.example/c"], ["q ", " @evil.example"]]) {
    for (const sep of ["", "-", "_", "."]) {
      const j = mod.escapePiece(mod.escapeText(a).trim() + sep + mod.escapeText(b).trim());
      for (const f of liveIn(j)) bad.push(`join ${JSON.stringify(a + sep + b)}: ${f}`);
    }
  }
  // a cut at the letters "helps" (impact_full_audit) puts "www." right after the tool's own text
  const cut = mod.escapePiece(mod.escapeText("Routeco helpswww.evil.example/c teams").split("helps")[1]);
  assert.deepEqual(liveIn("> **That** " + cut), []);
  assert.deepEqual(bad.slice(0, 20), [], `${bad.length}`);
});

test("a table delimiter row the caller typed is never a delimiter row (unit)", () => {
  const ROW = /^ {0,3}\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;
  for (const r of ["--:", "-:", ":--", ":-:", "---:", "-- :", "| --- |", "---|---", ":---:|:---:", "- :"]) {
    for (const line of mod.escapeText("x" + NL + r).split(NL)) assert.ok(!ROW.test(line) || !/[:|]/.test(line), JSON.stringify(line));
  }
});

test("every tool keeps its own structure: a value adds no list, heading, table row or emphasis its twin does not (MCP)", async () => {
  const bad = [];
  for (const t of tools) for (const [k, type] of freeFields(t)) for (const [v, twin] of CASES) {
    const a = shown(await call("tools/call", { name: t.name, arguments: argsWith(t, k, type, v) }));
    const b = shown(await call("tools/call", { name: t.name, arguments: argsWith(t, k, type, twin) }));
    if (marks(a) !== marks(b)) bad.push(`${t.name}.${k} ${JSON.stringify(v)}: ${marks(a)} against ${marks(b)}`);
  }
  assert.deepEqual(bad.slice(0, 20), [], `${bad.length}`);
});

test("a cut at a word cannot make a live address (MCP, every tool)", async () => {
  const bad = [];
  for (const v of ["Routeco helpswww.evil.example/c teams", "Routeco helps" + "q@evil.example teams", "fleet,www.evil.example/c", "fleet (www.evil.example/c)"]) {
    for (const t of tools) for (const [k, type] of freeFields(t)) {
      for (const f of liveIn(shown(await call("tools/call", { name: t.name, arguments: argsWith(t, k, type, v) })))) bad.push(`${t.name}.${k}: ${f}`);
    }
  }
  assert.deepEqual(bad.slice(0, 20), [], `${bad.length}`);
});

const NAMES = ["![i](https://evil.example/p.png)", "<img src=x>", "see https://evil.example/c now", "`qzcode`", "a" + NL + "@evil.example", "[q](https://evil.example/c)"];
test("every refusal repeats a made up tool name, field or parameter escaped, in the decoded text and the raw body (MCP)", async () => {
  const bad = [];
  const check = (where, raw) => {
    for (const f of liveIn(raw)) bad.push(`${where} raw: ${f}`);
    let res; try { res = parse(raw); } catch { return; }
    for (const f of liveIn(textOf(res))) bad.push(`${where}: ${f}`);
  };
  for (const v of NAMES) {
    // 40S-1: a made up name with an argument over the length limit (the hosted pre-check), and with a wrong type
    check(`long ${JSON.stringify(v)}`, await rawCall("tools/call", { name: v, arguments: { x: "a".repeat(4100) } }));
    check(`long list ${JSON.stringify(v)}`, await rawCall("tools/call", { name: v, arguments: { x: ["a".repeat(4100)] } }));
    check(`field ${JSON.stringify(v)}`, await rawCall("tools/call", { name: tools[0].name, arguments: { [v]: "a".repeat(4100) } }));
    check(`nested ${JSON.stringify(v)}`, await rawCall("tools/call", { name: tools[0].name, arguments: { a: { [v]: "a".repeat(4100) } } }));
    check(`name ${JSON.stringify(v)}`, await rawCall("tools/call", { name: v, arguments: {} }));
    check(`method ${JSON.stringify(v)}`, await rawCall(v, {}));
    // what the protocol layer answers itself
    check(`initialize ${JSON.stringify(v)}`, await rawCall("initialize", { protocolVersion: v, capabilities: {}, clientInfo: { name: v, version: v } }));
    for (const [m, p] of [["resources/read", { uri: v }], ["prompts/get", { name: v }], ["tasks/get", { taskId: v }], ["logging/setLevel", { level: v }], ["completion/complete", { ref: { type: v, name: v }, argument: { name: v, value: v } }], ["tools/call", { name: tools[0].name, arguments: v }], ["tools/list", { cursor: v }]]) {
      check(`${m} ${JSON.stringify(v)}`, await rawCall(m, p));
    }
  }
  assert.deepEqual(bad.slice(0, 20), [], `${bad.length}`);
});

test("REST and JSON text: no caller text is live in the raw reply, refusals included", async () => {
  const bad = [];
  const VALS = ["a" + NL + "@evil.example", "a" + CR + "@evil.example", "a" + S(9) + "@evil.example", "a" + S(0xd800) + "@evil.example", "q@evil.example", "see https://evil.example/c", "ab" + S(92)];
  if (G) {
    for (const t of tools) for (const [k, type] of freeFields(t)) for (const v of VALS) {
      const raw = ((await call("tools/call", { name: t.name, arguments: argsWith(t, k, type, v) })).result.content || []).map((c) => c.text).join("\n");
      for (const f of liveIn(raw)) bad.push(`${t.name}.${k} JSON text: ${f}`);
    }
    for (const k of ["company", "industry", "current_gtm", "challenge", "company_stage"]) for (const v of VALS) {
      const body = { company: "Acme", industry: "logistics", company_stage: "growth", current_gtm: "partner-led", [k]: v };
      const r = await api(new Request("https://gtmalpha.gtmhelix.com/api/epic-audit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), {});
      for (const f of liveIn(await r.text())) bad.push(`epic-audit.${k} raw: ${f}`);
    }
  } else {
    for (const t of tools) for (const [k, type] of freeFields(t)) for (const v of VALS) {
      const r = await api(new Request(`https://x.gtmhelix.com/api/tools/${t.name}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input: { ...argsWith(t, k, type, v), [v]: "x" } }) }), { params: { tool: t.name } });
      for (const f of liveIn(await r.text())) bad.push(`${t.name}.${k} raw: ${f}`);
    }
    for (const v of NAMES) {
      const q = await api(new Request(`https://x.gtmhelix.com/api/tools/${encodeURIComponent(v)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input: {} }) }), { params: { tool: v } });
      for (const f of liveIn(await q.text())) bad.push(`rest name raw: ${f}`);
      // a part name of a form post ("parent.child") with a value over the limit
      const r = await api(new Request(`https://x.gtmhelix.com/api/tools/${tools[0].name}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input: { [`${v}.${v}`]: "a".repeat(4100) } }) }), { params: { tool: tools[0].name } });
      const raw = await r.text();
      for (const f of liveIn(raw)) bad.push(`rest part raw ${JSON.stringify(v)}: ${f}`);
      try { for (const f of liveIn(strings(JSON.parse(raw)).join("\n"))) bad.push(`rest part ${JSON.stringify(v)}: ${f}`); } catch { /* not JSON */ }
    }
  }
  assert.deepEqual(bad.slice(0, 20), [], `${bad.length}`);
});

test("jsonInert: pairs counted, the tool's own markup kept, '@' and ':' after a JSON escape written as \\u escapes (unit)", () => {
  for (const v of ["ab" + S(92), "ab" + S(92, 92, 92), "q@evil.example", "https://evil.example/c", "a" + NL + "@evil.example", "a" + S(0xd800) + "@evil.example", "a" + S(9) + "://evil.example"]) {
    const j = JSON.stringify({ a: "**" + mod.escapeText(v) + "** and **63**" });
    const k = mod.jsonInert(j);
    assert.equal(JSON.stringify(JSON.parse(k)), j);
    assert.deepEqual(liveIn(k), [], k);
    assert.ok(k.includes("** and **63**"), `the tool's own bold changed: ${k}`);
    assert.ok(!/\\u002a/.test(k), `the tool's own "*" was rewritten: ${k}`);
  }
  assert.equal(mod.jsonInert('{"a":"plain [x] <b> text\\nnext line"}'), '{"a":"plain [x] <b> text\\nnext line"}');
});
