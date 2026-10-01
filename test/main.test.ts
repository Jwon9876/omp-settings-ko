import { expect, mock, test } from "bun:test";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

test("a newer host loads and translates without a version warning", async () => {
 const setting={id:"theme.dark",ui:{label:"Dark Theme",description:"Original description"}};
 let reads=0;
 mock.module("@oh-my-pi/pi-utils",()=>({VERSION:"18.4.8"}));
 mock.module("@oh-my-pi/pi-coding-agent/config/registry",()=>({all:()=>{reads++;return [setting];}}));
 const labels:string[]=[];
 const notifications:string[]=[];
 const handlers:Record<string,(...args:any[])=>unknown>={};
 const {default:extension}=await import("../src/main");
 await extension({
  setLabel:(label:string)=>labels.push(label),
  on:(event:string,handler:(...args:any[])=>unknown)=>{handlers[event]=handler;},
  registerCommand:(_name:string,command:{handler:(...args:any[])=>unknown})=>{handlers.status=command.handler;},
 } as unknown as ExtensionAPI);
 const ctx={ui:{notify:(message:string)=>notifications.push(message)}};
 await handlers.session_start({},ctx);
 expect(reads).toBeGreaterThan(0);
 expect(setting.ui.label).toBe("어두운 테마");
 expect(labels).toEqual(["설정 한국어팩"]);
 expect(notifications).toEqual([]);
 await handlers.status("",ctx);
 expect(notifications[0]).toContain("OMP 18.4.8:");
});
