import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../bundle/casino-batch.js', import.meta.url), 'utf8');
function setup({money=2000, nativeFree=0, tickets=0, failAt=0}={}) {
  const context = { console, window: {}, Promise }; vm.createContext(context); vm.runInContext(source, context);
  const game = { S: { money, coin:0, ledger:{spins:0,won:0,umiMisses:0}, umiArcade:{nativeFree,items:{'umi-spin-ticket':tickets},nativeReceipts:{},history:[]} }, spend(n){ this.S.money-=n; } };
  let saves=0, grants=0, renders=0;
  const arcade = { state:()=>game.S.umiArcade, quantity:id=>game.S.umiArcade.items[id]||0,
    grant(r){ grants++; game.S.umiArcade.items[r.id]=(game.S.umiArcade.items[r.id]||0)+r.qty; if(failAt===grants) throw Error('injected'); },
    transact(action){ const before=JSON.stringify(game.S); try{const result=action(); saves++; return result;}catch(e){ const target=game.S; Object.keys(target).forEach(k=>delete target[k]); Object.assign(target,JSON.parse(before)); throw e;} }
  };
  context.window.UmiArcadeRules={spin(s,id,{bonus}){const r={rewards:[{kind:'item',id:'gift',qty:bonus?2:1}],bonusSpins:bonus?0:1};s.history.push({...r});return r;}};
  const native={ready:()=>true,ledger:()=>game.S.ledger, preview(){game.S.ledger.umiMisses++; return {result:{total:2,pay:2}};},credit(o){game.S.ledger.spins++;game.S.ledger.won+=o.result.pay;game.S.coin+=o.result.pay;},renderBatch(){renders++;}};
  const api=context.window.UmiCasinoBatch; api.install({Game:game},arcade,native);
  return {api,game,get saves(){return saves;},get renders(){return renders;}};
}
for(const count of [10,100]) {
  const h=setup();assert.equal(h.api.quote(count).cost,1000);
  const r=await h.api.spin(count);assert.equal(r.cost,1000);assert.equal(r.count,count);assert.equal(r.coins,count*2);assert.equal(r.wins,count);assert.equal(h.game.S.money,1000);assert.equal(h.game.S.ledger.spent,1000);assert.equal(h.game.S.ledger.spins,count);assert.equal(h.saves,1);assert.equal(h.renders,1);assert.equal(h.game.S.umiArcade.nativeReceipts.slots,count);assert.equal(r.rewards[0].qty,count);
}
{
 const h=setup({money:0,nativeFree:4,tickets:6}); const r=await h.api.spin(10);assert.equal(r.cost,0);assert.equal(r.free,10);assert.equal(h.game.S.umiArcade.nativeFree,0);assert.equal(h.game.S.umiArcade.items['umi-spin-ticket'],0);assert.equal(r.rewards[0].qty,20);
}
{
 const h=setup({nativeFree:2,tickets:1}); const r=await h.api.spin(10);assert.equal(r.free,3);assert.equal(r.cost,1000);assert.equal(h.game.S.umiArcade.nativeFree,7);assert.equal(h.game.S.umiArcade.items['umi-spin-ticket'],0);
}
{
 const h=setup({money:999,nativeFree:2});const before=JSON.stringify(h.game.S); assert.equal(h.api.quote(10).available,false);await assert.rejects(h.api.spin(10));assert.equal(JSON.stringify(h.game.S),before);assert.equal(h.saves,0);
}
{
 const h=setup({nativeFree:2,tickets:1,failAt:4});const before=JSON.stringify(h.game.S);await assert.rejects(h.api.spin(100),/injected/);assert.equal(JSON.stringify(h.game.S),before);assert.equal(h.saves,0);assert.equal(h.api.quote(10).available,true);
}
{
 const h=setup();const first=h.api.spin(10);await assert.rejects(h.api.spin(100));await first;assert.equal(h.game.S.ledger.spins,10);assert.equal(h.saves,1);
}
console.log('Casino batch: package prices, free turns, rollback, double clicks, receipts and single save passed.');
