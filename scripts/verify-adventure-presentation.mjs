import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const context = vm.createContext({ console: { error() {} } });
vm.runInContext(fs.readFileSync(new URL('bundle/adventure-speed.js', root), 'utf8'), context);
const api = context.UmiAdventureSpeed;
const normal = [{ type: 'battleStart', kind: 'wild', enemy: { id: 16 } }, { type: 'attack' }];
const base = { speed: 20, visible: true, blocked: false, actionMs: 2800 };
assert(api.canCompact(normal, base));
for (const override of [{ speed: 1 }, { speed: 2 }, { speed: 2.5 }, { visible: false }, { blocked: true }]) assert(!api.canCompact(normal, { ...base, ...override }));
for (const event of [
  { type: 'gift' }, { type: 'waiting' }, { type: 'riddle' }, { type: 'riddleWait' },
  { type: 'chapterEnd' }, { type: 'eventWon' }, { type: 'towerEnd' }, { type: 'unknown' },
  { type: 'xp', evolve: { uid: 'mon', to: 2 } }, { type: 'buddyCandy', fed: [{ evolve: { uid: 'mon', to: 2 } }] },
  { type: 'battleStart', kind: 'gym', gym: {} }, { type: 'battleStart', kind: 'wild', enemy: { shiny: true } },
  { type: 'capture', success: true, isNew: true }, { type: 'capture', enemy: { shiny: true } },
  { type: 'capture', raid: true }, { type: 'victory', kind: 'gym', badge: {} }
]) assert(!api.canCompact([event], base), `Must keep original player/milestone handling: ${JSON.stringify(event)}`);
assert(api.canCompact([{ type: 'capture', success: true, candy: {} }, { type: 'xp' }], base));
async function sample(speed) {
  let clock = 0, renders = 0;
  const events = [{ type: 'attack' }], input = JSON.stringify(events);
  api.reset();
  const options = { ...base, speed, now: () => clock, sleep: async ms => { clock += ms; }, render(values) { assert.equal(values, events); renders++; clock += 5; } };
  for (let index = 0; index < 101; index++) assert(await api.present(events, options));
  assert.equal(renders, 101, 'One presentation per existing native step, never another gameplay step');
  assert.equal(JSON.stringify(events), input, 'Do not mutate captured combat outcomes');
  return clock - 5;
}
assert.equal(await sample(10), 28000);
assert.equal(await sample(20), 14000);
assert.equal(await api.present(normal, { ...base, blocked: true }), false);
api.reset();
assert.equal(await api.present(normal, { ...base, now: () => 0, render() { throw Error('render failed'); } }), true, 'Do not replay side effects after presentation has started');
let changedRender = false;
assert.equal(await api.present(normal, { ...base, now: () => 0, current: () => ({ blocked: true }), render() { changedRender = true; } }), false);
assert.equal(changedRender, false, 'Recheck a newly opened modal before presenting');
const app = fs.readFileSync(new URL('bundle/app.f9da276408.js', root), 'utf8');
assert.equal(app.split('__umiAdventurePresentFrame?.(mt,').length, 2, 'Exactly one native presentation bridge');
assert(fs.readFileSync(new URL('index.html', root), 'utf8').includes('bundle/adventure-speed.js'));
console.log('Adventure presentation passed: native-step cadence, ×10/×20 ratio, protected prompts/captures/milestones, original low speeds and render fallback.');
