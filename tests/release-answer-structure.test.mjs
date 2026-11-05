import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
const alpha = existsSync(new URL('../netlify/functions/mcp-sse.js', import.meta.url));
const {default: handler} = await import(alpha ? '../netlify/functions/mcp-sse.js' : '../netlify/functions/mcp.mjs');
const cases = JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json', import.meta.url)));
const frozen = JSON.parse(readFileSync(new URL('./fixtures/release-production-tools.json', import.meta.url))).tools_list;
const names = entries => entries.map(c => c.tool || c.name).sort();
test('structural fixtures cover the complete frozen and actual tools inventory exactly once', async () => {
  assert.equal(new Set(names(cases)).size, cases.length);
  assert.deepEqual(names(cases), names(frozen.tools));
  const response = await handler(new Request('https://local.invalid/mcp', {method:'POST', headers:{'content-type':'application/json', accept:'application/json, text/event-stream'}, body:JSON.stringify({jsonrpc:'2.0', id:1, method:'tools/list', params:{}})}));
  const message = await response.json();
  assert.ok(!message.error);
  assert.deepEqual(names(cases), names(message.result.tools));
});
for (const c of cases) test(`answer structure and promised role actions: ${c.tool}`, async () => {
  const response = await handler(new Request('https://local.invalid/mcp', {method:'POST', headers:{'content-type':'application/json', accept:'application/json, text/event-stream'}, body:JSON.stringify({jsonrpc:'2.0', id:1, method:'tools/call', params:{name:c.tool, arguments:c.args}})}));
  const message = await response.json();
  assert.ok(!message.error && message.result && !message.result.isError, 'fixture must produce a successful tool answer');
  const text = message.result.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
  const reading = text.match(/^## Reading the answer\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1];
  assert.ok(reading && reading.trim().length > 80, 'substantive reading section is required');
  assert.match(reading, /The conclusion needs review if|Review the conclusion if|Change scope if|Evidence that could change this conclusion:/);
  // All 48 reviewed tools promise these five roles in their reader contract.
  for (const role of ['Founder', 'CEO', 'CMO', 'CRO', 'Demand generation head']) {
    const action = text.match(new RegExp(`^${role}:\\s*(.+)$`, 'm'))?.[1];
    assert.ok(action && action.trim().split(/\s+/).length >= 6, `${role} must have a substantive action`);
  }
});
