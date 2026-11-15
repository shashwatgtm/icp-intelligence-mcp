import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/mcp.mjs';

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/account-prioritization-paper-text.json',import.meta.url)));
for (const check of fixtures.cases) {
  test('Paper preserves the current server answer for ' + check.label, async () => {
    const request = {jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'account_prioritization',arguments:check.args}};
    const response = await handler(new Request('https://local.invalid/mcp',{
      method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify(request)
    }));
    const {result} = await response.json();
    assert.equal(!!result.isError, check.isError);
    assert.equal(createHash('sha256').update(JSON.stringify(result.content)).digest('hex'), check.textSha256);
  });
}
