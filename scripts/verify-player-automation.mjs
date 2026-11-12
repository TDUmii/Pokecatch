import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const state = {trainer: {}, items: {'razz-berry': 4, 'exp-candy-s': 3}, team: ['pika'], stats: {}};
let berryUses = 0, candyUses = 0;
const context = vm.createContext({
  Date, document: {hidden: false}, window: null,
  UmiArcade: {transact: action => action()},
  __setInternalPoke: null
});
context.window = context;
vm.runInContext(readFileSync(new URL('../bundle/player-automation.js', import.meta.url), 'utf8'), context);
const game = {
  S: state, ITEM_NAMES: {'razz-berry': 'Quả Razz', 'exp-candy-s': 'Kẹo EXP S'},
  CONFIG: {BUFF_BERRIES: {'razz-berry': {family: 'capture'}}, EXP_CANDIES: {'exp-candy-s': {xp: 1000}}},
  DEX: {25: {name: 'Pikachu'}}, teamMons: () => [{uid: 'pika', id: 25, level: 10}], itemCount: id => state.items[id] || 0,
  activeBuffs: () => [], useBuffBerry: id => { state.items[id]--; berryUses++; return {key: id}; },
  useItem: (uid, id) => { state.items[id]--; candyUses++; return {amount: 1000}; }, save() {},
  time: () => Date.now()
};
context.__setInternalPoke({Game: game, CONFIG: game.CONFIG, ITEM_NAMES: game.ITEM_NAMES, App: {current: 'adventure'}, Adventure: {state: {paused: false}}, TabLock: {lost: false}, UI: {itemName: id => game.ITEM_NAMES[id], itemSrc: id => `assets/items/${id}.png`, monSrc: id => `assets/pokemon/${id}.png`}});
const api = context.UmiPlayerAutomation;
assert.equal(api.configure('berry:razz-berry', {enabled: true, reserve: 2}).ok, true);
assert.equal(api.configure('candy:exp-candy-s', {enabled: true, reserve: 1}).ok, true);
assert.equal(api.selectTarget('pika').ok, true);
assert.equal(api.tick().ok, true);
assert.equal(berryUses, 1);
assert.equal(candyUses, 1);
assert.equal(state.items['razz-berry'], 3);
assert.equal(state.items['exp-candy-s'], 2);
assert.equal(api.tick(), null, 'cadence prevents repeated use');
console.log('Player automation passed: opt-in rules, reserve stock, team target and cadence.');
