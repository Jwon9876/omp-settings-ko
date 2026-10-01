import type { ExtensionAPI } from '@oh-my-pi/pi-coding-agent';
import { all } from '@oh-my-pi/pi-coding-agent/config/registry';

async function report(phase:string) {
 const rows=all().filter(s=>s.ui).map(s=>({id:s.id,ui:s.ui,default:s.default}));
 await Bun.write(process.env.OMP_KO_TEST_REPORT!,JSON.stringify({phase,rows}));
}
export default function(pi: ExtensionAPI) {
 pi.on('session_start',async(_event,ctx)=>{
  await report('startup');
  if(process.env.OMP_KO_TEST_EXIT==='1')ctx.shutdown();
 });
 pi.registerCommand('ko-test-check',{description:'Isolated translation smoke test',handler:async(_args,ctx)=>{
  await report('after-reload');ctx.shutdown();
 }});
}
