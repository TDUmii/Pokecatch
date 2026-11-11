import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
function fixture(initial = {}) {
  let now = 1000000, roll = .4, saved, sequence = 0, regionKey = 'kanto', previousCalled = false;
  const timers = [];
  const dex = Object.fromEntries([[1,'Bulbasaur'],[2,'Ivysaur'],[3,'Venusaur'],[4,'Charmander'],[5,'Charmeleon'],[6,'Charizard'],[150,'Mewtwo'],[151,'Mew'],[152,'Chikorita']].map(([id,name])=>[id,{id,name,legendary:id===150,mythical:id===151}]));
  const names = Object.fromEntries(['exp-candy-s','exp-candy-m','exp-candy-xl','exp-candy-big','rare-candy','razz-berry','pinap-berry','lansat-berry','starf-berry','fire-stone','water-stone','thunder-stone','leaf-stone','moon-stone','sun-stone'].map(id=>[id,id]));
  const game = {
    S: {money:100000,items:{},mons:[{uid:'starter',id:1,level:5}],dex:{1:1},stats:{wins:0},...initial}, DEX:dex,
    itemCount(id){return this.S.items[id]||0},addItem(id,n){this.S.items[id]=(this.S.items[id]||0)+n},
    earn(n){this.S.money+=n},spend(n){this.S.money-=n},save(){saved=JSON.stringify(this.S)},
    currentRegion(){return {key:regionKey,name:regionKey,dex:regionKey==='kanto'?[1,151]:[152,251]}},
    levelCap:()=>50,minLevelFor:()=>1,ownedMons(){return this.S.mons},
    isDup(mon){return this.S.mons.some(own=>own.id===mon.id&&!!own.shiny===!!mon.shiny)},
    isLegend(id){return !!(dex[id]?.legendary||dex[id]?.mythical)},
    makeMon(id,level,{shiny}){return {uid:'award-'+(++sequence),id,level,shiny}},maxHp:()=>20,
    receive(mon){this.S.mons.push(mon);this.S.dex[mon.id]=1;return {mon}},
    capped:mon=>mon.level>=50,itemEvolutions:mon=>mon.id===1?[{item:'fire-stone',to:2}]:[],
    useItem(uid,id,to){const mon=this.S.mons.find(mon=>mon.uid===uid);if(!mon||!this.itemCount(id))return null;this.addItem(id,-1);if(to)return {evolve:{uid,to}};mon.level++;return{}},
    evolveMon(uid,to){this.S.mons.find(mon=>mon.uid===uid).id=to},
    useBuffBerry(id){if(!this.itemCount(id))return false;this.addItem(id,-1);return true},sellPrice:()=>500
  };
  const legacyEnter = function legacyEnter() {};
  const casino = {init(){},render(){},enter:legacyEnter};
  const engine={Game:game,ITEM_NAMES:names,CONFIG:{BUFF_BERRIES:{'razz-berry':{},'pinap-berry':{}},EXP_CANDIES:{'exp-candy-s':{},'exp-candy-m':{},'exp-candy-xl':{},'exp-candy-big':{}}},UI:{itemName:id=>id,itemSrc:id=>'assets/items/'+id+'.png',types:()=>'<b>Cỏ</b>',monSrc:mon=>'assets/pokemon/'+mon.id+'.png',toast(){}},App:{current:'adventure',refreshHeader(){},show(){}},Screens:{casino},_t:x=>x};
  const mega={catalog:[{key:'venusaur',base:3,name:'Mega Venusaur',src:'assets/a.png'}],install(){},unlocked:()=>game.S.umiArcade?.megaUnlocks||[],unlock(key){const list=game.S.umiArcade.megaUnlocks;if(list.includes(key))return false;list.push(key);return true},equip(){},unequip(){}};
  class Clock extends Date {static now(){return now}}
  const math=Object.create(Math);math.random=()=>roll;
  const context=vm.createContext({document:{getElementById:()=>null,querySelector:()=>null},Date:Clock,Math:math,console,setInterval:fn=>{timers.push(fn);return timers.length},UmiMega:mega,__setInternalPoke(){previousCalled=true}});
  context.window=context;
  for(const file of ['bundle/umi-arcade-rules.js','bundle/umi-arcade.js'])vm.runInContext(fs.readFileSync(new URL(file,root),'utf8'),context);
  context.__setInternalPoke(engine);
  assert(previousCalled,'Prior engine hook was not chained');
  assert.equal(engine.Screens.casino,casino,'Legacy casino screen replaced');
  assert.equal(casino.enter,legacyEnter,'Legacy enter replaced');
  const api=context.UmiArcade;api.state();
  return {api,game,context,timers,setRoll:v=>{roll=v},advance:n=>{now+=n},setRegion:key=>{regionKey=key},saved:()=>JSON.parse(saved),grant(id,n=1){api.state().items[id]=(api.state().items[id]||0)+n}};
}
const clean=value=>JSON.parse(JSON.stringify(value));
const f=fixture({customRoot:{preserved:true},umiArcade:{adapterExtra:{keep:1}}});
const {api,game}=f;
assert.equal(api.quantity('umi-spin-ticket'),3);assert.equal(api.quantity('umi-supply-crate'),1);
const reference=api.state();assert.equal(api.state(),reference);assert.equal(api.quantity('umi-spin-ticket'),3);
assert.equal(api.state().adapterExtra.keep,1);
let before=clean(game.S);game.S.money=0;before=clean(game.S);
assert.throws(()=>api.spin('evolution',10));assert.deepEqual(clean(game.S),before,'Failed payment changed the save');
assert.equal(api.state().items['umi-spin-ticket'],3,'Welcome pack repeated after rollback');
game.S.money=100000;f.setRoll(.4);api.spin('supply');assert.equal(game.S.money,99500);assert.equal(game.itemCount('exp-candy-s'),3);assert.equal(api.state(),game.S.umiArcade);
api.spin('evolution',10);assert.equal(game.S.money,74500);assert.equal(game.itemCount('fire-stone'),9);assert.equal(api.state().total,11);assert(api.quantity('umi-evolution-chest')>0,'Rare guarantee reward did not reach custom inventory');
const expectedRef=api.state();f.grant('umi-gold-ingot');api.claim('umi-gold-ingot');assert.equal(api.state(),expectedRef,'Claim replaced persistent state');assert.equal(game.S.money,79500);
f.grant('umi-ten-ticket');let tickets=api.quantity('umi-spin-ticket');api.claim('umi-ten-ticket');assert.equal(api.quantity('umi-spin-ticket'),tickets+10);
f.grant('umi-ten-ticket');before=game.S.money;api.spin('pokemon',10,'ten-ticket');assert.equal(api.quantity('umi-ten-ticket'),0);assert.equal(game.S.money,before);
api.spin('pokemon',1,'ticket');assert.equal(api.quantity('umi-spin-ticket'),tickets+9);
f.setRoll(.81); // Force rare and choose a reward without triggering free spins.
api.state().bonus.push('supply');api.spin('supply',1,'bonus');assert.equal(api.state().bonus.length,0);
f.setRoll(.01);api.state().bonus.push('pokemon');const doubled=api.spin('pokemon',1,'bonus')[0];assert.equal(doubled.multiplier,2);assert.equal(doubled.bonusSpins,0);assert.equal(api.state().bonus.length,0);
for(const id of ['umi-choice-ticket','umi-evolution-chest','umi-mega-selector','umi-selected-egg','umi-missing-pass','umi-shiny-selector']){
 f.grant(id);const quantity=api.quantity(id);assert.throws(()=>api.claim(id,'not-an-option'));assert.equal(api.quantity(id),quantity,`Invalid choice consumed ${id}`);
 const choices=api.choices(id);assert(choices.length>0,`Fixture must offer choices for ${id}`);
 if(id==='umi-selected-egg')assert.deepEqual(clean(api.choices(id)),clean(choices),'Egg choices rerolled');
 const selected=choices[0].id;api.claim(id,selected);assert.equal(api.quantity(id),quantity-1);
}
assert.equal(api.state().megaUnlocks[0],'venusaur');assert(game.S.mons.some(mon=>mon.shiny),'Shiny selector did not award a real Pokémon');
let egg=api.snapshot().eggs[0];assert(egg&&!egg.ready);assert.throws(()=>api.claimEgg(egg.key));f.advance(180000);assert(api.snapshot().eggs[0].ready);api.claimEgg(egg.key);assert.equal(api.snapshot().eggs.length,0);assert.throws(()=>api.claimEgg(egg.key));
const wins=fixture();wins.grant('umi-selected-egg');wins.api.claim('umi-selected-egg',wins.api.choices('umi-selected-egg')[0].id);egg=wins.api.snapshot().eggs[0];wins.game.S.stats.wins=5;assert(wins.api.snapshot().eggs[0].ready);wins.api.claimEgg(egg.key);assert.equal(wins.game.S.stats.hatched,1);
const hunt=fixture();hunt.grant('umi-missing-pass');const huntChoices=hunt.api.choices('umi-missing-pass');assert(!huntChoices.some(choice=>[150,151,152].includes(+choice.id)));const target=+huntChoices[0].id;hunt.api.claim('umi-missing-pass',String(target));assert.equal(hunt.game.S.mons.length,1,'Pass must queue encounter, not award Pokémon');hunt.setRegion('johto');assert.equal(hunt.context.__umiArcadeEncounter(152,{ch:0}),152);assert(hunt.api.state().pendingEncounter);hunt.setRegion('kanto');assert.equal(hunt.context.__umiArcadeEncounter(4,{}),4);assert.equal(hunt.context.__umiArcadeEncounter(4,{ch:0}),target);assert.equal(hunt.api.state().pendingEncounter,null);
f.grant('umi-mega-shard',19);assert.throws(()=>api.claim('umi-mega-shard'));assert.equal(api.quantity('umi-mega-shard'),19);f.grant('umi-mega-shard');api.claim('umi-mega-shard');assert.equal(api.quantity('umi-mega-shard'),0);assert(api.quantity('umi-mega-selector')>=1);
let candy=game.itemCount('exp-candy-m'),berry=game.itemCount('razz-berry');api.claim('umi-supply-crate');assert.equal(game.itemCount('exp-candy-m'),candy+3);assert.equal(game.itemCount('razz-berry'),berry+3);
f.grant('umi-loot-charm');api.claim('umi-loot-charm');const old=game.itemCount('exp-candy-s');game.S.stats.wins+=4;f.timers[0]();assert.equal(game.itemCount('exp-candy-s'),old);game.S.stats.wins++;f.timers[0]();assert.equal(game.itemCount('exp-candy-s'),old+1);f.timers[0]();assert.equal(game.itemCount('exp-candy-s'),old+1);f.advance(3600001);game.S.stats.wins+=5;f.timers[0]();assert.equal(game.itemCount('exp-candy-s'),old+1);
f.grant('umi-gold-ingot',10);let scrap=api.state().scrap;api.scrapItem('umi-gold-ingot',10);assert.equal(api.state().scrap,scrap+1000);api.setGoal('umi-spin-ticket');assert.equal(api.state().goal,'umi-spin-ticket');tickets=api.quantity('umi-spin-ticket');scrap=api.state().scrap;api.redeem('umi-spin-ticket');assert.equal(api.quantity('umi-spin-ticket'),tickets+1);assert.equal(api.state().scrap,scrap-100);before=clean(game.S);assert.throws(()=>api.scrapItem('umi-gold-ingot',1000));assert.deepEqual(clean(game.S),before);
const money=game.S.money;api.buyTickets(1);api.buyTickets(10);assert.equal(game.S.money,money-50000);game.save();assert(f.saved().umiArcade.adapterExtra.keep===1);assert(f.saved().customRoot.preserved);
// Ordinary inventory actually consumed by its native APIs.
game.addItem('exp-candy-s',1);const level=game.S.mons[0].level;api.claim('exp-candy-s','starter');assert.equal(game.S.mons[0].level,level+1);game.addItem('razz-berry',1);berry=game.itemCount('razz-berry');api.claim('razz-berry');assert.equal(game.itemCount('razz-berry'),berry-1);
console.log('Arcade adapter integration passed: persisted grants, atomic failures, payments, bonus, claims, eggs, hunts, loot, scrap, redemption and old saves.');

// A catch during incubation/hunting must not strand or silently consume the reward.
const overlap=fixture();overlap.grant('umi-selected-egg');const eggChoice=overlap.api.choices('umi-selected-egg')[0];
overlap.api.claim('umi-selected-egg',eggChoice.id);const pendingEgg=overlap.api.snapshot().eggs[0];
overlap.game.S.mons.push({uid:'caught-while-hatching',id:+eggChoice.id,level:5,shiny:false});overlap.advance(180000);
overlap.api.claimEgg(pendingEgg.key);assert.equal(overlap.api.snapshot().eggs.length,0);assert.equal(overlap.api.quantity('umi-selected-egg'),1,'Blocked egg must refund a usable selection');
const overlapHunt=fixture();overlapHunt.grant('umi-missing-pass');const huntChoice=overlapHunt.api.choices('umi-missing-pass')[0];
overlapHunt.api.claim('umi-missing-pass',huntChoice.id);overlapHunt.game.S.dex[+huntChoice.id]=1;
assert.equal(overlapHunt.context.__umiArcadeEncounter(4,{ch:0}),4);assert.equal(overlapHunt.api.state().pendingEncounter,null);assert.equal(overlapHunt.api.quantity('umi-missing-pass'),1,'Completed species must refund the hunt pass');
const protectedItem=fixture();protectedItem.game.S.items['key-item']=1;protectedItem.game.S.items['exp-candy-s']=1;
assert.throws(()=>protectedItem.api.scrapItem('key-item'));assert.equal(protectedItem.game.S.items['key-item'],1,'Quest items must not be recyclable');

// The inherited casino settles its own bets; the hook adds actual saved gifts only once.
const native = fixture(); native.setRoll(.4);
let nativeMoney=native.game.S.money;
let nativeTickets=native.api.quantity('umi-spin-ticket');
native.context.__umiCasinoReward('slots',{spin:1,cost:0,bet:1000,pay:2});
assert.equal(native.api.quantity('umi-spin-ticket'),nativeTickets-1);
assert.equal(native.game.itemCount('exp-candy-s'),3);
assert.equal(native.game.S.money,nativeMoney,'Gift hook charged free native turn');
assert.equal(native.api.state().total,1);
let settled=clean(native.game.S);
native.context.__umiCasinoReward('slots',{spin:1,cost:0,bet:1000,pay:2});
assert.deepEqual(clean(native.game.S),settled,'Duplicate native receipt granted twice');
native.game.S.money-=1000;nativeMoney=native.game.S.money;
native.context.__umiCasinoReward('slots',{spin:2,cost:1000,bet:1000,pay:0});
assert.equal(native.game.S.money,nativeMoney,'Native paid bet charged twice');
assert.equal(native.game.itemCount('exp-candy-s'),6);
assert.equal(native.api.state().history.length,2);
native.context.__umiCasinoReward('pachi',{batch:10,cost:50,count:10});
assert.equal(native.api.state().total,3,'Pachinko batch must award exactly once');
assert.equal(native.game.itemCount('fire-stone'),1);
settled=clean(native.game.S);
native.context.__umiCasinoReward('pachi',{batch:10,cost:50,count:10});
assert.deepEqual(clean(native.game.S),settled);
const migrated=fixture({umiArcade:{welcomed:true,bonus:['supply','pokemon','evolution'],items:{'umi-spin-ticket':2,'umi-gold-ingot':7},goal:'umi-mega-selector',scrap:123,eggs:[{key:'old-egg',id:4,readyAt:1200000,winAt:5,reg:'kanto'}],megaUnlocks:['venusaur'],unknownAdapter:'keep'}});
assert.equal(migrated.api.state().nativeFree,3);assert.equal(migrated.api.state().bonus.length,0);assert.equal(migrated.api.quantity('umi-spin-ticket'),2);
migrated.setRoll(.4);
migrated.context.__umiCasinoReward('slots',{spin:1,cost:0,bet:1000,pay:0});
assert.equal(migrated.api.state().nativeFree,2,'Native free queue not consumed first');
assert.equal(migrated.api.quantity('umi-spin-ticket'),2,'Ticket consumed before migrated free turn');
migrated.game.save();const reload=fixture(migrated.saved());
assert.equal(reload.api.state().nativeFree,2,'Migration repeated on reload');
assert.equal(reload.api.quantity('umi-gold-ingot'),7);assert.equal(reload.api.quantity('umi-spin-ticket'),2);
assert.equal(reload.api.state().goal,'umi-mega-selector');assert.equal(reload.api.state().scrap,123);
assert.equal(reload.api.state().eggs[0].key,'old-egg');assert.equal(reload.api.state().megaUnlocks[0],'venusaur');assert.equal(reload.api.state().unknownAdapter,'keep');
assert.equal(reload.api.snapshot().customBonusRemaining,4);
console.log('Native casino integration passed: legacy screen preserved, receipt idempotence, no double bet charge, one Pachinko gift per batch, old free turns before tickets and complete save migration.');
