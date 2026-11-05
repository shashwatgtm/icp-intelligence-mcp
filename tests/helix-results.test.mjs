// Helix results view: additive metadata only. The tool contract and the answer text stay as they were.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { BUILD_PROFILE } from '../dist/build-profile.js';
import { WIDGET_ORIGIN } from '../dist/widget-origin.js';

const TOOL = 'account_prioritization';
const URI = 'ui://helix/results/v1.html';
const ARGS = {"product_category":"a spend management platform for mid market finance teams","company":"Sample seller 2","accounts":[{"name":"Account Alpha","fit_score":84,"intent_signals":71,"relationship":60,"timing":"now"},{"name":"Account Beta","fit_score":56,"intent_signals":40,"relationship":75,"timing":"soon"},{"name":"Account Gamma","fit_score":32,"intent_signals":25,"relationship":20,"timing":"later"}],"prioritization_weights":{"fit":35,"intent":35,"relationship":15,"timing":15}};
const BAD = {"accounts":[{"name":"Account Alpha","fit_score":150}]};
const fixture = JSON.parse(readFileSync(new URL('./fixtures/release-production-tools.json', import.meta.url), 'utf8'));
const { default: handler } = await import(new URL('../netlify/functions/mcp.mjs', import.meta.url));
let id = 0;
async function rpc(method, params = {}) {
  const response = await handler(new Request('https://local.invalid/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }) }));
  const message = await response.json();
  assert.ok(!message.error, JSON.stringify(message.error));
  return message.result;
}
const text = (result) => result.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');

test('tool names, descriptions and input schemas equal the pinned production contract; only the widget tool gains _meta', async () => {
  const { tools } = await rpc('tools/list');
  assert.deepEqual(tools.map((t) => [t.name, t.description, t.inputSchema]), fixture.tools_list.tools.map((t) => [t.name, t.description, t.inputSchema]));
  for (const tool of tools) {
    if (tool.name === TOOL) assert.deepEqual(tool._meta, { ...(fixture.tools_list.tools.find((t) => t.name === TOOL)._meta ?? {}), ui: { resourceUri: URI }, 'openai/outputTemplate': URI });
    else assert.notEqual(tool._meta?.ui?.resourceUri, URI);
  }
});

test('the view resource is listed once with Helix host metadata and a strict CSP whose hashes match the inline code', async () => {
  const { resources } = await rpc('resources/list');
  const listed = resources.filter((r) => r.uri === URI);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].name, 'helix-results');
  const domain = BUILD_PROFILE.domainEnabled && WIDGET_ORIGIN ? WIDGET_ORIGIN : undefined;
  const meta = {
    ui: { prefersBorder: true, ...(domain ? { domain } : {}), csp: { connectDomains: [], resourceDomains: [], frameDomains: [] } },
    'openai/widgetDescription': 'Helix results view: the complete server answer in sections, with a copy control. It calculates nothing.',
    'openai/widgetPrefersBorder': true,
    ...(domain ? { 'openai/widgetDomain': domain } : {}),
    'openai/widgetCSP': { connect_domains: [], resource_domains: [], frame_domains: [] },
    'openai/ui': { availableDisplayModes: ['inline', 'fullscreen'] },
  };
  assert.deepEqual(listed[0]._meta, meta);
  const { contents } = await rpc('resources/read', { uri: URI });
  assert.equal(contents.length, 1);
  assert.equal(contents[0].mimeType, 'text/html;profile=mcp-app');
  assert.deepEqual(contents[0]._meta, meta);
  const html = contents[0].text;
  assert.equal(createHash('sha256').update(html, 'utf8').digest('hex'), '60e3a86d566ce46a452da77112663ce74781a99f7b6f7c7982a1bed98e4e4e62');
  assert.doesNotMatch(html, /lane.?f|draft/i);
  const hash = (s) => createHash('sha256').update(s, 'utf8').digest('base64');
  const script = /<script>([\s\S]*)<\/script>/.exec(html)[1], style = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
  assert.match(html, new RegExp(`default-src 'none'; script-src 'sha256-${hash(script).replace(/[+/]/g, '\\$&')}'; style-src 'sha256-${hash(style).replace(/[+/]/g, '\\$&')}'`));
});

test('a successful answer keeps its text and gains a deterministic view that carries the text once', async () => {
  const first = await rpc('tools/call', { name: TOOL, arguments: ARGS });
  const second = await rpc('tools/call', { name: TOOL, arguments: ARGS });
  assert.ok(!first.isError);
  assert.deepEqual(Object.keys(first._meta), ['helixResults']);
  assert.equal(first._meta.helixResults.text, text(first));
  assert.equal(first._meta.helixResults.tool, TOOL);
  assert.equal(first._meta.helixResults.sections, undefined);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test('an input error answer carries no view', async () => {
  const result = await rpc('tools/call', { name: TOOL, arguments: BAD });
  assert.equal(result.isError, true);
  assert.equal(result._meta?.helixResults, undefined);
});
