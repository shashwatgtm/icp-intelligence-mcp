import {createHash} from 'node:crypto';
import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Only build code reads environment variables. Runtime code imports literal constants.
const requested = process.env.HELIX_PROFILE;
const profile = requested === 'slice' || requested === 'wave' ? requested : 'current';
const payload = process.env.WAVE_PAYLOAD === "full" ? "full" : "meta";
const domainEnabled=process.env.WIDGET_UI_DOMAIN==='on';
const sourceDirectory=path.join(root, 'src');
const sources=readdirSync(sourceDirectory).filter(name=>name.endsWith('.ts')&&name!=="build-profile.ts").sort().map(name=>[name,readFileSync(sourceDirectory+'/'+name,'utf8')]);
const buildHash=createHash('sha256').update(JSON.stringify([profile,payload,domainEnabled,sources])).digest('hex').slice(0,12);
writeFileSync(path.join(root, 'src/build-profile.ts'), `// Generated at build time. Committed builds must use current.\nexport const BUILD_PROFILE: { profile: "current" | "slice" | "wave"; payload: "meta" | "full"; domainEnabled: boolean; buildHash: string } = { profile: ${JSON.stringify(profile)}, payload: ${JSON.stringify(payload)}, domainEnabled: ${domainEnabled}, buildHash: ${JSON.stringify(buildHash)} };\n`);
const build = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc')], {cwd: root, stdio: 'inherit'});
process.exitCode = build.status ?? 1;
