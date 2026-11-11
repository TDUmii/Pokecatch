import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'bundle/umi-mega.js'), 'utf8'), { window });
const mega = window.UmiMega;
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
assert.equal(mega.equip('c','6-mega-x').ok,true);
assert.equal(S.mons[0].umiMegaKey,undefined,'only one equipped Mega');
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
console.log(`Mega verification passed: ${mega.catalog.length} genuine forms, all icon/front/back/shiny/still assets, unlock/equip/unequip, type/stat hooks, one equipped, HP and save compatibility.`);
