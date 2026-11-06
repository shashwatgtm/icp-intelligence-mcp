// Optional cloud-only capture from the owner's six existing checkouts. No build or network.
// node evals/capture-cloud-fixtures.mjs /workspace /workspace/work/w6-cloud.json
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { registerHooks } from 'node:module';
import ts from 'typescript';

// These checkouts use TypeScript imports written for emitted .js files.
registerHooks({ resolve(specifier, context, nextResolve) {
  try { return nextResolve(specifier, context); }
  catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.') && specifier.endsWith('.js')) {
      return nextResolve(specifier.slice(0, -3) + '.ts', context);
    }
    throw error;
  }
}, load(url, context, nextLoad) {
  if (url.endsWith('.ts')) {
    return { format: 'module', shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText };
  }
  return nextLoad(url, context);
} });

globalThis.fetch = async () => { throw new Error('Network forbidden during offline capture'); };
const root = process.argv[2] || '/workspace';
const output = process.argv[3];
if (!output) throw new Error('Output path required');
const { WebStandardStreamableHTTPServerTransport } = await import(pathToFileURL(path.join(root, 'icp-intelligence-mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/server/webStandardStreamableHttp.js')));
const source = JSON.parse(readFileSync(new URL('./source/HOST-REVIEW-CASES.json', import.meta.url)));
const impact = source.find(s => s.name === 'helix-impact');
const fromPrompt = c => JSON.parse(c.prompt.slice(c.prompt.indexOf('{')));
const original = fromPrompt(impact.cases.positive[4]);
const variants = [
  ['original', original], ['empty', { ...original, customer_feedback: '' }],
  ['size500', { ...original, target_customer: original.target_customer + ' with 500 employees', customer_feedback: '' }],
  ['size5000', { ...original, target_customer: original.target_customer + ' with 5000 employees', customer_feedback: '' }],
  ['operations-no-size', { ...original, target_customer: 'Operations team at synthetic firms', customer_feedback: '' }],
  ['operations-size500', { ...original, target_customer: 'Operations team at synthetic firms with 500 employees', customer_feedback: '' }],
  ['operations-size5000', { ...original, target_customer: 'Operations team at synthetic firms with 5000 employees', customer_feedback: '' }],
  ['neutral-no-size', { ...original, target_customer: 'B2B software firms', customer_feedback: '' }],
  ['neutral-size500', { ...original, target_customer: 'B2B software firms with 500 employees', customer_feedback: '' }],
  ['neutral-size5000', { ...original, target_customer: 'B2B software firms with 5000 employees', customer_feedback: '' }]
];
const data = { provenance: 'Offline in-process tools/list and tools/call from cloud checkout sources. Not live endpoint calls.', inventories: [], impact: [] };
function checkoutSha(dir) {
  const gitDir = path.join(dir, '.git');
  const head = readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
  if (!head.startsWith('ref: ')) return head;
  const ref = head.slice(5);
  try { return readFileSync(path.join(gitDir, ref), 'utf8').trim(); }
  catch {
    const line = readFileSync(path.join(gitDir, 'packed-refs'), 'utf8').split('\n').find(l => l.endsWith(' ' + ref));
    if (!line) throw new Error('Missing checkout ref');
    return line.split(' ')[0];
  }
}
for (const repo of ['revenue-enablement-mcp', 'craft-gtm-mcp', 'impact-mcp', 'craft-content-mcp', 'icp-intelligence-mcp', 'gtm-alpha-secure']) {
  const dir = path.join(root, repo);
  const sha = checkoutSha(dir);
  let id = 0;
  let send;
  if (repo === 'gtm-alpha-secure') {
    const { default: handler } = await import(pathToFileURL(path.join(dir, 'netlify/functions/mcp-sse.js')));
    send = async message => (await (await handler(new Request('https://offline.invalid/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify(message) }))).json()).result;
  } else {
    const entry = repo.startsWith('craft-') ? 'src/server.ts' : 'src/index.ts';
    const { createServer } = await import(pathToFileURL(path.join(dir, entry)));
    send = async message => {
      const oneServer = createServer();
      const oneTransport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      await oneServer.connect(oneTransport);
      try {
        return (await (await oneTransport.handleRequest(new Request('https://offline.invalid/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify(message) }), { parsedBody: message })).json()).result;
      } finally { await oneServer.close(); }
    };
  }
  const tools = await send({ jsonrpc: '2.0', id: ++id, method: 'tools/list', params: {} });
  data.inventories.push({ repo, sha, names: tools.tools.map(t => t.name) });
  if (repo === 'impact-mcp') {
    for (const [label, args] of variants) {
      data.impact.push({ id: label, tool: 'impact_full_audit', args, result: await send({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name: 'impact_full_audit', arguments: args } }) });
    }
    const args = fromPrompt(impact.cases.positive[1]);
    data.impact.push({ id: 'champions-original', tool: 'impact_identify_champions', args, result: await send({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name: 'impact_identify_champions', arguments: args } }) });
  }
}
writeFileSync(output, JSON.stringify(data, null, 2) + '\n');
console.log('Captured six offline source inventories and eleven IMPACT source responses');
