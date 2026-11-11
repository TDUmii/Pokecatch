import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'bundle/umi-mega.js'), 'utf8'), { window });
const mega = window.UmiMega;
assert.equal(window.__pokeProtectMegaDuplicate({id:6,umiMegaKey:'6-mega-x'}),true,'load hook works before install');
assert.equal(window.__pokeProtectMegaDuplicate({id:3,umiMegaKey:'6-mega-x'}),false,'wrong base unprotected');
assert.equal(window.__pokeProtectMegaDuplicate({id:6,umiMegaKey:'invalid'}),false,'unknown form unprotected');
assert.equal(window.__pokeProtectMegaDuplicate(null),false);
let saves = 0, refreshes = 0;
const S = { mons: [{uid:'v',id:3,hp:40}, {uid:'c',id:6,hp:39}, {uid:'baby',id:1,hp:20}], pension:{mons:[]}, under:{slots:[]}, umiArcade:{tokens:17} };
const baseStats = {3:{hp:80},6:{hp:78},1:{hp:40}};
const engine = { Game: { S, maxHp:mon => window.__pokeGetMegaBaseStats?.(mon)?.hp || baseStats[mon.id].hp, save:()=>saves++ }, App:{refresh:()=>refreshes++} };
mega.install(engine);
assert.equal(mega.catalog.length, 48);
for (const form of mega.catalog) {
  assert.ok(form.base > 0 && form.name && form.types.length);
  assert.deepEqual(Object.keys(form.stats).sort(), ['atk','def','hp','spa','spd','spe']);
  assert.ok(Object.values(form.stats).every(value=>Number.isInteger(value)&&value>0));
  for(const shiny of ['', 'shiny/']) {
    assert.ok(fs.existsSync(path.join(root, `assets/pokemon/mega/${shiny}${form.key}.png`)),form.key+' icon');
    for(const back of ['', 'back/']) for(const still of [false,true]) {
      const resource=`assets/pokemon/mega/art/${back}${shiny}${still?'still/':''}${form.key}.${still?'png':'gif'}`;
      assert.ok(fs.existsSync(path.join(root,resource)),resource);
    }
  }
}
assert.equal(mega.unlock('missing'),false);
assert.equal(mega.equip('v','3-mega').ok,false);
assert.equal(mega.unlock('3-mega'),true);
assert.equal(mega.unlock('3-mega'),false);
assert.equal(saves,0,'unlock leaves save to reward transaction');
assert.equal(mega.equip('baby','3-mega').ok,false);
assert.equal(mega.equip('missing','3-mega').ok,false);
assert.equal(mega.equip('v','3-mega').ok,true);
assert.equal(window.__pokeGetMegaBaseStats(S.mons[0]).def,123);
assert.equal(window.__pokeGetMegaStatMult(S.mons[0]),1);
assert.equal(S.mons[0].hp/engine.Game.maxHp(S.mons[0]),0.5);
assert.equal(window.__pokeGetMegaBaseStats(3),null,'species-only rendering must not affect other individuals');
assert.ok(window.__pokeMegaMonSrc(S.mons[0],true).includes('shiny/3-mega.png'));
assert.ok(window.__pokeMegaArtSrc(S.mons[0],false,true,true).endsWith('back/still/3-mega.png'));
assert.ok(window.__pokeMegaRankTag(S.mons[0]).includes('Mega Venusaur'));
assert.equal(mega.unlock('6-mega-x'),true);
assert.equal(mega.equip('c','6-mega-x').ok,false,'capacity1 preserves first Mega');
S.adv={badges:['a','b','c','d']};S.umiArcade.items={'umi-mega-shard':370};
assert.equal(mega.unlockSlot(2).ok,true);
assert.equal(mega.equip('c','6-mega-x').ok,true);
assert.equal(S.mons[0].umiMegaKey,'3-mega','first Mega remains equipped');
assert.equal(S.mons[0].hp,40);
assert.equal(window.__pokeGetMegaTypes(S.mons[1]).join(','),'fire,dragon');
assert.equal(window.__pokeGetMegaBaseStats(S.mons[1]).atk,130);
assert.equal(S.mons[1].hp,39);
// Exercise the actual shared render helpers, not just the extension hooks.
const appSource=fs.readFileSync(path.join(root,'bundle/app.f9da276408.js'),'utf8');
const extract=(start,end)=>{const at=appSource.indexOf(start);assert.ok(at>=0,start);return appSource.slice(at+start.length,appSource.indexOf(end,at));};
const renderContext={window, t:{SPRITE_BOUNDS:{}}, X:{}, Be:new Set(), rt:id=>Number(typeof id==='object'?id.id:id)<=493, ut:()=>true};
renderContext.ot=vm.runInNewContext('((L,ue,_enemy)=>'+extract('ot=(L,ue,_enemy)=>',',Be=new Set')+')',renderContext);
renderContext.Me=vm.runInNewContext('((L,ue,_e)=>'+extract('Me=(L,ue,_e)=>',',Te=(L,ue)=>')+')',renderContext);
renderContext.Z=()=> 'translate(0px, 0px)';
const spriteBox=vm.runInNewContext('((L,ue,_e=2,Oe=56*_e*.8,Ot="",Kt=!1)=>'+extract('Ce=(L,ue,_e=2,Oe=56*_e*.8,Ot="",Kt=!1)=>',',vt=new Map')+')',renderContext);
const ally=S.mons[1], foe={id:6,uid:'foe',foe:true,shiny:false}, normal={id:6,uid:'normal',shiny:false};
assert.match(spriteBox(ally,false,2,76),/mega\/6-mega-x\.png/);
assert.match(renderContext.Me(ally,false,false),/mega\/art\/6-mega-x\.gif/);
for(const other of [foe,normal,6]) {
 assert.equal(renderContext.ot(other,false),'assets/pokemon/6.png');
 assert.equal(renderContext.Me(other,false,false),'assets/pokemon/art/6.gif');
 assert.doesNotMatch(spriteBox(other,false,2,76),/mega\//);
}
const restored=JSON.parse(JSON.stringify(S));
assert.equal(restored.umiArcade.tokens,17);
assert.equal(restored.mons[1].umiMegaKey,'6-mega-x');
assert.deepEqual(restored.umiArcade.megaUnlocks,['3-mega','6-mega-x']);
assert.equal(mega.unequip('c').ok,true);
assert.equal(window.__pokeGetMegaBaseStats(S.mons[1]),null);
assert.equal(S.mons[1].hp,39);
assert.equal(mega.unequip('missing').ok,false);
S.mons[0].hp=0; mega.equip('v','3-mega'); assert.equal(S.mons[0].hp,0,'Mega must not revive');
window.__pokeUnequipAllMegaFromMon(S.mons[0]); assert.equal(S.mons[0].umiMegaKey,undefined);
assert.ok(saves>0 && refreshes>0);
console.log(`Mega verification passed: ${mega.catalog.length} genuine forms, all icon/front/back/shiny/still assets, unlock/equip/unequip, type/stat hooks, multiple equipped, HP and save compatibility.`);

// Slot progression, failed saves and full-capacity forms preserve the entire save.
{
  let writes=0, rejectSave=false;
  const w={};vm.runInNewContext(fs.readFileSync(path.join(root,'bundle/umi-mega.js'),'utf8'),{window:w});
  const forms=w.UmiMega;
  const save={mons:[{uid:'x1',id:6,hp:39},{uid:'x2',id:6,hp:0},{uid:'m',id:150,hp:50},{uid:'v',id:3,hp:40}],pension:{mons:[{mon:{uid:'p',id:9,hp:40}}]},under:{slots:[{mons:[{mon:{uid:'u',id:65,hp:20}}]}]},adv:{badges:Array.from({length:24},(_,i)=>'b'+i)},umiArcade:{unknown:42,items:{'umi-mega-shard':370},megaUnlocks:['6-mega-x','6-mega-y','150-mega-x','3-mega','9-mega','65-mega']}};
  const e={Game:{S:save,candyFamily:id=>id===6?4:id,maxHp:mon=>w.__pokeGetMegaBaseStats?.(mon)?.hp||({6:78,150:100,3:80,9:80,65:40}[mon.id]),save(){writes++;if(rejectSave)throw Error('disk full');}},App:{refresh(){}},STORY:{CHAPTERS:[...Array.from({length:24},(_,i)=>({steps:[{kind:'gym',badge:'b'+i}]})),{league:true,steps:[{kind:'gym',badge:'champ',champion:true}]}]}};
  forms.install(e);save.adv.badges.push('b1','champ','fake');
  const before=JSON.stringify(save);assert.equal(forms.progress().badges,24);assert.equal(JSON.stringify(save),before,'progress is read-only');
  assert.equal(forms.unlockSlot(6).ok,false);assert.equal(writes,0);
  save.adv.badges=['b0'];assert.equal(forms.unlockSlot(2).ok,false);assert.equal(writes,0);save.adv.badges=Array.from({length:24},(_,i)=>'b'+i);
  const shards=save.umiArcade.items['umi-mega-shard'];save.umiArcade.items['umi-mega-shard']=0;assert.equal(forms.unlockSlot(2).ok,false);assert.equal(writes,0);save.umiArcade.items['umi-mega-shard']=shards;
  rejectSave=true;const failed=JSON.stringify(save);assert.equal(forms.unlockSlot(2).ok,false);assert.equal(JSON.stringify(save),failed,'unlock rolls back on save failure');rejectSave=false;
  for(let cap=2;cap<=6;cap++){const n=writes;assert.equal(forms.unlockSlot(cap).ok,true);assert.equal(writes,n+1);assert.equal(forms.progress().capacity,cap);}
  assert.equal(save.umiArcade.items['umi-mega-shard'],0);assert.equal(save.umiArcade.unknown,42);assert.equal(forms.progress().next,null);
  for(const [uid,key] of [['x1','6-mega-x'],['x2','6-mega-x'],['m','150-mega-x'],['v','3-mega']])assert.equal(forms.equip(uid,key).ok,true);
  save.pension.mons[0].mon.umiMegaKey='9-mega';save.under.slots[0].mons[0].mon.umiMegaKey='65-mega';assert.equal(forms.progress().used,6);
  assert.equal(save.keepDup[4],1,'equip enables native family keep without a second save');
  const persisted=JSON.parse(JSON.stringify(save));assert.equal(persisted.keepDup[4],1,'duplicate protection survives reload');
  assert.equal(save.mons[1].hp,0,'multiple Mega never revive');assert.equal(forms.equip('x1','6-mega-y').ok,true,'switch form while full');assert.equal(save.mons[1].umiMegaKey,'6-mega-x');
  save.mons.push({uid:'extra',id:6,hp:39});const full=JSON.stringify(save),n=writes;assert.equal(forms.equip('extra','6-mega-x').ok,false);assert.equal(JSON.stringify(save),full);assert.equal(writes,n);
  rejectSave=true;assert.equal(forms.unequip('x1').ok,false);assert.equal(JSON.stringify(save),full,'unequip restores HP and form on failed save');rejectSave=false;
  e.TabLock={lost:true};assert.equal(forms.unequip('x1').ok,false);assert.equal(JSON.stringify(save),full);e.TabLock.lost=false;
  assert.equal(forms.unequip('x1').ok,true);assert.equal(save.mons[1].umiMegaKey,'6-mega-x');assert.equal(forms.progress().used,5);assert.equal(save.keepDup[4],1,'unequip preserves native keep preference');
  save.umiArcade.megaCapacity=999;assert.equal(forms.progress().capacity,6);save.umiArcade.megaCapacity=-10;assert.equal(forms.progress().capacity,1);assert.equal(forms.progress().used,5,'legacy overcapacity equipment preserved');
  const restored=JSON.parse(JSON.stringify(save));assert.equal(restored.mons[1].umiMegaKey,'6-mega-x');
}
console.log('Mega slots passed: 1–6, 370 shards, unique real gym badges, duplicate Charizard forms, global capacity, rollback, TabLock and legacy equipment.');
