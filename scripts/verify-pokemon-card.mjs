import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../bundle/pokemon-card.js', import.meta.url), 'utf8'), context);
const position = context.UmiPokemonCard.position;
for (const viewport of [{ width: 320, height: 740 }, { width: 1366, height: 900 }]) {
  for (const anchor of [{ left: 0, top: 5, bottom: 49, width: 44 }, { left: viewport.width - 44, top: viewport.height - 49, bottom: viewport.height - 5, width: 44 }]) {
    const size = { width: Math.min(280, viewport.width - 24), height: 100 };
    const point = position(anchor, size, viewport);
    assert(point.left >= 12 && point.left + size.width <= viewport.width - 12);
    assert(point.top >= 12 && point.top + size.height <= viewport.height - 12);
  }
}
console.log('Pokémon card tooltip bounds passed at 320px and 1366px.');
