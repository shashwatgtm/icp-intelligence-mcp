// REST endpoint for the web app: POST /api/tools/<tool name>.
// It runs the tool through the SAME createServer() that the MCP endpoint (mcp.mjs) and the npm package use,
// by connecting an in-memory MCP client to it and calling tools/call. No tool logic is copied here, so a web
// form and an AI assistant get the same answer for the same input.
// Protection: rate limit (config below), a body size cap, input validation against the tool's own input schema,
// and a honeypot field. Nothing is stored and nothing about the input is logged.

import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createServer } from "../../src/index.ts";

const MAX_BODY_BYTES = 32000;
const MAX_TEXT = 6000;
const MAX_ITEMS = 50;
const HONEYPOT = "leave_this_empty";
// Run 15 D39: the "one per line" boxes of this site's forms, written by the build from the pages' own data-rows attributes
// (the spec the browser script uses). Empty on sites without such boxes.
const ROWS = {"accounts": {"cols": [["name", "s", "name"], ["fit_score", "n", "fit"], ["intent_signals", "n", "intent"], ["relationship", "n", "relationship"], ["timing", "s", "timing"]], "max": 5, "min": 5, "need": "5 values: name, fit, intent, relationship, timing", "sep": ","}, "customers": {"cols": [["name", "s", "name"], ["industry", "s", "industry"], ["size", "s", "size"], ["acv", "n", "ACV"], ["champion_title", "s", "champion title"], ["sales_cycle_days", "n", "sales cycle days"], ["buying_trigger", "s", "buying trigger"]], "min": 5, "need": "at least 5 values: name, industry, size, ACV, champion title", "rest": "tech_stack", "sep": ","}, "interview_notes": {"cols": [["customer", "s", "customer"], ["role", "s", "role"], ["pain_points", "l", "pain points"], ["buying_triggers", "l", "buying triggers"], ["value_realized", "l", "value realized"], ["key_quotes", "l", "key quotes"]], "item": ";", "max": 6, "min": 6, "need": "6 parts separated by |: customer, role, pain points, buying triggers, value realized, key quotes", "sep": "|"}, "scoring_criteria": {"cols": [["criterion", "s", "criterion"], ["importance", "e", "importance", ["critical", "important", "nice_to_have"]]], "min": 3, "need": "at least 3 values: criterion, importance, then one or more values", "rest": "values", "sep": ","}};

// Run 15 D39: with JavaScript off a rows box arrives as plain text. Turn it into the list exactly as the browser's rows()
// does (work/hosted/app-icp.js), with the same messages, so the answer is the same with JavaScript on or off.
function listWords(list) {
  return list.length < 2 ? list.join("") : list.slice(0, -1).join(", ") + " or " + list[list.length - 1];
}
function rowsFromText(v, spec, problems) {
  const out = [];
  v.split(/\r?\n/).forEach((line, idx) => {
    if (!line.trim()) return;
    const n = idx + 1;
    let bad = false;
    const obj = {};
    const parts = line.split(spec.sep).map((s) => s.trim());
    if (parts.length < spec.min || (spec.max && parts.length > spec.max)) { problems.push("Line " + n + " needs " + spec.need + "."); return; }
    spec.cols.forEach((c, j) => {
      const val = parts[j];
      if (val === undefined || val === "") return;
      if (c[1] === "n") {
        const num = Number(val);
        if (!isFinite(num)) { problems.push("Line " + n + ": " + c[2] + " must be a number."); bad = true; } else obj[c[0]] = num;
      } else if (c[1] === "l") {
        const items = val.split(spec.item).map((s) => s.trim()).filter(Boolean);
        if (items.length) obj[c[0]] = items;
      } else if (c[1] === "e") {
        const pick = val.toLowerCase().replace(/\s+/g, "_");
        if (c[3].indexOf(pick) < 0) { problems.push("Line " + n + ": " + c[2] + " must be " + listWords(c[3]) + "."); bad = true; } else obj[c[0]] = pick;
      } else {
        obj[c[0]] = val;
      }
    });
    if (spec.rest) {
      const rest = parts.slice(spec.cols.length).filter(Boolean);
      if (rest.length) obj[spec.rest] = rest;
    }
    if (!bad) out.push(obj);
  });
  return out;
}

async function connectClient() {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer().connect(serverSide);
  const client = new Client({ name: "web-app", version: "1.0.0" });
  await client.connect(clientSide);
  return client;
}

// Turn one raw value into the type its schema asks for. Form posts send text; JSON posts can send real types.
function coerce(prop, raw, key, errors) {
  const type = prop.type;
  if (type === "string") {
    if (typeof raw !== "string") { errors.push(`${key} must be text.`); return undefined; }
    const v = raw.trim();
    if (v.length > MAX_TEXT) { errors.push(`${key} is longer than ${MAX_TEXT} characters.`); return undefined; }
    if (prop.enum && v !== "" && !prop.enum.includes(v)) { errors.push(`${key} must be one of: ${prop.enum.join(", ")}.`); return undefined; }
    return v === "" ? undefined : v;
  }
  if (type === "number" || type === "integer") {
    if (typeof raw === "string" && raw.trim() === "") return undefined;
    const n = typeof raw === "number" ? raw : Number(String(raw).replace(/,/g, "").trim());
    if (!Number.isFinite(n)) { errors.push(`${key} must be a number.`); return undefined; }
    if (typeof prop.minimum === "number" && n < prop.minimum) { errors.push(`${key} must be ${prop.minimum} or more.`); return undefined; }
    return n;
  }
  if (type === "boolean") {
    if (typeof raw === "boolean") return raw;
    const v = String(raw).trim().toLowerCase();
    if (v === "") return undefined;
    if (["true", "on", "yes", "1"].includes(v)) return true;
    if (["false", "off", "no", "0"].includes(v)) return false;
    errors.push(`${key} must be yes or no.`);
    return undefined;
  }
  if (type === "array") {
    let list = raw;
    if (typeof raw === "string") {
      const t = raw.trim();
      if (t === "") return undefined;
      if (t.startsWith("[")) {
        try { list = JSON.parse(t); } catch { errors.push(`${key} is not valid JSON.`); return undefined; }
      } else if (prop.items && prop.items.type === "string") {
        list = t.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      } else {
        errors.push(`${key} must be a JSON list.`); return undefined;
      }
    }
    if (!Array.isArray(list)) { errors.push(`${key} must be a list.`); return undefined; }
    if (list.length > MAX_ITEMS) { errors.push(`${key} has more than ${MAX_ITEMS} items.`); return undefined; }
    const itemType = prop.items && prop.items.type;
    for (const item of list) {
      if (itemType === "string" && (typeof item !== "string" || item.length > MAX_TEXT)) { errors.push(`${key} must be a list of short texts.`); return undefined; }
      if (itemType === "object" && (item === null || typeof item !== "object" || Array.isArray(item))) { errors.push(`${key} must be a list of objects.`); return undefined; }
    }
    return list;
  }
  if (type === "object") {
    let obj = raw;
    if (typeof raw === "string") {
      const t = raw.trim();
      if (t === "") return undefined;
      try { obj = JSON.parse(t); } catch { errors.push(`${key} is not valid JSON.`); return undefined; }
    }
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) { errors.push(`${key} must be an object.`); return undefined; }
    return obj;
  }
  return raw;
}

function validate(tool, input) {
  const props = (tool.inputSchema && tool.inputSchema.properties) || {};
  const required = (tool.inputSchema && tool.inputSchema.required) || [];
  const errors = [];
  const args = {};
  // Fields the tool does not declare are ignored, exactly as the MCP server ignores them, and reported back.
  const ignored = Object.keys(input).filter((key) => !(key in props));
  for (const [key, prop] of Object.entries(props)) {
    if (input[key] === undefined || input[key] === null) continue;
    const v = coerce(prop, input[key], key, errors);
    if (v !== undefined) args[key] = v;
  }
  for (const key of required) {
    // A value that was refused above already has its own message; do not add "is required" as well.
    if (args[key] === undefined && !errors.some((m) => m.startsWith(`${key} `))) errors.push(`${key} is required.`);
  }
  if (JSON.stringify(args).length > MAX_BODY_BYTES) errors.push("The input is too long.");
  return { args, errors, ignored };
}

// Run 10 R10-10: the security headers of the static pages (_headers does not reach function answers). The HTML answer
// page loads only this site's two stylesheets, so its policy allows nothing else. The build adds ?v=<hash> to the links.
const SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000",
};
const PAGE_CSP = "default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";
const JSON_CSP = "default-src 'none'; frame-ancestors 'none'";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function htmlPage(title, bodyHtml, status) {
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<meta name="robots" content="noindex"><title>${esc(title)}</title><link rel="stylesheet" href="/assets/fonts.css?v=a7f7495a4f"><link rel="stylesheet" href="/assets/helix.css?v=bb6dd8a7a6"><link rel="stylesheet" href="/assets/helix-report.css?v=f78ed582b4"></head>` +
    `<body><main class="hx-body hx-result-page" id="main">${bodyHtml}</main></body></html>`;
  return new Response(page, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...SECURITY, "Content-Security-Policy": PAGE_CSP } });
}

export default async (req, context) => {
  const toolName = context.params && context.params.tool;
  const wantsHtml = (req.headers.get("content-type") || "").includes("application/x-www-form-urlencoded");
  const reply = (status, payload) => {
    if (wantsHtml) {
      const back = `<p><a href="/tools/${esc(String(toolName || "").replace(/_/g, "-"))}/">Back to the tool</a></p>`;
      let body;
      if (payload.ok) {
        // R13-11: the report frame, contract.md; JS-off page is its own h1 (the report is the page)
        const pageAddr = new URL(req.url).origin + `/tools/${esc(String(toolName || "").replace(/_/g, "-"))}/`;
        const dateStr = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
        body = `<article class="hxr hxr-run" aria-labelledby="result-t"><header class="hxr-head">` +
          `<p class="hxr-tag">ICP Intelligence report</p>` +
          `<h1 class="hxr-title" id="result-t">${esc(payload.title)}: your result</h1>` +
          `<p class="hxr-meta"><span>${esc(dateStr)}</span><span>Made with ${esc(payload.title)} by Helix GTM Consulting</span><span>Based on what you entered</span><span>${esc(pageAddr)}</span></p></header>` +
          `<div class="hxr-body"><pre class="hx-result-text">${esc(payload.text)}</pre></div>` +
          `<footer class="hxr-foot"><span>Built by Shashwat Ghosh</span><span>${esc(pageAddr)}</span><span>${esc(dateStr)}</span></footer></article>${back}`;
      } else {
        body = `<h1>Could not run the tool</h1><ul>${(payload.errors || [payload.error]).map((e) => `<li>${esc(e)}</li>`).join("")}</ul>${back}`;
      }
      return htmlPage(payload.ok ? payload.title : "Could not run the tool", body, status);
    }
    return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...SECURITY, "Content-Security-Policy": JSON_CSP } });
  };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Use POST with a JSON body: {\"input\": {...}}. See /docs/." }),
      { status: 405, headers: { "Content-Type": "application/json", Allow: "POST", ...SECURITY, "Content-Security-Policy": JSON_CSP } });
  }
  const raw = await req.text();
  // R12-11 d (SH-M14): the limit is in bytes, so count the UTF-8 bytes, not the characters
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return reply(413, { ok: false, error: "The request is too large." });

  let input = {};
  let honeypot = "";
  try {
    if (wantsHtml) {
      const form = new URLSearchParams(raw);
      for (const [k, v] of form.entries()) {
        if (k === HONEYPOT) { honeypot = v; continue; }
        input[k] = v;
      }
    } else {
      const body = JSON.parse(raw || "{}");
      honeypot = body[HONEYPOT] || "";
      input = body.input && typeof body.input === "object" && !Array.isArray(body.input) ? body.input : null;
      if (!input) return reply(400, { ok: false, error: "Send a JSON body with an \"input\" object." });
    }
  } catch {
    return reply(400, { ok: false, error: "The request body could not be read." });
  }
  if (honeypot) return reply(400, { ok: false, error: "The request could not be processed." });

  // Run 15 D39: a form post (JavaScript off) is read the way the browser script reads the same form: a rows box that is not
  // JSON becomes its list, and a box named "parent.part" fills one part of the object "parent" (empty boxes are left out).
  const parts = {};
  if (wantsHtml) {
    const problems = [];
    for (const [k, v] of Object.entries(input)) {
      if (ROWS[k] && typeof v === "string" && v.trim() !== "" && !v.trim().startsWith("[")) {
        const list = rowsFromText(v, ROWS[k], problems);
        if (list.length) input[k] = list; else delete input[k];
      }
    }
    for (const k of Object.keys(input)) {
      const dot = k.indexOf(".");
      if (dot < 1) continue;
      const v = input[k];
      delete input[k];
      if (typeof v === "string" && v.trim() === "") continue;
      (parts[k.slice(0, dot)] ||= {})[k.slice(dot + 1)] = v;
    }
    if (problems.length) return reply(400, { ok: false, errors: problems });
  }

  let client;
  try {
    client = await connectClient();
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === toolName);
    if (!tool) return reply(404, { ok: false, error: `Unknown tool: ${toolName}.` });
    // Run 15 D39: each part of an object from a form post gets the type its schema asks for (a number box gives a number).
    const partErrors = [];
    const props = (tool.inputSchema && tool.inputSchema.properties) || {};
    for (const [parent, sub] of Object.entries(parts)) {
      const subProps = (props[parent] && props[parent].properties) || {};
      const obj = {};
      for (const [sk, sv] of Object.entries(sub)) {
        const c = coerce(subProps[sk] || { type: "string" }, sv, `${parent}.${sk}`, partErrors);
        if (c !== undefined) obj[sk] = c;
      }
      if (Object.keys(obj).length) input[parent] = obj;
    }
    if (partErrors.length) return reply(400, { ok: false, errors: partErrors });
    const { args, errors, ignored } = validate(tool, input);
    if (errors.length) return reply(400, { ok: false, errors });
    const result = await client.callTool({ name: tool.name, arguments: args });
    const text = (result.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n\n");
    return reply(result.isError ? 422 : 200, { ok: !result.isError, tool: tool.name, title: tool.title || tool.name, text, error: result.isError ? text : undefined, ignored_fields: ignored.length ? ignored : undefined });
  } catch {
    return reply(500, { ok: false, error: "The tool could not run. Please try again." });
  } finally {
    if (client) await client.close().catch(() => {});
  }
};

export const config = {
  path: "/api/tools/:tool",
  rateLimit: {
    windowSize: 60,
    windowLimit: 30,
    aggregateBy: ["ip", "domain"],
  },
};
