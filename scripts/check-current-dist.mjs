import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
// Build first, then compare every committed dist byte with Git's committed current build.
execFileSync(process.execPath,['scripts/build-profile.mjs'],{env:{...process.env,HELIX_PROFILE:'current'},stdio:'inherit'});
const files=execFileSync('git',['ls-files','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
for(const file of files)assert.deepEqual(readFileSync(file),execFileSync('git',['show',`HEAD:${file}`],{maxBuffer:20*1024*1024}),`Committed current build differs: ${file}`);
console.log(`PASS ${files.length} committed dist files equal a fresh current build`);
