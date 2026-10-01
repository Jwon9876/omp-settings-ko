import { expect, test } from "bun:test";
import original from "./registry-18.4.6.json";
import { applyKoreanSettings, localizeUI, type SettingMetadata } from "../src/localize";

test("the full official registry is translated without changing stored values or defaults", () => {
 const registry = structuredClone(original) as unknown as SettingMetadata[];
 const before = structuredClone(registry);
 const counts = applyKoreanSettings(registry);
 expect(counts).toEqual({settings:393,descriptions:393,options:633,optionDescriptions:450,warnings:1,missing:[],skipped:[]});
 expect(applyKoreanSettings(registry)).toEqual(counts);
 for (let i=0;i<registry.length;i++) {
  const after=registry[i], prior=before[i];
  const {ui: _a,...restA}=after, {ui: _b,...restB}=prior;
  expect(restA).toEqual(restB);
  if(Array.isArray(after.ui?.options)&&Array.isArray(prior.ui?.options)) expect(after.ui.options.map(o=>o.value)).toEqual(prior.ui.options.map(o=>o.value));
 }
 const fetch=registry.find(s=>s.id==='providers.fetch')!;
 expect(fetch.ui!.label).toBe('URL 읽기 백엔드');
});

test("live key hints and getter behavior survive repeated applications and module reloads", async () => {
 let key='Esc';
 const ui={label:'Double-Escape Action',get description(){return `What pressing ${key} twice with an empty editor does: open the transcript rewind selector, open the session tree, or nothing`;}};
 const registry=[{id:'doubleEscapeAction',ui}];
 applyKoreanSettings(registry);expect(ui.description).toContain('Esc를 두 번');
 key='⎋';
 // A cache-busted module simulates OMP replacing the extension module during reload.
 const fresh = await import(new URL('../src/localize.ts?reload-test',import.meta.url).href);
 for(let i=0;i<100;i++) fresh.applyKoreanSettings(registry);
 expect(ui.description).toContain('⎋를 두 번');
 expect(localizeUI('doubleEscapeAction',{label:'future',get description(){return 'unknown future wording';}}).description).toBe('unknown future wording');
});

test("unknown settings and immutable metadata remain intact and are reported", () => {
 const frozen=Object.freeze({label:'Dark Theme',description:'original'});
 const unknown={label:'new setting',description:'new description'};
 const counts=applyKoreanSettings([{id:'theme.dark',ui:frozen},{id:'future.setting',ui:unknown}]);
 expect(counts.skipped).toEqual(['theme.dark']);expect(counts.missing).toEqual(['future.setting']);
 expect(frozen.label).toBe('Dark Theme');expect(unknown.description).toBe('new description');
});
