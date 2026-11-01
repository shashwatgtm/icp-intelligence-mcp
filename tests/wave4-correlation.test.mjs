import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const home=process.env.WAVE4_TEST_HOME||process.cwd();const child=spawn(process.execPath,[home+'/dist/index.js'],{cwd:home,stdio:['pipe','pipe','pipe']});let id=0,buf='';const pending=new Map();child.stderr.resume();child.stdout.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\n'))>=0){let line=buf.slice(0,i);buf=buf.slice(i+1);try{let m=JSON.parse(line);pending.get(m.id)?.(m)}catch{}}});
const req=(method,params)=>new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>reject(Error('Timeout '+method)),10000);pending.set(n,m=>{clearTimeout(t);pending.delete(n);resolve(m)});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n')});
await req('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'wave4-reasons',version:'test'}});child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
const call=async(name,args)=>{const r=await req('tools/call',{name,arguments:args});assert.ok(!r.error&&!r.result.isError,JSON.stringify(r));return r.result.content.map(c=>c.text||'').join('\n')};
const verticals=['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'];
test.after(()=>child.kill());
for(const v of verticals)test('F10 '+v+' success direction is not turned into top fit',async()=>{
 const base={product_category:v+' vendor',scoring_criteria:[{criterion:'Buyer role',importance:'important',values:['CFO','CTO']}]};
 for(const success_correlation of ['CFO has a negative correlation with wins','CFO deals have a lower win rate','CFO deals do not have a positive correlation with wins']){
  const t=await call('icp_scoring_model',{...base,success_correlation});assert.doesNotMatch(t,/make (?:it|them) critical|consider giving it the top points/);assert.match(t,/negative|not clear/);
 }
 const good=await call('icp_scoring_model',{...base,success_correlation:'CFO deals have a positive correlation with wins'});assert.match(good,/make it critical/);
 for(const correlation_direction of ['negative','unknown']){const t=await call('icp_scoring_model',{...base,success_correlation:'CFO deals have a positive correlation with wins',correlation_direction});assert.doesNotMatch(t,/make it critical/)}
});
