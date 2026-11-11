import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..', 'dist');
const window = {};
for (const file of ['bundle/lang-en.f8b9cef2e1.js', 'bundle/lang-vi.js']) {
  vm.runInNewContext(await readFile(resolve(root, file), 'utf8'), { window });
}
const { en, vi } = window.I18N;
const placeholders = value => (value.match(/\{\w+\}/g) || []).sort().join('|');
for (const [key, value] of Object.entries(vi)) {
  assert(typeof value === 'string' && value.trim(), `Empty Vietnamese translation: ${key}`);
  assert.equal(placeholders(value), placeholders(en[key] || key), `Translation lost a variable: ${key}`);
}
for (const key of Object.keys(en)) assert(Object.hasOwn(vi, key), `English fallback remains: ${key}`);
for (const word of ['Normal','Feu','Eau','Plante','Électrik','Glace','Combat','Poison','Sol','Vol','Psy','Insecte','Roche','Spectre','Dragon','Ténèbres','Acier','Fée']) {
  assert(/[À-ỹ]|^(Ma|Bay)$/.test(vi[`${word} (type)`]), `Untranslated type: ${word}`);
}
assert.equal(vi['Étape {at} / {n}'], 'Bước {at} / {n}');
assert.equal(vi.NEW, 'MỚI');
assert.equal(vi.Changelogs, 'Nhật ký cập nhật');
assert.equal(vi['Prof. Chen'], 'Giáo sư Oak');
const originalPokemon = window.I18N_DATA.en.pokemon;
const pokemon = window.I18N_DATA.vi.pokemon;
assert.equal(Object.keys(pokemon).length, Object.keys(originalPokemon).length);
for (const [id, source] of Object.entries(originalPokemon)) {
  const translated = pokemon[id];
  assert.equal(translated[0], source[0], `Pokémon name changed: ${id}`);
  assert(/[À-ỹ]/.test(translated[1]), `Untranslated Pokémon category: ${id}`);
  assert(/[À-ỹ]/.test(translated[2]) && translated[2] !== source[2], `Untranslated Pokédex description: ${id}`);
}
const app = await readFile(resolve(root, 'bundle/app.f9da276408.js'), 'utf8');
const start = app.indexOf('t.CHANGELOG=') + 't.CHANGELOG='.length;
const end = app.indexOf(',t.Changelog=', start);
const originals = vm.runInNewContext(`(${app.slice(start, end)})`);
assert.equal(Object.keys(window.POKE_VI_CHANGELOG).length, originals.length);
const sections = md => (md.match(/^## /gm) || []).length;
const bullets = md => (md.match(/^[•-] /gm) || []).length;
for (const original of originals) {
  const source = original.en || original;
  const translated = window.POKE_VI_CHANGELOG[`${original.date}|${source.title}`];
  assert(translated?.title && translated.md, `Missing release note: ${original.date} ${source.title}`);
  assert.equal(sections(translated.md), sections(source.md), `Release-note section omitted: ${source.title}`);
  assert.equal(bullets(translated.md), bullets(source.md), `Release-note bullet omitted: ${source.title}`);
  assert(/[À-ỹ]/.test(translated.md), `Untranslated release note: ${source.title}`);
}
assert(!/>NEW<\/span>|>Changelogs<\/b>/.test(app), 'Hardcoded English UI badge remains');
assert(app.includes('window.POKE_VI_CHANGELOG?.['), 'Translated release notes are not connected');
assert(app.includes('w.pokemon?.[t.FORMS?.baseOf(Je.id)]'), 'Alternate forms do not inherit localized Pokédex text');
assert((await readFile(resolve(root, 'intros/legend-intros.html'), 'utf8')).includes('const POKE_INTRO_VI ='), 'Intro translation is not connected');
console.log(`Verified Vietnamese: ${Object.keys(vi).length} UI messages, ${Object.keys(pokemon).length} Pokédex entries, ${originals.length} complete release notes; names and every interpolation variable retained.`);
