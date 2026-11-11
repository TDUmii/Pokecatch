import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const fullSource=read('bundle/app.f9da276408.js');
const source=fullSource.slice(fullSource.indexOf('const lt={seven:'));
const context={};vm.runInNewContext(read('bundle/umi-arcade-rules.js'),context);
const boost=context.UmiArcadeRules.boostNativeStops;
const between=(start,end)=>{const a=source.indexOf(start);assert.ok(a>=0,start);const b=source.indexOf(end,a+start.length);assert.ok(b>a,end);return source.slice(a+start.length,b);};
const reels=JSON.parse(between('Ve=[','].map(A=>A.split(" "))').replace(/^/,'[')+']');
const Ve=reels.map(reel=>reel.split(' '));
const at=vm.runInNewContext('['+between('je=120,at=[','],$t=')+']');
const $t=vm.runInNewContext('('+between('$t=',',na=')+')');
const lt=vm.runInNewContext('('+between('const lt=',',me=2')+')');
const evaluateSource='function M(A){'+between('function M(A){','function I(A){');
let seed=81293;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const report=[];
for(const mode of [1,2,3]) {
 const evaluate=vm.runInNewContext('('+evaluateSource+')',{Ve,at,$t,ae:mode,lt,me:2,ke:1,ze:Ve[0].length,de:(a,b)=>(a%b+b)%b});
 let ledger={},wins=0,baseline=0,jackpots=0,afterJackpots=0,maxMisses=0;
 for(let n=0;n<20000;n++) {
  const stops=Ve.map(reel=>Math.floor(random()*reel.length)),before=evaluate(stops);
  const next=boost(stops,Ve,at.slice(0,$t[mode]),ledger,evaluate,random),after=evaluate(next);
  if(before.total>0){assert.equal(next,stops,'already-winning stop array retained');baseline++;}
  wins+=after.total>0;maxMisses=Math.max(maxMisses,ledger.umiMisses);
  const jackpot=x=>x.wins.some(win=>win.sym==='seven'&&win.n===3);
  jackpots+=jackpot(before);afterJackpots+=jackpot(after);
  if(n%10===0){const saved=JSON.stringify(ledger);ledger=JSON.parse(saved);assert.equal(JSON.stringify(ledger),saved,'miss counter survives save roundtrip');}
 }
 assert.ok(wins/20000>.75);assert.ok(maxMisses<=2);assert.equal(afterJackpots,jackpots,'natural777 preserved');
 report.push({lines:$t[mode],trials:20000,baseline:baseline/20000,boosted:wins/20000,maxMisses,jackpots});
}
assert.ok(source.includes('Qs=[{w:38,money:!0},{w:10,miss:!0},{w:30,rare:!0},{w:10,miss:!0},{w:38,money:!0}]'));
assert.equal([38,10,30,10,38].reduce((a,b)=>a+b),126);
for(const machine of ['slots','pachinko'])assert.equal((source.match(new RegExp('__umiCasinoReward\\?\\.\\("'+machine+'"','g'))||[]).length,1,machine+' settlement hook exactly once');
const ui=read('bundle/umi-arcade-ui.js'),boot=read('boot.js');
assert.ok(ui.includes("document.getElementById('screen-casino')"));
assert.ok(ui.includes("host.id = 'umi-casino-prizes'"));
assert.ok(!boot.includes('screen-umiArcade')&&!boot.includes('data-screen="umiArcade"'));
assert.ok(!ui.includes('ua-machine-tabs'),'no separate machine UI');
assert.ok(source.includes('__umiCasinoStops'),'native outcome generator invokes reward rules');
console.log('Native casino verification passed:',JSON.stringify(report));
