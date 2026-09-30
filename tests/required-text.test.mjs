// Run 16 R16-10 (rule B52; N1 in independent-audit/run16/run15-review.md): a required text field (a string without a fixed
// list of choices) that is missing, null, empty or only whitespace counts as missing and gets the existing refusal
// "Missing required input for <tool>: <field>. ...". A field with real text is never refused as missing. Every tool in
// tools/list is covered, so a tool added later is covered too. Tested in-process (no network, no deploy). Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const rpc = async (method, params) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  }), {});
  return (await r.json()).result;
};
const { tools } = await rpc("tools/list", {});
const isText = (p) => p && p.type === "string" && !Array.isArray(p.enum);
// A present value for the other required fields, so the refusal names only the blank field.
const present = (p) => (Array.isArray(p.enum) ? p.enum[0] : p.type === "string" ? "Example text" : p.type === "number" || p.type === "integer"
  ? Math.max(typeof p.minimum === "number" ? p.minimum : 1, 1) + 1 : p.type === "boolean" ? true : p.type === "array" ? [] : {});
const withText = tools.filter((t) => (t.inputSchema.required || []).some((k) => isText(t.inputSchema.properties[k])));

test("the tools with a required text field are all counted (3)", () => {
  assert.equal(withText.length, 3, withText.map((t) => t.name).join(", "));
});

for (const t of withText) {
  const props = t.inputSchema.properties;
  const req = t.inputSchema.required || [];
  for (const field of req.filter((k) => isText(props[k]))) {
    const base = Object.fromEntries(req.filter((k) => k !== field).map((k) => [k, present(props[k])]));
    for (const [label, blank] of [["empty", ""], ["spaces", "   "], ["tab and new line", " \t\n "]]) {
      test(`${t.name}: ${field} sent ${label} gets the missing-input refusal`, async () => {
        const r = await rpc("tools/call", { name: t.name, arguments: { ...base, [field]: blank } });
        const text = r.content.map((c) => c.text).join("\n");
        assert.equal(r.isError, true, text.slice(0, 200));
        assert.ok(text.startsWith(`Missing required input for ${t.name}: ${field}. `), text.slice(0, 200));
      });
    }
    test(`${t.name}: ${field} with real text inside spaces is not refused as missing`, async () => {
      const r = await rpc("tools/call", { name: t.name, arguments: { ...base, [field]: "  Example text  " } });
      const text = r.content.map((c) => c.text).join("\n");
      assert.ok(!text.startsWith("Missing required input"), text.slice(0, 200));
    });
  }
}

// The browser form (netlify/functions/api.mjs, built from work/hosted/api.mjs.template) sends a blank box as missing too:
// a readable refusal page, not a crash and not a scored answer.
const { default: api } = await import(new URL("../netlify/functions/api.mjs", import.meta.url));
test("the browser form refuses a blank required box with a readable page", async () => {
  const t = withText[0];
  const props = t.inputSchema.properties;
  const req = t.inputSchema.required || [];
  const field = req.find((k) => isText(props[k]));
  const fields = Object.fromEntries(req.map((k) => [k, k === field ? "   " : String(Array.isArray(present(props[k])) ? "Example text" : present(props[k]))]));
  const r = await api(new Request(`https://x.gtmhelix.com/api/tools/${t.name}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fields).toString() }), { params: { tool: t.name } });
  const html = await r.text();
  assert.equal(r.status, 400);
  assert.match(html, /<h1>Could not run the tool<\/h1>/);
  assert.ok(html.includes(`<li>${field} is required.</li>`), html.slice(0, 400));
  assert.ok(!html.includes("hx-result-text"));
});
