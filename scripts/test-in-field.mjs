import {readdirSync,readFileSync,existsSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
const repo=fileURLToPath(new URL('../',import.meta.url));
const root=process.env.HELIX_WORK||process.env.HELIX_POOL_DIR;
const required=['run20/eval/builders20.mjs','run20/eval/tuning20.mjs','run20/eval/holdout-check20.mjs','run21/eval/common21.mjs','run21/eval/pool.mjs','run22/eval/pool2.mjs','run21/eval/e11lib21.mjs'];
if(!root||required.some(f=>!existsSync(join(root,f)))){
 console.error('In-field suite requires HELIX_WORK pointing to the private work folder with the run20, run21 and run22 fixtures. Missing fixtures fail this release gate.');process.exit(1);
}
const files=readdirSync(join(repo,'tests')).filter(f=>f.endsWith('.test.mjs')&&/skip:\s*!(?:POOL_DIR|POOL_AVAILABLE|POOL_OK|poolAvailable|pool|lib|POOL|havePool|BUILD20)\b/.test(readFileSync(join(repo,'tests',f),'utf8'))).sort().map(f=>join(repo,'tests',f));
const receiptDir=process.env.HELIX_PRIVATE_RECEIPTS?resolve(process.env.HELIX_PRIVATE_RECEIPTS):mkdtempSync(join(tmpdir(),'helix-in-field-'));
mkdirSync(receiptDir,{recursive:true});
const receipt=join(receiptDir,'private-summary.json');
// An interrupted child must never reuse an earlier run's success receipt.
rmSync(receipt,{force:true});
const env={...process.env,HELIX_WORK:root,HELIX_POOL_DIR:root,PRIVATE_RECEIPT:receipt};
// Never forward raw test output: assertions can include private customer text.
const result=spawnSync(process.execPath,['--test','--test-concurrency=1','--test-name-pattern=(?:pool|project E11|style check gives no flag)','--test-reporter='+new URL('./in-field-reporter.mjs',import.meta.url).href,...files],{cwd:repo,env,encoding:'utf8',maxBuffer:32*1024*1024});
const report=existsSync(receipt)?JSON.parse(readFileSync(receipt,'utf8')):null;
const expected=2;
const counts=report?.counts;
console.log(JSON.stringify({suite:'in-field',expected,counts:counts||null,exit_code:result.status}));
if(!counts||counts.tests!==expected||counts.skipped!==0||counts.failed!==0||counts.passed!==expected||result.status!==0)process.exit(1);
