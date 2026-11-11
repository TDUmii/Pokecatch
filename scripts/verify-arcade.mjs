import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../bundle/umi-arcade-rules.js', import.meta.url), 'utf8'), context);
const rules = context.UmiArcadeRules;
const clone = value => JSON.parse(JSON.stringify(value));
const rng = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
assert.equal(Object.keys(rules.ITEMS).length, 12);
assert.equal(rules.RARITIES.reduce((sum, rarity) => sum + rarity.weight, 0), 100);
assert.deepEqual(clone(rules.RARITIES.map(rarity => rarity.weight)), [50, 30, 15, 4, 1]);
for (const item of Object.values(rules.ITEMS)) {
  assert(item.name && item.desc && item.icon.startsWith('assets/umi/'));
  assert(item.scrap > 0 && item.cost > item.scrap);
}
const old = { extraAdapterField: { test: true }, total: Infinity, pity: { supply: { rare: 900, epic: -10 }, evolution: { rare: NaN, epic: 1e20 } }, history: [{ machineId: 'unknown', tier: 0 }, { machineId: 'constructor', tier: 0 }], bonus: ['pokemon', 'bad', '__proto__'] };
const normalized = rules.normalize(old);
assert.equal(normalized.extraAdapterField, old.extraAdapterField);
assert.equal(normalized.total, 0);
assert.equal(normalized.pity.supply.rare, 9);
assert.equal(normalized.pity.supply.epic, 0);
assert.equal(normalized.pity.evolution.epic, 49);
assert.equal(normalized.pity.evolution.rare, 0);
assert.equal(normalized.history.length, 0);
assert.equal(normalized.bonus.length, 1);
assert.equal(rules.normalize(null).total, 0);
for (const id of Object.keys(rules.MACHINES)) {
  const state = rules.fresh();
  for (let i = 1; i <= 50; i++) {
    const result = rules.spin(state, id, { random: () => 0.4, bonus: i % 2 === 0 });
    if (i % 50 === 0) assert(result.tier >= 3, 'Epic guarantee failed');
    else if (i % 10 === 0) assert(result.tier >= 2, 'Rare guarantee failed');
    else assert.equal(result.tier, 0);
    for (const other of Object.keys(rules.MACHINES).filter(other => other !== id)) assert.deepEqual(clone(state.pity[other]), { rare: 0, epic: 0 });
  }
}
const boundaries = [[0, 0], [.49999, 0], [.5, 1], [.79999, 1], [.8, 2], [.94999, 2], [.95, 3], [.98999, 3], [.99, 4], [.99999, 4]];
for (const [roll, expected] of boundaries) assert.equal(rules.spin(rules.fresh(), 'supply', { random: () => roll }).tier, expected);
function sequence(...values) { return () => values.shift(); }
let result = rules.spin(rules.fresh(), 'pokemon', { random: sequence(.85, 0, .1) });
assert.equal(result.bonusSpins, 5);
assert.equal(result.multiplier, 1);
result = rules.spin(rules.fresh(), 'pokemon', { bonus: true, random: sequence(.85, 0, .09) });
assert.equal(result.bonusSpins, 0);
assert.equal(result.multiplier, 2);
assert.equal(result.rewards[0].qty, 2);
result = rules.spin(rules.fresh(), 'supply', { bonus: true, random: sequence(.1, 0, .09) });
assert.equal(result.rewards[0].amount, 1000);
assert.equal(rules.spin(rules.fresh(), 'supply', { bonus: true, random: sequence(.1, 0, .1) }).multiplier, 1);
for (const id of Object.keys(rules.MACHINES)) {
  const state = rules.fresh(), random = rng(12345);
  const replay = rules.fresh(), replayRandom = rng(12345);
  for (let i = 0; i < 1000; i++) {
    const result = rules.spin(state, id, { random, bonus: i % 3 === 0 });
    assert.deepEqual(clone(result), clone(rules.spin(replay, id, { random: replayRandom, bonus: i % 3 === 0 })));
    assert(result.rewards.length > 0);
    for (const reward of result.rewards) assert(reward.kind === 'item' ? reward.qty > 0 && typeof reward.id === 'string' : reward.kind === 'money' && reward.amount > 0);
    if (i % 3 === 0) assert.equal(result.bonusSpins, 0);
  }
  assert.equal(state.total, 1000);
  assert.equal(state.history.length, 100);
}
const untouched = rules.fresh(), before = JSON.stringify(untouched);
assert.throws(() => rules.spin(untouched, 'bad'));
assert.throws(() => rules.spin(untouched, 'supply', { random: () => NaN }));
assert.equal(JSON.stringify(untouched), before);
assert(!rules.POOLS.pokemon.flat().some(reward => reward.id === 'umi-spin-ticket'), 'Ticket machine must not guarantee replacement tickets');
console.log('Arcade rules passed: seeded replay, weighted boundaries, all-spin rewards, rare/epic guarantees, isolation, old saves, bonus limits and bounded history.');
