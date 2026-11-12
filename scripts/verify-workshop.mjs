import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

let now = 100000, failedSave = false;
let S = {
  trainer: 'Trainer', money: 30000,
  items: {'poke-ball': 30, 'exp-candy-s': 3, 'exp-candy-m': 4},
  mons: [
    {id: 25, uid: 'pc-electric', level: 5},
    {id: 4, uid: 'team-fire', level: 7},
    {id: 1, uid: 'pc-grass', level: 8}
  ],
  team: ['team-fire']
};
const engine = {
  Game: {
    S, DEX: {
      25: {name: 'Pikachu', types: ['electric']},
      4: {name: 'Charmander', types: ['fire']},
      1: {name: 'Bulbasaur', types: ['grass', 'poison']}
    },
    save() { if (failedSave) throw new Error('disk full'); },
    spend(money) { this.S.money -= money; return money; },
    itemCount(id) { return this.S.items[id] || 0; },
    addItem(id, count) { this.S.items[id] = this.itemCount(id) + count; }
  },
  TabLock: {lost: false}
};
const context = vm.createContext({
  Date: {now: () => now}, console, setInterval() {},
  UmiCasinoRewards: {install() {}}, UmiCasinoUI: {install() {}}
});
context.window = context;
function load(file) {
  vm.runInContext(readFileSync(new URL(`../bundle/${file}`, import.meta.url), 'utf8'), context);
}
load('umi-arcade-rules.js');
load('umi-mega.js');
load('umi-arcade.js');
load('workshop.js');
const {UmiArcade, UmiWorkshop: workshop} = context.window;
UmiArcade.install(engine);
workshop.install(engine);
const {status, start, claim, selectBranch, detector, consumeIncubation} = workshop;
const success = result => assert.equal(result.ok, true, result.message);
assert.equal(S.umiWorkshop, undefined, 'status leaves an old save untouched');
assert.equal(status().recipes[0].helpers.map(helper => helper.id).join(','), 'pc-electric,pc-grass');
assert.equal(start('detector', 'team-fire').ok, false);
failedSave = true;
const before = JSON.stringify(S);
assert.equal(start('detector', 'pc-electric').ok, false);
assert.equal(JSON.stringify(S), before, 'a failed save rolls back both job and costs');
failedSave = false;
success(start('detector', 'pc-electric'));
assert.equal(S.money, 27500);
assert.equal(S.items['poke-ball'], 25);
assert.equal(status().job.remainingMs, 45000, 'matching type cuts duration by 25%');
assert.equal(start('berryBox', 'pc-grass').ok, false);
assert.equal(claim().ok, false);
assert.equal(S.mons.length, 3);
S.team.push('pc-electric');
S = engine.Game.S = JSON.parse(JSON.stringify(S));
now += 45000;
assert.equal(status().job.ready, true, 'job completes after reload and helper can rejoin team');
failedSave = true;
assert.equal(claim().ok, false);
assert.equal(status().job.ready, true, 'failed claim preserves the completed job');
assert.equal(detector(), null);
failedSave = false;
success(claim());
assert.equal(claim().ok, false, 'claim cannot be repeated');
assert.equal(detector().level, 1);
assert.equal(detector().branch, null);
success(selectBranch('detector', 'species'));
success(start('detector', 'pc-grass'));
assert.equal(status().job.remainingMs, 80000, 'other PC types can help without a speed bonus');
now += 80000;
success(claim());
assert.equal(detector().level, 2);
assert.equal(detector().branch, 'species');
success(selectBranch('detector', 'materials'));
success(start('detector', 'pc-grass'));
now += 90000;
success(claim());
assert.equal(detector().level, 3);
assert.equal(detector().branch, 'materials');
assert.equal(start('detector', 'pc-grass').ok, false);
success(start('incubator', 'pc-grass'));
now += 60000;
success(claim());
assert.equal(status().incubationCharges, 1);
assert.equal(consumeIncubation(), true);
assert.equal(consumeIncubation(), false);
engine.TabLock.lost = true;
assert.equal(start('berryBox', 'pc-grass').ok, false);
engine.TabLock.lost = false;
success(start('berryBox', 'pc-grass'));
now += 45000;
success(claim());
assert.equal(S.items['razz-berry'], 3);
assert.equal(S.items['pinap-berry'], 2);
console.log('Workshop verification passed: eligible helpers, real costs, atomic rollback, offline timer, one claim, detector branches and upgrades, and both consumables.');
