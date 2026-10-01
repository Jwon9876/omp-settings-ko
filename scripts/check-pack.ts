import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

await fs.mkdir('artifacts',{recursive:true});
const proc=Bun.spawn(['npm','pack','--cache','artifacts/npm-cache','--json','--pack-destination','artifacts'],{stdout:'pipe',stderr:'inherit'});
const output=await new Response(proc.stdout).text();
assert.equal(await proc.exited,0,'npm pack failed');
const [pack]=JSON.parse(output) as {filename:string;files:{path:string}[];integrity:string}[];
const required=['package.json','src/main.ts','src/localize.ts','lang/ko-settings.json','README.md','LICENSE','NOTICE'];
assert.deepEqual(pack.files.map(f=>f.path).sort(),required.sort(),'Unexpected publish contents');
for(const f of pack.files){const text=await Bun.file(f.path).text();assert(!text.includes('/Users/'),'Local absolute path in '+f.path);}
await Bun.write('artifacts/pack.json',JSON.stringify({file:path.resolve('artifacts',pack.filename),integrity:pack.integrity},null,2)+'\n');
console.log('Verified tarball:',pack.filename,pack.integrity);
