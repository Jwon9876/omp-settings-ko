import assert from 'node:assert/strict';
import pkg from '../package.json';

assert.equal(process.env.RELEASE_TAG,`v${pkg.version}`,'Release tag must match package version');
const response=await fetch(`https://registry.npmjs.org/${pkg.name}/${pkg.version}`);
assert.equal(response.status,404,`Version already exists or registry lookup failed (${response.status})`);
const pack=await Bun.file('artifacts/pack.json').json();
const proc=Bun.spawn(['npm','publish',pack.file,'--access','public','--tag',pkg.version.includes('-')?'next':'latest'],{stdout:'inherit',stderr:'inherit'});
assert.equal(await proc.exited,0,'npm publish failed');
