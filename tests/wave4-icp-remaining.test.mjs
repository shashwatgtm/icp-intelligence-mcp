import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const home=process.env.WAVE4_TEST_HOME||process.cwd();const child=spawn(process.execPath,[home+'/dist/index.js'],{cwd:home,stdio:['pipe','pipe','pipe']});let id=0,buf='';const pending=new Map();child.stderr.resume();child.stdout.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\n'))>=0){let line=buf.slice(0,i);buf=buf.slice(i+1);try{let m=JSON.parse(line);pending.get(m.id)?.(m)}catch{}}});
const req=(method,params)=>new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>reject(Error('Timeout '+method)),10000);pending.set(n,m=>{clearTimeout(t);pending.delete(n);resolve(m)});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n')});
await req('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'wave4-reasons',version:'test'}});child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
const call=async(name,args)=>{const r=await req('tools/call',{name,arguments:args});assert.ok(!r.error&&!r.result.isError,JSON.stringify(r));return r.result.content.map(c=>c.text||'').join('\n')};
const verticals=['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'];
test.after(()=>child.kill());
for(const v of verticals)test('C12 '+v+' timing points follow the stated horizon',async()=>{
 for(const [timing,score]of [['now',100],['Ready to buy immediately',100],['We cannot start now',50],['soon',70],['In the next few weeks',70],['later',40],['Next year',40],['Now or later',50]]){
 const t=await call('account_prioritization',{product_category:v+' vendor',accounts:[{name:'Account record',fit_score:50,intent_signals:50,relationship:50,timing}],prioritization_weights:{fit:0,intent:0,relationship:0,timing:100}});if(score===50){assert.match(t,/Unknown/);assert.match(t,/0 to 100 of 100/);}else assert.ok(t.includes('('+score+' pts)'),timing+' '+score);assert.ok(t.includes(timing));
 }
});
for(const v of verticals)test('R4 '+v+' denied buyer and pain do not become requirements',async()=>{
 const a={product_category:v+' vendor',current_customers:'Software firms'};
 const t=await call('icp_gap_analysis',{...a,ideal_icp:'Software firms where the CFO is never involved, who face no billing errors'});const requirements=t.split('Must-Have Criteria')[1]?.split('Disqualification Criteria')[0];assert.ok(requirements);assert.doesNotMatch(requirements,/CFO|no billing errors/);
 const p=await call('icp_gap_analysis',{...a,ideal_icp:'Software firms where the head of finance signs the contract, whose biggest worry is billing errors'});assert.match(p,/head of finance/);assert.match(p,/billing errors/);
});
