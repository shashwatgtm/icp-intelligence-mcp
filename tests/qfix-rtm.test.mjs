import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import cases from './fixtures/qfix-rtm-cases.mjs';
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url)));
const family=({'@shashwatgtmalpha/icp-intelligence-mcp':'icp','@shashwatgtmalpha/impact-mcp':'impact','@shashwatgtmalpha/craft-gtm-mcp':'craft','@shashwatgtmalpha/craft-content-mcp':'content','@shashwatgtmalpha/revenue-enablement-mcp':'revenue'})[pkg.name]||({ 'icp-intelligence-mcp':'icp','impact-mcp':'impact','craft-gtm-mcp':'craft','craft-content-mcp':'content','revenue-enablement-mcp':'revenue'})[pkg.name];
const alpha=existsSync(new URL('../netlify/functions/mcp-sse.js',import.meta.url));
const {default:handler}=await import(alpha?'../netlify/functions/mcp-sse.js':'../netlify/functions/mcp.mjs');
async function call(name,args){const r=await (await handler(new Request('https://local.invalid/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})}))).json();assert.ok(!r.error,JSON.stringify(r));return r.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');}
const checks={
 R1:t=>assert.match(t,/Missing input:.*scoring criteria/i),
 R2:t=>{assert.match(t,/60(?:\.0)?%/);assert.match(t,/assumed|not establish.*attainable/i);},
 R3:t=>{assert.match(t,/Missing input:.*confirmed budget owner/);assert.match(t,/No budget authority or champion advocacy is confirmed/);assert.doesNotMatch(t,/Economic Buyer \(authority confirmed/);},
 R4:t=>assert.match(t,/Invalid input.*customers\[0\].*must be an object/i),
 R5:t=>assert.match(t,/claim|unconfirmed|unsupported|verify|evidence/i),
 R6:t=>assert.match(t,/Invalid input.*company counts must be text/i),
 R7:t=>{assert.match(t,/12%/);assert.match(t,/below.*90%|90%.*(?:exceeds|above|not support)/i);assert.doesNotMatch(t,/Q is a fraud|helps.*90%|help.*90%/i);assert.match(t,/product type/i);},
 R8:t=>{assert.match(t,/early signal/i);assert.doesNotMatch(t,/\| NPS Score[^\n]*(?:EXCELLENT|9\/10)/);assert.match(t,/40%[^\n]*40%|40%[^\n]*meets|meets[^\n]*40%/i);},
 R9:t=>assert.match(t,/Invalid input.*churn reasons must be text/i),
 R10:t=>assert.match(t,/Invalid input.*compliance requirements must be text/i),
 R11:t=>assert.match(t,/Invalid input.*target segments must be text/i),
 R12:t=>{assert.match(t,/Missing input: customer quote/);assert.doesNotMatch(t,/none yet|In their words\.\s*["“]\s*(?:none|unknown|tbd)/i);},
 R13:t=>{assert.match(t,/Missing input: proof points/);assert.doesNotMatch((t.split('## Draft with held statements omitted')[1]||t).split('## Reading the answer')[0],/replace all SDRs/);},
 R14:t=>assert.match(t,/Invalid input.*customer status must be one of/i),
 R15:t=>assert.match(t,/negative|\-350|loss|does not|payback|recover/i),
 R16:t=>assert.match(t,/Invalid input.*competitor price must be text/i),
 R17:t=>assert.match(t,/Invalid input.*competitors must be text/i),
 R18:t=>{assert.match(t,/Missing input: competitor won/);assert.doesNotMatch(t,/lost to unknown/i);},
 R19:t=>{assert.match(t,/Absolute claim held out/);assert.match(t,/Named customer social proof held out/);assert.doesNotMatch((t.split('## Draft with held statements omitted')[1]||t).split('## Reading the answer')[0].split('## Before you send')[0],/we stop 100%|used by JPMorgan/);},
 R20:t=>assert.match(t,/Invalid input.*known pain points must be text/i),
};
for(const [f,id,tool,args] of cases.filter(c=>c[0]===family))test(`RTM original probe ${id} ${tool}`,async()=>{const a=await call(tool,args);checks[id](a);assert.equal(await call(tool,args),a,'deterministic repeated output');});
test('RTM R1 through R20 original fixture inventory is intact',()=>{assert.equal(cases.length,20);assert.deepEqual(cases.map(c=>c[1]),Array.from({length:20},(_,i)=>'R'+(i+1)));});
