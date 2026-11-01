import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Only build code reads environment variables. Runtime code imports literal constants.
const requested = process.env.HELIX_PROFILE;
const profile = requested === 'slice' || requested === 'wave' ? requested : 'current';
const payload = process.env.WAVE_PAYLOAD === "full" ? "full" : "meta";
writeFileSync(path.join(root, 'src/build-profile.ts'), `// Generated at build time. Committed builds must use current.\nexport const BUILD_PROFILE: { profile: "current" | "slice" | "wave"; payload: "meta" | "full" } = { profile: ${JSON.stringify(profile)}, payload: ${JSON.stringify(payload)} };\n`);
const build = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc')], {cwd: root, stdio: 'inherit'});
process.exitCode = build.status ?? 1;
