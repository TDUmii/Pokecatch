/* Read-only guide: native type rules, map encounters and owned-team suggestions. */
(function (root) {
  'use strict';
  let engine;
  const game = () => engine.Game;
  const text = value => engine._t ? engine._t(value || '') : value || '';
  const species = id => game().DEX?.[id];
  const typeName = type => text(engine.TYPES?.[type]?.fr || type);
  const typeList = () => Object.keys(engine.TYPES || {});
  function matchup(attacking, defendingTypes) {
    if (!engine.TYPES?.[attacking]) return null;
    const defending = Array.isArray(defendingTypes) ? defendingTypes : [defendingTypes];
    if (!defending.length || defending.some(type => !engine.TYPES?.[type])) return null;
    if (engine.Adventure?.effectiveness) return engine.Adventure.effectiveness(attacking, defending);
    return defending.reduce((value, type) => value * (engine.TYPE_CHART?.[attacking]?.[type] ?? 1), 1);
  }
  function typeInfo(type, { defender2 } = {}) {
    if (!engine.TYPES?.[type]) return null;
    const defenders = [type, ...(defender2 && defender2 !== type && engine.TYPES[defender2] ? [defender2] : [])];
    return { type, name: typeName(type), types: defenders,
      attacking: typeList().map(other => ({ type: other, name: typeName(other), multiplier: matchup(type, [other]) })),
      defending: typeList().map(other => ({ type: other, name: typeName(other), multiplier: matchup(other, defenders) })) };
  }
  function maps() {
    const adv = game().S?.adv || {};
    return (engine.STORY?.CHAPTERS || []).map((chapter, index) => {
      const region = engine.STORY.regionOf?.(index);
      const locked = index > (adv.unlocked ?? adv.chapter ?? 0) || engine.STORY.regionUnlocked && !engine.STORY.regionUnlocked(region?.key || chapter.reg || 'kanto', adv);
      return { id: String(index), chapter: index, name: text(chapter.name), region: text(region?.name || chapter.reg || 'Kanto'), regionKey: region?.key || chapter.reg || 'kanto', description: text(chapter.region), locked: !!locked, current: index === (adv.chapter || 0) };
    });
  }
  function routePool(step, chapter, routeIndex, routeCount) {
    if (!engine.Adventure?.zonePool || !step.areas?.length && !step.pool?.length) return [];
    const node = { ...step, lv: step.lv || engine.STORY.routeBand?.(chapter, routeIndex, routeCount) };
    return engine.Adventure.zonePool(node, chapter, false, null, false, false).filter(entry => entry.on !== false && species(entry.id));
  }
  function threatsFor(map) {
    const chapter = engine.STORY.CHAPTERS[map.chapter], entries = new Map();
    const add = (id, level, weight, source, kind) => {
      if (!species(id)) return;
      const key = `${kind}:${id}`, entry = entries.get(key) || { id, name: species(id).name, types: [...species(id).types], level: 0, weight: 0, source, kind };
      entry.weight += weight; entry.level = Math.max(entry.level, level || 1); entries.set(key, entry);
    };
    const routes = chapter.steps.filter(step => step.kind === 'route');
    for (const step of chapter.steps) {
      if (step.team?.length) {
        const team = step.kind === 'gym' ? engine.STORY.gymTeam?.(map.chapter, step) || step.team : engine.STORY.trainerTeam?.(map.chapter, step) || step.team;
        for (const [id, level] of team) add(id, level, step.kind === 'gym' ? 3 : 2, text(step.leader || step.trainer || step.name), step.kind === 'gym' ? 'boss' : 'trainer');
      } else if (step.kind === 'route') {
        const pool = routePool(step, map.chapter, routes.indexOf(step), routes.length);
        const total = pool.reduce((sum, entry) => sum + (entry.pct ?? entry.w ?? 1), 0) || 1;
        // Regular trainer species are drawn from this pool; no invented fixed trainer roster.
        const weight = (step.wild || 0) + (step.trainers || 0) * 2;
        for (const entry of pool) add(entry.id, entry.max || step.lv?.[1], weight * (entry.pct ?? entry.w ?? 1) / total, text(step.name), 'wild');
      } else if (step.kind === 'static' && step.id) add(step.id, engine.STORY.staticLevel?.(map.chapter, step) || step.level, 2, text(step.name), 'static');
    }
    return [...entries.values()].sort((a, b) => b.weight - a.weight);
  }
  const monTypes = mon => root.__pokeGetMegaTypes?.(mon) || species(mon.id)?.types || [];
  function movesFor(mon) {
    const moves = [];
    for (const [level, key] of game().learnOf?.(mon) || species(mon.id)?.learn || []) {
      const move = engine.MOVES?.[key];
      if (!move || level > mon.level || engine.CONFIG?.MOVE_BLACKLIST?.includes(key)) continue;
      const power = game().movePower?.(key) ?? move.power;
      if (!(power > 0) || !engine.TYPES[move.type]) continue;
      moves.push({ key, name: text(move.name), type: move.type, cat: move.cat, power, acc: game().moveAcc?.(key) ?? move.acc ?? 100 });
    }
    return moves;
  }
  function candidate(mon, threats, extra = {}) {
    const cap = game().capFor?.(mon) ?? game().levelCap?.() ?? mon.level;
    const effective = { ...mon, level: Math.min(mon.level, cap) };
    const types = monTypes(effective), stats = game().statsOf?.(effective) || species(mon.id).stats || {};
    const moves = movesFor(effective);
    const coverage = threats.map(threat => {
      let best = null, attack = 0;
      for (const move of moves) {
        const multiplier = matchup(move.type, threat.types);
        const value = move.power * move.acc / 100 * (types.includes(move.type) ? 1.5 : 1) * (stats[move.cat === 'phys' ? 'atk' : 'spa'] || 1) * multiplier;
        if (value > attack) { attack = value; best = { ...move, multiplier }; }
      }
      const incoming = Math.max(...threat.types.map(type => matchup(type, types)), 1 / 4);
      const bulk = Math.sqrt(Math.max(1, (stats.def || 1) * (stats.spd || 1))) * Math.max(1, stats.hp || 1);
      // Relative ranking only: real moves and native stats, without simulating a full battle.
      const value = attack * Math.min(1.5, effective.level / Math.max(1, threat.level)) / (1 + incoming * .35) + Math.sqrt(bulk) * .1;
      return { id: threat.id, kind: threat.kind, weight: threat.weight, value, move: best, incoming };
    });
    const weight = threats.reduce((sum, threat) => sum + threat.weight, 0) || 1;
    const score = coverage.reduce((sum, entry) => sum + entry.value * entry.weight, 0) / weight;
    const fainted = (game().curHp?.(mon) ?? mon.hp ?? 1) <= 0;
    return { uid: mon.uid, id: mon.id, name: root.__pokeMegaMonName?.(mon) || species(mon.id).name, level: mon.level, effectiveLevel: effective.level, types: [...types], score, fainted, stats: { ...stats }, moves, coverage, note: fainted ? 'Cần hồi phục trước khi ra trận.' : mon.level > cap ? `Sức mạnh được tính ở giới hạn cấp ${cap}.` : '', ...extra };
  }
  function selectTeam(candidates, threats) {
    const remaining = [...candidates], selected = [], covered = threats.map(() => 0);
    while (remaining.length && selected.length < 6) {
      const gains = mon => mon.coverage.reduce((sum, entry, index) => sum + entry.weight * Math.max(0, entry.value - covered[index]), 0) + mon.score * .12;
      remaining.sort((a, b) => gains(b) - gains(a) || b.score - a.score || String(a.uid).localeCompare(String(b.uid)));
      const next = remaining.shift(); selected.push(next);
      next.coverage.forEach((entry, index) => { covered[index] = Math.max(covered[index], entry.value); });
    }
    return selected;
  }
  function snapshot(mapKey) {
    const allMaps = maps(), currentMap = allMaps.find(map => map.current) || allMaps[0];
    const selected = allMaps.find(map => map.id === String(mapKey)) || currentMap;
    const notes = ['Gợi ý theo hệ, chiêu đang học được, chỉ số và cấp hiện tại; không bảo đảm thắng. Không tự đổi đội hoặc dùng vật phẩm.', 'Ưu tiên đối thủ cố định của thủ lĩnh (trọng số 3); đội huấn luyện viên ngẫu nhiên được ước lượng từ nhóm gặp của tuyến đường. Thời tiết, kỹ năng, trạng thái và chiến thuật trận đấu chưa được mô phỏng.'];
    if (!selected) return { maps: [], currentMap: null, selected: null, threats: [], counters: [], owned: [], alternatives: [], notes: ['Chưa có dữ liệu bản đồ.'] };
    if (selected.locked) notes.push('Bản đồ chưa mở: xem trước đối thủ; gợi ý bắt thêm chỉ dùng tuyến đường đã mở.');
    const threats = threatsFor(selected);
    if (!threats.length) notes.push('Bản đồ này chưa có dữ liệu đối thủ phù hợp để xếp đội.');
    const counters = typeList().map(type => ({ type, name: typeName(type), score: threats.reduce((sum, enemy) => sum + enemy.weight * matchup(type, enemy.types), 0) / (threats.reduce((sum, enemy) => sum + enemy.weight, 0) || 1) })).sort((a, b) => b.score - a.score).slice(0, 6);
    const seen = new Set(), ownedCandidates = [];
    for (const mon of game().S.mons || []) {
      if (!mon.uid || seen.has(mon.uid) || !species(mon.id) || game().can?.(mon, 'adventure')) continue;
      seen.add(mon.uid); ownedCandidates.push(candidate(mon, threats));
    }
    const owned = threats.length ? selectTeam(ownedCandidates, threats) : [];
    const available = new Map(), ownedIds = new Set(ownedCandidates.map(mon => mon.id));
    for (const map of allMaps.filter(map => !map.locked && map.regionKey === currentMap?.regionKey)) {
      const chapter = engine.STORY.CHAPTERS[map.chapter], routes = chapter.steps.filter(step => step.kind === 'route');
      routes.forEach((step, index) => {
        if (!(step.wild > 0)) return;
        for (const entry of routePool(step, map.chapter, index, routes.length)) {
          const dex = species(entry.id);
          if (ownedIds.has(entry.id) || dex.legendary || dex.mythical || available.has(entry.id)) continue;
          const cap = game().levelCap?.() || entry.max || 1;
          if (entry.min > cap) continue;
          const mon = { id: entry.id, uid: `guide-${entry.id}`, level: Math.min(entry.max || cap, cap), reg: map.regionKey, shiny: false };
          available.set(entry.id, candidate(mon, threats, { source: `${map.name} · ${text(step.name)}`, chance: entry.pct, obtainable: true, note: 'Có trong nhóm gặp hiện tại của tuyến đường đã mở; vẫn cần gặp và bắt.' }));
        }
      });
    }
    const alternatives = threats.length ? [...available.values()].sort((a, b) => b.score - a.score).slice(0, 6) : [];
    return { maps: allMaps, currentMap, selected, threats, counters, owned, alternatives, notes };
  }
  root.UmiGuideRules = { install(value) { engine = value; }, matchup, matchups: typeInfo, typeInfo, maps, snapshot, recommend: snapshot,
    get types() { return typeList().map(type => ({ id: type, type, name: typeName(type), color: engine.TYPES[type].color })); },
    get typeNames() { return Object.fromEntries(typeList().map(type => [type, typeName(type)])); } };
})(globalThis);
