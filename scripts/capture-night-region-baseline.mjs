// Run against the pinned baseline before region code is introduced.
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {seedCases,verticalCases,rpc} from '../tests/night-regions-cases.mjs';
const baseline=process.argv[2];if(!baseline)throw new Error('Pass an extracted checkout of commit 01998942dbda8d265f1c951c0b926bc044da9b4c');
const {default:handler}=await import(pathToFileURL(resolve(baseline,'netlify/functions/mcp.mjs')));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rows=[];
for(const c of seedCases)for(const [vertical,product]of verticalCases){
 const args={...c.args,product_category:product};
 const result=await rpc(handler,'tools/call',{name:c.tool,arguments:args});if(result.isError)throw new Error(c.tool+' refused baseline');
 for(let i=0;i<2;i++){if(hash(result)!==hash(await rpc(handler,'tools/call',{name:c.tool,arguments:args})))throw new Error('Baseline is not repeatable');}
 rows.push({tool:c.tool,vertical,args,sha256:hash(result)});
}
writeFileSync(new URL('../tests/fixtures/night-regions-no-region-baseline.json',import.meta.url),JSON.stringify({base_commit:'01998942dbda8d265f1c951c0b926bc044da9b4c',profile:'current',tool_list:await rpc(handler,'tools/list'),rows},null,2)+'\n');
console.log('Captured '+rows.length+' baseline outputs, each identical across three runs.');
