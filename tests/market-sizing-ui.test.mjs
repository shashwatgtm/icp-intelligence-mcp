import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateMarket, structuredMarket } from '../src/market-sizing.ts';
import { marketSizingHtml } from '../src/market-sizing-ui.ts';
import handler from '../netlify/functions/mcp.mjs';
import { createServer } from '../src/index.ts';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { escapeText } from '../src/escape-inputs.ts';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
const baseline = JSON.parse(readFileSync(new URL('./fixtures/market-sizing-ui-baseline.json', import.meta.url)));
// Coordinator supplied synthetic review fixture. Company is a review fixture input only.
export const fixture = { total_potential_companies: 10000, average_contract_value: 5000, icp_percentage: 40, year1_market_share_target: 2, data_sources: 'Synthetic test inputs only, not company or market findings', segment_name: 'B2B software test segment', product_category: 'CRM software', company: 'HubSpot' };
export async function rpc(method, params) { const r = await handler(new Request('http://localhost/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) })); return r.json(); }
test('tools/list differs only by the intended resource metadata', async () => { const current = await rpc('tools/list'); const intended = current.result.tools.find(t => t.name === 'tam_sam_som_calculator'); assert.deepEqual(intended._meta, { ui: { resourceUri: 'ui://helix/market-sizing/v1.html' } }); delete intended._meta; assert.deepEqual(current, baseline.list); });
test('existing caller receives identical text and schema with additive structured output', async () => { const r = await rpc('tools/call', { name: 'tam_sam_som_calculator', arguments: fixture }); assert.deepEqual(r.result.content, baseline.call.result.content); assert.equal(r.result.structuredContent.tam, 50000000); assert.equal(r.result.structuredContent.sam, 20000000); assert.equal(r.result.structuredContent.som, 400000); });
test('resources/read serves exact standalone component with empty network CSP', async () => { const r = await rpc('resources/read', { uri: 'ui://helix/market-sizing/v1.html' }); assert.ok(!r.error, JSON.stringify(r.error)); const c = r.result.contents[0]; assert.equal(c.mimeType, 'text/html;profile=mcp-app'); assert.equal(c.uri, 'ui://helix/market-sizing/v1.html'); assert.equal(c.text, marketSizingHtml); assert.ok(c.text.includes(calculateMarket.toString()), 'bundled calculation must match the source'); assert.equal(c.text, readFileSync('public/lab/market-sizing/index.html', 'utf8')); assert.deepEqual(c._meta.ui.csp, { connectDomains: [], resourceDomains: [], frameDomains: [] }); assert.doesNotMatch(c.text, /FONT_DATA|\/\*CALCULATE\*\//); });
test('independent numerical expectations, changed values, scenarios and zero', () => { const a = calculateMarket(fixture); assert.deepEqual([a.tam, a.sam, a.som], [50000000, 20000000, 400000]); assert.deepEqual(a.scenarios.map(s => s.som), [200000, 400000, 600000]); const b = calculateMarket({ ...fixture, total_potential_companies: 20000, icp_percentage: 25, year1_market_share_target: 4 }); assert.deepEqual([b.tam, b.sam, b.som], [100000000, 25000000, 1000000]); for (const key of ['total_potential_companies', 'icp_percentage', 'year1_market_share_target'])
    assert.equal(calculateMarket({ ...fixture, [key]: 0 }).som, 0); assert.equal(calculateMarket({ total_potential_companies: 1, average_contract_value: 1 }).som, 0.009); assert.equal(calculateMarket({ ...fixture, year1_market_share_target: 100 }).scenarios[2].share, 100); });
test('invalid, missing and zero ACV refuse honestly', async () => { for (const args of [{}, { ...fixture, average_contract_value: 0 }, { ...fixture, icp_percentage: 101 }, { ...fixture, total_potential_companies: -1 }, { ...fixture, average_contract_value: Infinity }])
    assert.throws(() => calculateMarket(args)); for (const args of [{}, { ...fixture, average_contract_value: 0 }, { ...fixture, icp_percentage: 101 }]) {
    const r = await rpc('tools/call', { name: 'tam_sam_som_calculator', arguments: args });
    assert.equal(r.result.isError, true);
    assert.equal(r.result.structuredContent, undefined);
} });

async function coreCall(args) {
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    const response = await transport.handleRequest(new Request('http://localhost/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'tam_sam_som_calculator', arguments: args } }) }));
    return (await response.json()).result;
  } finally { await server.close(); }
}
const differential = JSON.parse(readFileSync(new URL('./fixtures/market-sizing-differential-base.json', import.meta.url)));
const diffReceipts = [];
for (const item of differential.cases) {
  test('base differential: ' + item.name, async () => {
    const candidate = await coreCall(item.args);
    const hosted = (await rpc('tools/call', { name: 'tam_sam_som_calculator', arguments: item.args })).result;
    assert.deepEqual(hosted.content, item.content, 'Hosted text must match the base too');
    assert.equal(!!hosted.isError, item.isError);
    assert.equal(!!candidate.isError, item.isError);
    assert.deepEqual(candidate.content, item.content, 'Legacy content must be byte identical');
    const digest = content => createHash('sha256').update(JSON.stringify(content)).digest('hex');
    diffReceipts.push({ case: item.name, baseTextSha256: digest(item.content), candidateTextSha256: digest(candidate.content), hostedTextSha256: digest(hosted.content), identical: true, baseIsError: item.isError, candidateIsError: !!candidate.isError, rangeSupported: candidate.structuredContent.rangeSupported });
    mkdirSync('work/market-sizing/revision', { recursive: true });
    writeFileSync('work/market-sizing/revision/differential.json', JSON.stringify({ base: differential.base, sourceBlob: differential.sourceBlob, cases: diffReceipts }, null, 2));
  });
}
test('overflow is additive unsupported range, not a new tool rejection', async () => {
  for (const rates of [{}, { icp_percentage: 0 }, { year1_market_share_target: 0 }]) {
    const args = { ...fixture, total_potential_companies: 1e308, ...rates };
    assert.equal(calculateMarket(args).rangeSupported, false);
    const result = await rpc('tools/call', { name: 'tam_sam_som_calculator', arguments: args });
    assert.equal(!!result.result.isError, false);
    assert.equal(result.result.structuredContent.rangeSupported, false);
    assert.equal(result.result.structuredContent.tam, null);
    assert.equal(result.result.structuredContent.sam, null);
    assert.equal(result.result.structuredContent.som, null);
    assert.match(result.result.structuredContent.rangeMessage, /supported numeric range/);
    assert.equal(structuredMarket(args).tam, null);
  }
});
test('literal metadata survives three round trips without exposing unsafe strings', async () => {
  const samples = [
    "R&D &amp; &#58;", "Owner's team's review", '<b>literal</b> <img src=x onerror=alert(1)>',
    '**bold** _it_ [link](https://evil.example/) `code` ! | ~ $x$ # title',
    'https://evil.example/a?q=1&b=2 www.evil.example q@evil.example',
    'Café 東京 🧪 Ελληνικά', String.raw`C:\synthetic\[draft]`,
  ];
  for (const literal of samples) {
    let args = { ...fixture, data_sources: literal, segment_name: literal, product_category: literal, company: literal };
    let firstContent;
    for (let round = 0; round < 3; round++) {
      const result = (await rpc('tools/call', { name: 'tam_sam_som_calculator', arguments: args })).result;
      if (round === 0) firstContent = result.content;
      else assert.deepEqual(result.content, firstContent);
      const meta = result._meta.helixMarketSizing.textCodePoints;
      for (const key of ['segment_name', 'data_sources', 'product_category', 'company']) {
        assert.ok(meta[key].every(n => typeof n === 'number'));
        const decoded = meta[key].map(n => String.fromCodePoint(n)).join('');
        assert.equal(decoded, literal);
        args[key] = decoded;
      }
      assert.equal(result.structuredContent.inputs.data_sources, escapeText(literal));
    }
  }
});
