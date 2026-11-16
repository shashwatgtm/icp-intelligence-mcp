import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../netlify/functions/mcp.mjs';

async function sizeMarket(args) {
  const response = await handler(new Request('https://local.invalid/mcp', {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json, text/event-stream'},
    body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: {name: 'tam_sam_som_calculator', arguments: args}})
  }));
  return (await response.json()).result;
}
function segment(name, count, acv, icp, share) {
  return {segment_name: name, total_potential_companies: count, average_contract_value: acv,
    icp_percentage: icp, year1_market_share_target: share};
}
test('a combined top level count never becomes the first segment TAM', async () => {
  const first = segment('Regional operators', 100, 10000, 40, 10);
  const second = segment('National operators', 50, 10000, 40, 10);
  const result = await sizeMarket({...first, total_potential_companies: 150, segments: [first, second],
    product_category: 'Test fixture for B2B subscription software', data_sources: 'Synthetic regression fixture. All ACVs in USD.'});
  assert.ok(!result.isError);
  const text = result.content[0].text;
  assert.match(text, /Regional operators[^\n]*\$1,000,000\.00/);
  assert.match(text, /National operators[^\n]*\$500,000\.00/);
  assert.match(text, /Total[^\n]*\$1,500,000\.00[^\n]*\$600,000\.00[^\n]*\$60,000\.00/);
});
