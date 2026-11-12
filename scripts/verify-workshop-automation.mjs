import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const state = {
  trainer: {}, adv: {chapter: 0, unlocked: 0, nodes: []}, dex: {}, items: {'berry-oran': 3},
  umiWorkshop: {incubationCharges: 0}, pension: {mons: [{mon: {id: 25}}], eggs: [], egg: 0, tick: 1000}
};
const context = vm.createContext({Date, window: null, UmiArcade: {transact: action => action()}});
context.window = context;
const game = {
  S: state, DEX: {25: {name: 'Pikachu'}}, CONFIG: {PENSION: {BERRIES: {'berry-oran': {name: 'Quả Oran', minutes: 5}}}},
  ITEM_NAMES: {'berry-oran': 'Quả Oran'}, UI: {itemName: id => game.ITEM_NAMES[id], monSrc: () => 'assets/pokemon/25.png'},
  isLegend: () => false, minLevelFor: () => 1, levelCap: () => 20, time: () => 1000,
  pensionUnlocked: () => true, pensionHasDitto: () => true, pensionEggGoal: () => 600000, penOpen: () => 2,
  eggReady: egg => egg.hatchAt <= 1000, itemCount: id => state.items[id] || 0,
  usePensionBerry: id => { state.items[id]--; return {gained: 300000}; }, save() {},
  addItem() {}
};
context.UmiWorkshop = {
  install() {}, detector: () => null,
  consumeIncubation: () => state.umiWorkshop.incubationCharges-- > 0
};
vm.runInContext(readFileSync(new URL('../bundle/workshop-effects.js', import.meta.url), 'utf8'), context);
context.__setInternalPoke({Game: game, CONFIG: game.CONFIG, UI: game.UI,
  Adventure: {zonePool: () => []}});
const effects = context.UmiWorkshopEffects;
assert.equal(effects.autoStatus().feed, false);
assert.equal(effects.setAuto('feed', true).ok, true);
assert.equal(effects.tickAuto().fed, true);
assert.equal(state.items['berry-oran'], 2);
assert.equal(effects.autoStatus().lastFeed, 'Quả Oran');
state.pension.eggs.push({uid: 'egg', id: 25, hatchAt: 101000});
state.umiWorkshop.incubationCharges = 1;
assert.equal(effects.setAuto('warm', true).ok, true);
assert.equal(effects.tickAuto().warmed, true);
assert.equal(state.pension.eggs[0].hatchAt, 51000);
assert.equal(state.umiWorkshop.incubationCharges, 0);
console.log('Workshop automation passed: opt-in nursery feeding, reserve-safe berry use and automatic egg warming.');
