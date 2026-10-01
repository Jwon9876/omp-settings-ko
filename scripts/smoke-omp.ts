import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import catalog from '../lang/ko-settings.json';
import type { UI } from '../src/localize';

const root=path.resolve(import.meta.dir,'..');
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'omp-settings-ko-'));
const config=path.join(temp,'config');
const report=path.join(temp,'report.json');
const cli=process.env.OMP_KO_TEST_BINARY ? [process.env.OMP_KO_TEST_BINARY] : [process.execPath,path.join(root,'node_modules/@oh-my-pi/pi-coding-agent/dist/cli.js')];
const env={...process.env,OMP_PROFILE:'',PI_PROFILE:'',PI_CONFIG_DIR:path.relative(os.homedir(),config),PI_CODING_AGENT_DIR:path.join(config,'agent'),OMP_KO_TEST_REPORT:report};
await fs.mkdir(path.join(temp,'cwd'),{recursive:true});
await Bun.write(path.join(config,'agent/config.yml'),'startup:\n  checkUpdate: false\n  showSplash: false\n  quiet: true\n  setupWizard: false\nmarketplace:\n  autoUpdate: off\ngit:\n  enabled: false\ntelemetry:\n  otlpExportEnabled: false\n');
async function run(args: string[],cwd=path.join(temp,'cwd')) {
 const p=Bun.spawn(args,{cwd,env,stdout:'pipe',stderr:'pipe'});
 const [code,stdout,stderr]=await Promise.all([p.exited,new Response(p.stdout).text(),new Response(p.stderr).text()]);
 assert.equal(code,0,`${args.join(' ')}\n${stderr}\n${stdout}`);return stdout;
}
async function install() {
const packageSpec=process.env.OMP_KO_TEST_PACKAGE;
if(packageSpec) await run([...cli,'plugin','install',packageSpec]);
else {
 const pack=await Bun.file(path.join(root,'artifacts/pack.json')).json();
 await fs.mkdir(path.join(config,'plugins'),{recursive:true});
 await Bun.write(path.join(config,'plugins/package.json'),JSON.stringify({name:'omp-ko-test',private:true}));
 await run([process.execPath,'add',pack.file],path.join(config,'plugins'));
}
assert((await run([...cli,'plugin','list'])).includes('omp-settings-ko'));
assert(!(await fs.readdir(path.join(config,'plugins/node_modules'))).includes('@oh-my-pi'),'Host packages must not be installed as runtime peers');
}
const launchArgs=[...cli,'--cwd',path.join(temp,'cwd'),'--mode','rpc','--no-session','--no-tools','--no-lsp','--no-pty','--no-skills','--no-rules','--model','openai/gpt-5.2','--api-key','omp-ko-offline-test-not-a-real-key','-e',path.join(import.meta.dir,'probe-extension.ts')];
interface Report { phase: string; rows: {id:string;ui:UI;default?:unknown}[] }
const translations = catalog.settings as Record<string, Omit<UI,'options'> & {options?: Record<string,{label:string;description?:string}>}>;
let baseline: Report["rows"] | undefined;
async function session(enabled: boolean) {
 await fs.rm(report,{force:true});
 const p=Bun.spawn(launchArgs,{cwd:path.join(temp,'cwd'),env:{...env,OMP_KO_TEST_EXIT:enabled?'0':'1'},stdin:'pipe',stdout:'pipe',stderr:'pipe'});
 const stdout=new Response(p.stdout).text(),stderr=new Response(p.stderr).text();
 const timer=setTimeout(()=>p.kill(),45000);
 try {
  for(let n=0;n<600&&!(await Bun.file(report).exists());n++)await Bun.sleep(50);
  assert(await Bun.file(report).exists(),'No report from real OMP startup');
  const first=await Bun.file(report).json() as Report;
  assert(first.rows.length>0,'Host registry is empty');
  if(baseline) assert.deepEqual(first.rows.map(row=>row.id),baseline.map(row=>row.id));
  let translated=0;
  for(const row of first.rows) {
   const raw=baseline?.find(s=>s.id===row.id);
   if(raw) assert.deepEqual(row.default,raw.default);
   const expectedOptions=raw?.ui.options;
   if(Array.isArray(row.ui.options)&&Array.isArray(expectedOptions))assert.deepEqual(row.ui.options.map(o=>o.value),expectedOptions.map(o=>o.value));
   const entry=translations[row.id];
   if(enabled&&entry) {
    assert.equal(row.ui.label,entry.label,row.id+' label not localized');
    if(!(row.id in catalog.dynamic)) assert.equal(row.ui.description,entry.description,row.id+' description not localized');
    else assert(/[가-힣]/.test(row.ui.description)||row.ui.description===raw?.ui.description,row.id+' dynamic description corrupted');
    if(Array.isArray(row.ui.options)&&Array.isArray(expectedOptions))for(const option of row.ui.options) {
     const originalOption: {value:string;label:string;description?:string}=expectedOptions.find(o=>o.value===option.value)!;
     assert.deepEqual(option,{...originalOption,...entry.options?.[option.value]},row.id+' option changed unexpectedly');
    }
    translated++;
   } else if(raw) assert.deepEqual(row,raw,row.id+' should retain original metadata');
  }
  if(enabled)assert(translated>0,'No known settings were translated');
  if(enabled){
   p.stdin.write(JSON.stringify({id:'reload',type:'prompt',message:'/reload-plugins'})+'\n');
   p.stdin.write(JSON.stringify({id:'verify',type:'prompt',message:'/ko-test-check'})+'\n');
   p.stdin.flush();
  }
  p.stdin.end();
  const code=await p.exited;
  assert.equal(code,0,(await stderr)+'\n'+(await stdout));
  const last=await Bun.file(report).json() as Report;
  if(enabled){assert.equal(last.phase,'after-reload');assert.deepEqual(last.rows,first.rows);}
  return first.rows;
 } finally {clearTimeout(timer);if(p.exitCode===null)p.kill();}
}
try {
 const version=(await run([...cli,'--version'])).trim();
 baseline=await session(false);
 await install();
 await session(true);
 await run([...cli,'plugin','uninstall','omp-settings-ko']);
 await session(false);
 console.log(`${version}: install, known translations, unchanged values, reload and uninstall passed (${baseline.length} host settings).`);
} finally {
 // Keep failure evidence but discard successful isolated config/daemon paths at OS temp cleanup.
 console.log('Isolated test root:',temp);
}
