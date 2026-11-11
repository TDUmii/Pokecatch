import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../bundle/guide-rules.js', import.meta.url), 'utf8');
function fixture() {
  const types = Object.fromEntries(['normal','fire','water','grass','electric','ground','rock','flying'].map(type => [type,{fr:type,color:'#abc'}]));
  const chart = {fire:{water:.5,grass:2},water:{fire:2,ground:2,rock:2},electric:{water:2,ground:0},grass:{water:2,ground:2,rock:2},ground:{flying:0}};
  const dex = {
    1:{id:1,name:'Grass',types:['grass'],stats:{hp:50,atk:50,def:50,spa:60,spd:50,spe:40},learn:[[1,'leaf']]},
    2:{id:2,name:'Fire',types:['fire'],stats:{hp:50,atk:50,def:50,spa:60,spd:50,spe:40},learn:[[1,'flame']]},
    3:{id:3,name:'Rock boss',types:['rock','ground'],stats:{},learn:[]},
    4:{id:4,name:'Water',types:['water'],stats:{hp:50,atk:50,def:50,spa:60,spd:50,spe:40},learn:[[1,'water']]},
    5:{id:5,name:'Later legend',types:['water'],legendary:true,stats:{},learn:[]}
  };
  const state = {adv:{chapter:0,unlocked:0},mons:[{uid:'a',id:1,level:12,hp:0},{uid:'b',id:2,level:8,hp:10},{uid:'a',id:1,level:12,hp:0}]};
  const game = {S:state,DEX:dex,levelCap:()=>10,statsOf:mon=>dex[mon.id].stats,learnOf:mon=>dex[mon.id].learn,curHp:mon=>mon.hp,can:()=>null};
  const engine = {Game:game,TYPES:types,TYPE_CHART:chart,MOVES:{leaf:{name:'Leaf',type:'grass',cat:'spec',power:60,acc:100},flame:{name:'Flame',type:'fire',cat:'spec',power:60,acc:100},water:{name:'Water',type:'water',cat:'spec',power:60,acc:100}},CONFIG:{MOVE_BLACKLIST:[]},_t:x=>x,
    STORY:{CHAPTERS:[{name:'First',steps:[{kind:'route',name:'Road',areas:['road'],wild:1,trainers:1,lv:[3,5]},{kind:'gym',name:'Gym',leader:'Boss',team:[[3,10]]}]},{name:'Locked',steps:[{kind:'route',name:'Later',areas:['later'],wild:1,lv:[40,50]}]}],regionOf:()=>({key:'kanto',name:'Kanto'}),regionUnlocked:()=>true,gymTeam:(ch,step)=>step.team},
    Adventure:{effectiveness:(type,defenders)=>defenders.reduce((n,defender)=>n*(chart[type]?.[defender]??1),1),zonePool:node=>node.areas[0]==='road'?[{id:4,min:3,max:5,pct:1,on:true}]:[{id:5,min:40,max:50,pct:1,on:true}]}};
  const context = vm.createContext({console}); vm.runInContext(source,context);const api=context.UmiGuideRules;api.install(engine);return {api,engine,state};
}
{
 const {api,engine,state}=fixture(), before=JSON.stringify(state);
 assert.equal(api.matchup('fire',['water']),.5);assert.equal(api.matchup('water',['fire']),2);
 assert.equal(api.matchup('electric',['water','ground']),0);assert.equal(api.matchup('water',['rock','ground']),4);
 assert.equal(api.matchup('unknown',['fire']),null);assert.equal(api.matchup('water',[]),null);
 assert.equal(api.typeInfo('ground',{defender2:'water'}).defending.find(x=>x.type==='electric').multiplier,0);
 const result=api.snapshot('0');assert.equal(result.selected.name,'First');assert.equal(result.maps[1].locked,true);
 assert.equal(result.threats.find(x=>x.kind==='boss').weight,3);assert.equal(result.threats.find(x=>x.kind==='wild').weight,3);
 assert.equal(result.owned[0].id,1);assert.equal(result.owned[0].fainted,true);assert.equal(result.owned[0].effectiveLevel,10);assert.ok(result.owned[0].note);
 assert.equal(new Set(result.owned.map(x=>x.uid)).size,result.owned.length);assert.equal(result.owned.length,2);
 assert.equal(result.alternatives[0].id,4);assert.ok(result.alternatives[0].source.includes('Road'));assert.ok(!result.alternatives.some(x=>x.id===5));
 assert.equal(JSON.stringify(state),before,'guide must not write progress, team, HP or wallet');
 const native=engine.Adventure.effectiveness;engine.Adventure.effectiveness=()=>.123;assert.equal(api.matchup('water',['fire']),.123,'native battle multiplier wins');engine.Adventure.effectiveness=native;
 engine.STORY.CHAPTERS=[];const empty=api.snapshot();assert.equal(empty.owned.length,0);assert.equal(empty.threats.length,0);assert.equal(empty.selected,null);
}
{
 const {api,engine}=fixture();engine.Game.S.mons=[];engine.STORY.CHAPTERS[0].steps=[];const result=api.snapshot('bogus');assert.equal(result.owned.length,0);assert.equal(result.alternatives.length,0);assert.ok(result.notes.some(note=>note.includes('chưa có dữ liệu')));
}
console.log('Guide rules passed: native type chart, immunity, dual types, boss weights, owned team uniqueness, caps, alternatives and read-only state.');
