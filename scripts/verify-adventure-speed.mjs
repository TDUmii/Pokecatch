import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, 'bundle/app.f9da276408.js'), 'utf8');
const boot = fs.readFileSync(path.join(root, 'boot.js'), 'utf8');
const config = source.match(/SPEEDS:(\[[^\]]+\]),SPEED_PACE:(\{[^}]+\})/);
assert.ok(config, 'native speed configuration');
const a = vm.runInNewContext(`({SPEEDS:${config[1]},SPEED_PACE:${config[2]}})`);
a.ACTION_MS = Number(source.match(/ACTION_MS:(\d+)/)[1]);
assert.ok(a.SPEEDS.includes(20), 'native button whitelist accepts ×20');
assert.equal(a.SPEED_PACE[20], 20, '×20 uses genuine simulation pace');
assert.ok(boot.includes('data-speed="20"'), '×20 is selectable');

const paceStart = source.indexOf('const Kt=!1,da=i=>a.SPEED_PACE');
const paceEnd = source.indexOf('function za(i)', paceStart);
assert.ok(paceStart >= 0 && paceEnd > paceStart, 'native pace resolver');
const paceSource = source.slice(paceStart, paceEnd);
const interval = source.match(/Nt=a\.ACTION_MS\/Pa\(f\);/);
const loopStart = source.indexOf('function*At(Sn,yn)', interval?.index);
const loopEnd = source.indexOf('function*ba()', loopStart);
assert.ok(interval && loopStart > interval.index && loopEnd > loopStart, 'native fast-forward loop');
const loopSource = source.slice(loopStart, loopEnd);

// Execute the shipped generator, replacing only world effects with counters.
function run(speed, duration = 28000) {
  const f = JSON.parse(JSON.stringify({ speed }));
  const context = { a, f, de: () => f, i: duration, wt: duration, Ie: 0,
    D: { steps: 0 }, zt() {}, za() {}, Ct() {}, ks: () => [] };
  vm.runInNewContext(`${paceSource}const ${interval[0]}${loopSource}
    globalThis.pace=Pa(f);globalThis.interval=Nt;for(const ignored of At(()=>true,Infinity)) {}`, context);
  return { pace: context.pace, interval: context.interval, steps: context.D.steps };
}
const ten = run(10), twenty = run(20);
assert.equal(ten.interval, 280);
assert.equal(twenty.interval, 140);
assert.equal(twenty.steps, ten.steps * 2, 'same elapsed time executes twice the real steps at ×20');
assert.equal(run(19).pace, 10, 'unsupported saved speed falls back to permitted lower speed');
assert.equal(run(99).pace, 20, 'unsupported high saved speed is capped by whitelist');
assert.equal(run(0).pace, 1, 'invalid zero speed safely defaults');
assert.equal(run(4).pace, 2.5, 'existing ×3 legacy pace is preserved');
console.log('Adventure speed verified:', JSON.stringify({ ten, twenty }));
