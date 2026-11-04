import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/release-production-tools.json',import.meta.url),'utf8'));
const alpha=existsSync(new URL('../netlify/functions/mcp-sse.js',import.meta.url));
const expected=JSON.stringify(fixture.tools_list);
test('complete tools/list bytes equal the pinned reviewed production contract over HTTP',async()=>{
 const {default:handler}=await import(new URL(alpha?'../netlify/functions/mcp-sse.js':'../netlify/functions/mcp.mjs',import.meta.url));
 for(let id=1;id<=3;id++){
  const response=await handler(new Request('https://local.invalid/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id,method:'tools/list',params:{}})}));
  const message=await response.json();assert.ok(!message.error,JSON.stringify(message));assert.equal(JSON.stringify(message.result),expected,fixture.production_commit);
 }
});
test('complete tools/list bytes equal the pinned reviewed production contract over compiled stdio',async()=>{
 const child=spawn(process.execPath,[alpha?'bin/cli.js':'dist/index.js'],{cwd:new URL('..',import.meta.url),stdio:['pipe','pipe','pipe']});
 let id=0,buffer='',errors='';const pending=new Map();child.stderr.on('data',d=>errors+=d);
 child.stdout.on('data',d=>{buffer+=d;let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);try{const message=JSON.parse(line);pending.get(message.id)?.(message)}catch{}}});
 const rpc=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>{pending.delete(n);reject(Error('Timeout '+method+' '+errors))},30000);pending.set(n,message=>{clearTimeout(timer);pending.delete(n);message.error?reject(Error(JSON.stringify(message.error))):resolve(message.result)});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n')});
 try{
  await rpc('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'release-contract',version:'1.0'}});child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
  for(let i=0;i<3;i++)assert.equal(JSON.stringify(await rpc('tools/list')),expected,fixture.production_commit);
 }finally{child.kill();}
});
