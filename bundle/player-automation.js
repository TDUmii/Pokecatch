/* Opt-in consumable helpers. Native item effects stay in the game engine. */
(() => {
  'use strict';

  const CANDY_ORDER = ['exp-candy-s', 'exp-candy-m', 'exp-candy-xl', 'exp-candy-big', 'rare-candy'];
  let engine;
  let busy = false;
  const game = () => engine?.Game;
  const save = () => game()?.S;
  const config = () => save()?.umiPlayerAutomation;
  const integer = (value, fallback = 0) => Number.isSafeInteger(value) && value >= 0 ? value : fallback;
  const itemName = id => engine?.UI?.itemName?.(id) || engine?.ITEM_NAMES?.[id] || id;
  const itemIcon = id => engine?.UI?.itemSrc?.(id) || `assets/items/${id}.png`;
  const itemExists = id => !!engine?.ITEM_NAMES?.[id] || !!engine?.CONFIG?.EXP_CANDIES?.[id] ||
    !!engine?.CONFIG?.BUFF_BERRIES?.[id];

  function writable() {
    const state = save();
    if (!state.umiPlayerAutomation || typeof state.umiPlayerAutomation !== 'object' ||
        Array.isArray(state.umiPlayerAutomation)) state.umiPlayerAutomation = {};
    const result = state.umiPlayerAutomation;
    if (!result.rules || typeof result.rules !== 'object' || Array.isArray(result.rules)) result.rules = {};
    return result;
  }

  function catalogue() {
    const berries = Object.keys(engine?.CONFIG?.BUFF_BERRIES || {});
    const candies = CANDY_ORDER.filter(itemExists);
    return [
      ...berries.map(itemId => ({id: `berry:${itemId}`, itemId, kind: 'berry', label: itemName(itemId),
        description: 'Dùng khi hiệu ứng cùng nhóm đã hết.', icon: itemIcon(itemId)})),
      ...candies.map(itemId => ({id: `candy:${itemId}`, itemId, kind: 'candy', label: itemName(itemId),
        description: 'Cho Pokémon đang trong đội, không tự đổi tiến hóa.', icon: itemIcon(itemId)}))
    ];
  }

  function ruleState(entry) {
    const stored = config()?.rules?.[entry.id] || {};
    return { ...entry, enabled: stored.enabled === true, reserve: integer(stored.reserve, 2),
      available: game()?.itemCount?.(entry.itemId) || 0 };
  }

  function targets() {
    const team = game()?.teamMons?.() || [];
    const mons = team.length ? team : (save()?.mons || []).filter(mon => save()?.team?.includes(mon.uid));
    return mons.map(mon => ({uid: mon.uid, id: mon.id, level: mon.level,
      name: game().DEX[mon.id]?.name || `Pokémon #${mon.id}`,
      icon: engine.UI?.monSrc?.(mon.id, !!mon.shiny) || `assets/pokemon/${mon.id}.png`}));
  }

  function status() {
    const stored = config() || {};
    return {ready: !!save()?.trainer, rules: catalogue().map(ruleState), targets: targets(),
      target: stored.target || '', lastAction: stored.lastAction || null};
  }

  function transact(action) {
    if (!engine || !save()?.trainer) return {ok: false, message: 'Hãy bắt đầu hành trình trước.'};
    if (!window.UmiArcade?.transact) return {ok: false, message: 'Tiện ích đang tải.'};
    try { return window.UmiArcade.transact(action); }
    catch (error) { return {ok: false, message: error.message}; }
  }

  function configure(id, values) {
    const entry = catalogue().find(item => item.id === id);
    if (!entry || !values || typeof values !== 'object') return {ok: false, message: 'Tùy chọn không hợp lệ.'};
    const enabled = values.enabled === true;
    const reserve = integer(values.reserve, 2);
    if (reserve > 99) return {ok: false, message: 'Số dự trữ phải từ 0 đến 99.'};
    return transact(() => {
      const state = writable();
      state.rules[id] = {enabled, reserve};
      return {ok: true, message: enabled ? `Đã bật tự dùng ${entry.label}.` : `Đã tắt tự dùng ${entry.label}.`};
    });
  }

  function selectTarget(uid) {
    if (uid && !targets().some(target => target.uid === uid)) return {ok: false, message: 'Pokémon này không còn trong đội.'};
    return transact(() => {
      writable().target = uid || '';
      return {ok: true, message: uid ? 'Đã chọn Pokémon nhận kẹo EXP.' : 'Đã bỏ chọn Pokémon nhận kẹo EXP.'};
    });
  }

  function activityReady() {
    const adventure = engine?.Adventure?.state;
    return !document.hidden && engine?.App?.current === 'adventure' && !engine.TabLock?.lost &&
      adventure && !adventure.paused && !adventure.battle && !adventure.zone && !adventure.event && !adventure.tower;
  }

  function activeFamilies() {
    return new Set((game().activeBuffs?.() || []).map(buff => buff.family));
  }

  function chooseBerry(state, now) {
    if (now - integer(state.lastBerryAt) < 15000) return null;
    const families = activeFamilies();
    return status().rules.find(rule => rule.kind === 'berry' && rule.enabled &&
      rule.available > rule.reserve && !families.has(engine.CONFIG.BUFF_BERRIES[rule.itemId].family)) || null;
  }

  function chooseCandy(state, now) {
    if (now - integer(state.lastCandyAt) < 30000) return null;
    const target = targets().find(item => item.uid === state.target);
    if (!target) return null;
    return CANDY_ORDER.map(itemId => status().rules.find(rule => rule.itemId === itemId && rule.kind === 'candy' && rule.enabled &&
      rule.available > rule.reserve)).find(Boolean) ? {target} : null;
  }

  function tick() {
    if (busy || !activityReady()) return null;
    const state = writable();
    const now = Date.now();
    const berry = chooseBerry(state, now);
    const candy = chooseCandy(state, now);
    if (!berry && !candy) return null;
    busy = true;
    try {
      return window.UmiArcade.transact(() => {
        const changed = [];
        if (berry) {
          const result = game().useBuffBerry(berry.itemId);
          if (result) { state.lastBerryAt = now; changed.push(berry.label); }
        }
        if (candy) {
          const rule = CANDY_ORDER.map(itemId => status().rules.find(entry => entry.itemId === itemId && entry.kind === 'candy' &&
            entry.enabled && entry.available > entry.reserve)).find(Boolean);
          const result = rule && game().useItem(candy.target.uid, rule.itemId);
          if (result) { state.lastCandyAt = now; changed.push(`${rule.label} cho ${candy.target.name}`); }
        }
        if (!changed.length) return {ok: false, message: 'Chưa có vật phẩm đủ điều kiện.'};
        state.lastAction = {label: changed.join(' · '), at: now};
        return {ok: true, message: `Đã tự dùng ${changed.join(' · ')}.`};
      });
    } finally { busy = false; }
  }

  window.UmiPlayerAutomation = {install(value) { engine = value; }, status, configure, selectTarget, tick};
  const previous = window.__setInternalPoke;
  window.__setInternalPoke = value => { previous?.(value); window.UmiPlayerAutomation.install(value); };
})();
