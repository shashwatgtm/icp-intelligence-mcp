// Capture text from the immutable base executor. No network or deployment calls.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
const base = '80296186cd67fa6fdc610151eedcdd43f8fc329f';
const dir = 'work/market-sizing/revision';
mkdirSync(dir, { recursive: true });
const source = readFileSync(dir + '/base-source.ts', 'utf8');
const sourceBlob = createHash('sha1').update('blob ' + Buffer.byteLength(source) + '\0').update(source).digest('hex');
// Imported helpers are unchanged from this base. Only resolve their original paths.
writeFileSync(dir + '/base-index.ts', source.replaceAll("from './", "from '../../../src/"));
const { createServer } = await import(pathToFileURL(resolve(dir + '/base-index.ts')).href);
const ordinary = { total_potential_companies: 10000, average_contract_value: 5000, icp_percentage: 40, year1_market_share_target: 2, data_sources: 'Synthetic test inputs only, not company or market findings', segment_name: 'B2B software test segment', product_category: 'CRM software', company: 'HubSpot' };
const cases = [
  ['coordinator synthetic review fixture', ordinary],
  ['ordinary different values', { ...ordinary, total_potential_companies: 217, average_contract_value: 2400, icp_percentage: 37.5, year1_market_share_target: 0.03 }],
  ['omitted optional rates', { total_potential_companies: 100, average_contract_value: 5000 }],
  ['null optional rates', { total_potential_companies: 100, average_contract_value: 5000, icp_percentage: null, year1_market_share_target: null }],
  ['null ICP and zero share', { ...ordinary, icp_percentage: null, year1_market_share_target: 0 }],
  ['zero companies', { ...ordinary, total_potential_companies: 0 }],
  ['zero ICP', { ...ordinary, icp_percentage: 0 }],
  ['zero share', { ...ordinary, year1_market_share_target: 0 }],
  ['numeric strings accepted by core validator', { ...ordinary, total_potential_companies: '10,000', average_contract_value: '5000', icp_percentage: '40', year1_market_share_target: '2' }],
  ['sub-dollar values', { ...ordinary, total_potential_companies: 1, average_contract_value: 0.001 }],
  ['small finite values', { ...ordinary, total_potential_companies: 1e-200, average_contract_value: 1e-100 }],
  ['extreme finite overflow', { ...ordinary, total_potential_companies: 1e308 }],
  ['overflow with zero ICP', { ...ordinary, total_potential_companies: 1e308, icp_percentage: 0 }],
  ['overflow with zero share', { ...ordinary, total_potential_companies: 1e308, year1_market_share_target: 0 }],
  ['large finite supported result', { ...ordinary, total_potential_companies: 1e300, average_contract_value: 1 }],
];
const snapshots = [];
for (const [name, args] of cases) {
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    const response = await transport.handleRequest(new Request('http://localhost/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'tam_sam_som_calculator', arguments: args } }) }));
    const result = (await response.json()).result;
    snapshots.push({ name, args, content: result.content, isError: !!result.isError });
    console.log(name + ': base isError=' + !!result.isError);
  } finally { await server.close(); }
}
writeFileSync('tests/fixtures/market-sizing-differential-base.json', JSON.stringify({ base, sourceBlob: sourceBlob, note: 'All cases are synthetic review inputs. Company is a review fixture input only.', cases: snapshots }, null, 2) + '\n');
