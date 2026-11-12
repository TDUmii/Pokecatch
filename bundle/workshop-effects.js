/* Field effects for Workshop gear. The engine owns combat, catching and hatching. */
(() => {
  'use strict';
  const HUNT_LIMIT = 30;
  const HUNT_CHANCE = [0.35, 0.5, 0.65];
  const MATERIAL_WINS = [6, 4, 3];
  let engine;
  const game = () => engine.Game;
  const save = () => game().S;
  const workshop = () => save().umiWorkshop;
  const detector = () => window.UmiWorkshop.detector();
  const translate = name => engine._t?.(name) || name;
  const huntChance = () => {
    const gear = detector();
    if (!gear || gear.branch === 'materials') return 0;
    return gear.branch === 'species' ? HUNT_CHANCE[gear.level - 1] : 0.2;
  };
  const ordinary = (adv, node) => adv && !adv.zone && !adv.event && !adv.tower &&
    node?.type === 'wild' && node.ch === adv.chapter && !node.event && !node.way && !node.special &&
    !node.dex && !node.veil?.length && !node.veilIds?.length;
  const isMissing = id => game().DEX[id] && !game().isLegend(id) && !save().dex?.[id] &&
    game().minLevelFor(id) <= game().levelCap();
  const pool = (node, chapter) => engine.Adventure.zonePool(node, chapter, false, null, true, true)
    .filter(entry => entry.on && entry.pct > 0);

  function targets() {
    const adv = save().adv;
    if (!huntChance() || !adv || adv.chapter > adv.unlocked) return [];
    const byId = new Map();
    for (const node of adv.nodes || []) {
      if (!ordinary(adv, node)) continue;
      for (const entry of pool(node, adv.chapter)) {
        if (!isMissing(entry.id)) continue;
        if (!byId.has(entry.id)) {
          byId.set(entry.id, {
            id: entry.id, name: game().DEX[entry.id].name, routes: [],
            icon: engine.UI.monSrc(entry.id, false)
          });
        }
        const routes = byId.get(entry.id).routes;
        const route = translate(node.name);
        if (!routes.includes(route)) routes.push(route);
      }
    }
    return [...byId.values()].sort((first, second) => first.id - second.id);
  }

  function hunt() {
    const tracking = workshop()?.hunt;
    if (!tracking || tracking.remaining <= 0 || !isMissing(tracking.id)) return null;
    return {
      id: tracking.id, name: game().DEX[tracking.id].name, remaining: tracking.remaining,
      paused: tracking.chapter !== save().adv?.chapter || !!(save().adv?.zone || save().adv?.event || save().adv?.tower),
      routes: tracking.routes
    };
  }

  function startHunt(id) {
    const target = targets().find(entry => entry.id === id);
    if (!target) throw new Error('Hãy chọn một loài chưa bắt trên tuyến đường của chương đang chơi.');
    if (hunt()) throw new Error('Dừng mục tiêu hiện tại trước khi chọn loài khác.');
    return window.UmiArcade.transact(() => {
      workshop().hunt = {id, chapter: save().adv.chapter, remaining: HUNT_LIMIT, routes: target.routes};
      return {ok: true, message: `Đang dò ${target.name}.`};
    });
  }

  function cancelHunt() {
    return window.UmiArcade.transact(() => {
      if (workshop()) delete workshop().hunt;
      return {ok: true, message: 'Đã dừng dò dấu vết.'};
    });
  }

  function encounter(original, node, level, random = Math.random) {
    const tracking = workshop()?.hunt;
    const chance = huntChance();
    const adv = save().adv;
    if (!tracking || !chance || tracking.chapter !== adv?.chapter || !ordinary(adv, node)) return original;
    if (!isMissing(tracking.id) || tracking.remaining <= 0) {
      delete workshop().hunt;
      return original;
    }
    const inRange = pool(node, adv.chapter).some(entry =>
      entry.id === tracking.id && level >= entry.min && level <= entry.max && level >= game().minLevelFor(entry.id)
    );
    if (!inRange) return original;
    if (original === tracking.id || random() < chance) {
      delete workshop().hunt;
      return tracking.id;
    }
    if (--tracking.remaining === 0) delete workshop().hunt;
    return original;
  }

  function materialProgress() {
    const gear = detector();
    if (gear?.branch !== 'materials') return null;
    return {
      wins: workshop()?.materialWins || 0, every: MATERIAL_WINS[gear.level - 1],
      lastReward: workshop()?.lastMaterialReward || ''
    };
  }

  function onWildWin(node, offline, battle) {
    if (offline || battle?.kind !== 'wild' || battle.roam || battle.boss ||
        battle.enemies?.some(mon => game().isLegend(mon.id)) || !ordinary(save().adv, node)) return;
    const progress = materialProgress();
    if (!progress) return;
    const state = workshop();
    state.materialWins = progress.wins + 1;
    if (state.materialWins < progress.every) return;
    state.materialWins = 0;
    state.materialFinds = (state.materialFinds || 0) + 1;
    const rare = state.materialFinds % 3 === 0;
    game().addItem('exp-candy-m', 1);
    if (rare) game().addItem('rare-candy', 1);
    state.lastMaterialReward = rare ? '1 Kẹo EXP M và 1 Kẹo Hiếm' : '1 Kẹo EXP M';
  }

  function eggEntries() {
    const now = Date.now();
    const gameNow = game().time?.() ?? now;
    const eggs = save().pension?.eggs || [];
    const bonusEggs = save().umiArcade?.eggs || [];
    return [
      ...eggs.filter(egg => !egg.workshopWarmed && egg.hatchAt > gameNow && !game().eggReady(egg))
        .map(egg => ({id: `pension:${egg.uid}`, egg, now: gameNow, field: 'hatchAt', source: 'Nhà trẻ'})),
      ...bonusEggs.filter(egg => !egg.workshopWarmed && egg.readyAt > now && egg.winAt > (save().stats?.wins || 0))
        .map(egg => ({id: `casino:${egg.key}`, egg, now, field: 'readyAt', source: 'Sòng bạc'}))
    ];
  }

  function eggs() {
    return eggEntries().map(entry => ({
      id: entry.id, name: game().DEX[entry.egg.id]?.name || 'Trứng Pokémon', source: entry.source,
      remaining: entry.egg[entry.field] - entry.now
    }));
  }

  function warmEgg(id) {
    return window.UmiArcade.transact(() => {
      const entry = eggEntries().find(option => option.id === id);
      if (!entry) throw new Error('Trứng đã sẵn sàng hoặc đã dùng Ổ ấp ấm.');
      if (!window.UmiWorkshop.consumeIncubation()) throw new Error('Bạn chưa có lượt dùng Ổ ấp ấm.');
      entry.egg[entry.field] = entry.now + Math.ceil((entry.egg[entry.field] - entry.now) / 2);
      entry.egg.workshopWarmed = true;
      return {ok: true, message: 'Đã giảm một nửa thời gian ấp còn lại.'};
    });
  }

  const previousInstall = window.__setInternalPoke;
  window.__setInternalPoke = value => {
    previousInstall?.(value);
    engine = value;
    window.UmiWorkshop.install(value);
    const arcadeEncounter = window.__umiArcadeEncounter;
    window.__umiArcadeEncounter = (original, node, level) => {
      const pendingPass = save().umiArcade?.pendingEncounter;
      const selected = arcadeEncounter?.(original, node) ?? original;
      if (selected !== original || (pendingPass && !save().umiArcade?.pendingEncounter)) return selected;
      return encounter(selected, node, level);
    };
  };
  window.__umiWorkshopWildWin = onWildWin;
  window.UmiWorkshopEffects = {targets, hunt, huntChance, startHunt, cancelHunt, materialProgress, eggs, warmEgg};
})();
