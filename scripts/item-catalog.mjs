import vm from 'node:vm';

// Read both item-table assignments; later additions include candy, fossils and berries.
export function itemCatalog(source) {
  const between = (start, end) => {
    const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
    if (a < 0 || b < 0) throw new Error(`Item data boundary changed: ${start}`);
    return source.slice(a + start.length, b);
  };
  const config = vm.runInNewContext(`(${between('t.CONFIG=', ',t.ITEM_NAMES=Object.assign')})`, { t: {}, e: text => text }, { timeout: 2000 });
  const initial = source.indexOf('t.ITEM_NAMES={') + 't.ITEM_NAMES='.length;
  if (initial < 't.ITEM_NAMES='.length) throw new Error('Initial item data is missing');
  const t = { CONFIG: config, ITEM_NAMES: vm.runInNewContext(`(${source.slice(initial, source.indexOf('}', initial) + 1)})`) };
  vm.runInNewContext(`t.ITEM_NAMES=Object.assign${between('t.ITEM_NAMES=Object.assign', ',t.TYPES=')}`, { t }, { timeout: 2000 });
  return Object.entries(t.ITEM_NAMES).map(([id, name]) => ({
    id, name,
    path: config.PENSION.BERRIES[id]?.src || (id === 'link-cable' ? 'assets/ui/link-cable.svg' : id === 'coin' ? 'assets/ui/coin-case.png' : `assets/items/${id}.png`)
  }));
}
