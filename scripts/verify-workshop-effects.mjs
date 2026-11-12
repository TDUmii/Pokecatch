import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

let roll = .3;
let detector = {level: 1, branch: 'species'};
const route = {type: 'wild', name: 'Đường 1', ch: 0};
const other = {...route, name: 'Đường 2'};
const state = {
  adv: {chapter: 0, unlocked: 0, nodes: [route, other]},
  dex: {}, stats: {wins: 0}, items: {},
  umiWorkshop: {incubationCharges: 1},
  pension: {eggs: [{uid: 'abc', id: 25, hatchAt: 3000}]}
};
const game = {
  S: state, DEX: {25: {name: 'Pikachu'}, 16: {name: 'Pidgey'}},
  isLegend: id => id === 151, minLevelFor: () => 1, levelCap: () => 20,
  time: () => 1000, eggReady: egg => egg.hatchAt <= 1000,
  addItem(id, qty) { state.items[id] = (state.items[id] || 0) + qty; }
};
let usePass = false;
const context = vm.createContext({
  Math: Object.assign(Object.create(Math), {random: () => roll}),
  UmiArcade: {transact: action => action()},
  UmiWorkshop: {
    install() {}, detector: () => detector,
    consumeIncubation: () => state.umiWorkshop.incubationCharges-- > 0
  },
  __umiArcadeEncounter(id) { return usePass ? 16 : id; }
});
context.window = context;
vm.runInContext(readFileSync(new URL('../bundle/workshop-effects.js', import.meta.url), 'utf8'), context);
context.__setInternalPoke({
  Game: game,
  UI: {monSrc: id => `assets/pokemon/${id}.png`},
  Adventure: {zonePool: node => [{id: node.name === route.name ? 25 : 16, min: 2, max: 5, on: true, pct: 1}]}
});
const effects = context.UmiWorkshopEffects;
assert.equal(effects.targets().length, 2);
effects.startHunt(25);
assert.equal(context.__umiArcadeEncounter(16, other, 3), 16, 'no off-route replacement');
assert.equal(context.__umiArcadeEncounter(16, route, 6), 16, 'no out-of-range replacement');
assert.equal(effects.hunt().remaining, 30);
roll = .8;
assert.equal(context.__umiArcadeEncounter(16, route, 3), 16);
assert.equal(effects.hunt().remaining, 29);
roll = .3;
usePass = true;
assert.equal(context.__umiArcadeEncounter(25, route, 3), 16, 'a separate pass takes precedence');
assert.equal(effects.hunt().remaining, 29);
usePass = false;
assert.equal(context.__umiArcadeEncounter(16, route, 3), 25);
assert.equal(effects.hunt(), null, 'tracking ends on an encounter');

detector = {level: 3, branch: 'materials'};
const wild = {kind: 'wild'};
for (let i = 0; i < 4; i++) context.__umiWorkshopWildWin(route, true, wild);
context.__umiWorkshopWildWin(route, false, {...wild, roam: true});
context.__umiWorkshopWildWin(route, false, {...wild, enemies: [{id: 151}]});
context.__umiWorkshopWildWin(route, false, {kind: 'static'});
assert.equal(effects.materialProgress().wins, 0);
for (let i = 0; i < 9; i++) context.__umiWorkshopWildWin(route, false, wild);
assert.equal(state.items['exp-candy-m'], 3);
assert.equal(state.items['rare-candy'], 1);

assert.equal(effects.eggs()[0].remaining, 2000);
effects.warmEgg('pension:abc');
assert.equal(state.pension.eggs[0].hatchAt, 2000);
assert.equal(state.umiWorkshop.incubationCharges, 0);
assert.throws(() => effects.warmEgg('pension:abc'), /đã dùng/);
assert.equal(state.umiWorkshop.incubationCharges, 0);
console.log('Workshop effects passed: route and level gating, pass priority, material rewards, single-use incubation.');
