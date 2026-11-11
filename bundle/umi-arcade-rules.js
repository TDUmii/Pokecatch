(function (root) {
  'use strict';
  const definitions = [
    ['umi-spin-ticket', 'Vé quay Pokémon', 'Đổi lấy một lượt quay tại máy Pokémon.', 25, 100],
    ['umi-ten-ticket', 'Vé quay 10 lượt', 'Đổi lấy 10 lượt quay Pokémon.', 200, 900],
    ['umi-choice-ticket', 'Vé chọn quà', 'Chọn một trong 3 gói cùng bậc Hiếm: huấn luyện, tiến hóa hoặc vé Pokémon.', 80, 350],
    ['umi-evolution-chest', 'Rương tiến hóa', 'Mở để chọn vật phẩm tiến hóa.', 100, 450],
    ['umi-mega-shard', 'Mảnh Mega', 'Đổi 20 mảnh để nhận một vé chọn Đá Mega.', 30, 120],
    ['umi-mega-selector', 'Vé chọn Đá Mega', 'Chọn một Đá Mega trong bộ sưu tập phần thưởng.', 600, 2500],
    ['umi-selected-egg', 'Trứng tự chọn', 'Chọn một trong 3 trứng. Nở sau 3 phút hoặc 5 trận thắng.', 150, 650],
    ['umi-missing-pass', 'Vé Pokémon còn thiếu', 'Ưu tiên gặp một loài chưa bắt tại vùng hiện tại. Tỷ lệ bắt vẫn áp dụng bình thường.', 250, 1000],
    ['umi-loot-charm', 'Bùa chiến lợi phẩm', 'Trong 60 phút, mỗi 5 trận thắng nhận thêm quả mọng hoặc kẹo EXP.', 50, 220],
    ['umi-shiny-selector', 'Vé chọn Pokémon khác màu', 'Chọn một Pokémon khác màu từ danh sách phần thưởng.', 1000, 5000],
    ['umi-supply-crate', 'Thùng tiếp tế', 'Mở để nhận vật phẩm huấn luyện và quả mọng.', 60, 250],
    ['umi-gold-ingot', 'Thỏi vàng', 'Dùng để nhận ngay 5.000 Pokédollar.', 100, 400]
  ];
  const ITEMS = Object.fromEntries(definitions.map(([id, name, desc, scrap, cost]) => [id, {
    id, name, desc, scrap, cost, icon: 'assets/umi/' + id.slice(4) + '.svg'
  }]));
  const MACHINES = {
    supply: { id: 'supply', title: 'Máy tiếp tế', subtitle: 'Kẹo, quả mọng và những món quà bất ngờ', icon: ITEMS['umi-supply-crate'].icon, price: 500 },
    evolution: { id: 'evolution', title: 'Máy tiến hóa', subtitle: 'Đá tiến hóa, rương và mảnh Mega', icon: ITEMS['umi-evolution-chest'].icon, price: 2500 },
    pokemon: { id: 'pokemon', title: 'Máy Pokémon', subtitle: 'Dùng vé để tìm người bạn đồng hành', icon: ITEMS['umi-selected-egg'].icon, price: 0, payment: { id: 'umi-spin-ticket', qty: 1 } }
  };
  const RARITIES = [
    { id: 'common', name: 'Thường', weight: 50, color: '#a4b4c4' },
    { id: 'uncommon', name: 'Ít gặp', weight: 30, color: '#5aca9b' },
    { id: 'rare', name: 'Hiếm', weight: 15, color: '#63a8ff' },
    { id: 'epic', name: 'Sử thi', weight: 4, color: '#c58aff' },
    { id: 'jackpot', name: 'Độc đắc', weight: 1, color: '#ffd66b' }
  ];
  const item = (id, qty = 1) => ({ kind: 'item', id, qty });
  const money = amount => ({ kind: 'money', amount });
  const POOLS = {
    supply: [
      [money(500), item('exp-candy-s', 3), item('razz-berry', 3), item('pinap-berry', 3)],
      [money(1000), item('exp-candy-m', 2), item('lansat-berry', 3), item('umi-spin-ticket')],
      [item('umi-choice-ticket'), item('rare-candy', 3), item('umi-supply-crate', 2), item('umi-loot-charm')],
      [item('exp-candy-xl', 3), item('umi-ten-ticket'), item('umi-mega-shard', 8), item('umi-missing-pass')],
      [item('umi-mega-selector'), item('umi-shiny-selector')]
    ],
    evolution: [
      ['moon-stone', 'sun-stone', 'fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone'].map(id => item(id)),
      [item('rare-candy', 3), item('exp-candy-m', 3), item('umi-mega-shard', 2)],
      [item('umi-choice-ticket', 2), item('umi-evolution-chest'), item('umi-mega-shard', 5)],
      [item('umi-evolution-chest', 3), item('umi-mega-shard', 15), item('exp-candy-big', 2)],
      [item('umi-mega-selector'), item('umi-shiny-selector')]
    ],
    pokemon: [
      [item('exp-candy-s', 5), item('razz-berry', 5), item('umi-supply-crate')],
      [item('exp-candy-m', 3), item('starf-berry', 2), item('umi-gold-ingot')],
      [item('umi-selected-egg'), item('umi-choice-ticket'), item('umi-evolution-chest')],
      [item('umi-missing-pass'), item('umi-selected-egg', 2), item('umi-mega-shard', 12)],
      [item('umi-shiny-selector'), item('umi-mega-selector')]
    ]
  };
  const count = (value, cap = 1000000000) => typeof value === 'number' && Number.isFinite(value) ? Math.min(cap, Math.max(0, Math.floor(value))) : 0;
  const hasMachine = id => typeof id === 'string' && Object.prototype.hasOwnProperty.call(MACHINES, id);
  function fresh() {
    return { v: 1, pity: Object.fromEntries(Object.keys(MACHINES).map(id => [id, { rare: 0, epic: 0 }])), bonus: [], total: 0, history: [] };
  }
  function normalize(value) {
    const original = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const state = { ...original, ...fresh() };
    state.total = count(original.total);
    state.bonus = Array.isArray(original.bonus) ? original.bonus.slice(-100).filter(entry => typeof entry === 'string' ? hasMachine(entry) : entry && hasMachine(entry.machineId)).map(entry => typeof entry === 'string' ? entry : { ...entry }) : [];
    state.history = Array.isArray(original.history) ? original.history.slice(-100).filter(entry => entry && hasMachine(entry.machineId) && Number.isInteger(entry.tier) && entry.tier >= 0 && entry.tier <= 4).map(entry => ({ ...entry })) : [];
    for (const id of Object.keys(MACHINES)) {
      state.pity[id] = { rare: count(original.pity?.[id]?.rare, 9), epic: count(original.pity?.[id]?.epic, 49) };
    }
    return state;
  }
  function spin(state, machineId, { random = Math.random, bonus = false } = {}) {
    if (!hasMachine(machineId)) throw new Error('Máy quay không tồn tại.');
    if (!state || typeof state !== 'object' || Array.isArray(state)) throw new TypeError('Dữ liệu máy quay không hợp lệ.');
    if (typeof random !== 'function') throw new TypeError('Nguồn ngẫu nhiên không hợp lệ.');
    const draw = () => {
      const value = random();
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('Giá trị ngẫu nhiên phải nằm trong [0, 1).');
      return value;
    };
    // Finish all random draws before committing state, so a bad RNG cannot leave half a spin.
    const roll = draw() * 100;
    const choice = draw();
    const special = draw();
    const next = normalize(state);
    let tier = 0, cumulative = RARITIES[0].weight;
    while (tier < 4 && roll >= cumulative) cumulative += RARITIES[++tier].weight;
    const pity = next.pity[machineId];
    if (pity.rare >= 9) tier = Math.max(tier, 2);
    if (pity.epic >= 49) tier = Math.max(tier, 3);
    pity.rare = tier >= 2 ? 0 : pity.rare + 1;
    pity.epic = tier >= 3 ? 0 : pity.epic + 1;
    const multiplier = bonus && special < 0.1 ? 2 : 1;
    const bonusSpins = !bonus && tier >= 2 && special < 0.12 ? 5 : 0;
    const pool = POOLS[machineId][tier];
    const reward = { ...pool[Math.floor(choice * pool.length)] };
    if (reward.kind === 'money') reward.amount *= multiplier;
    else reward.qty *= multiplier;
    const result = { machineId, tier, rewards: [reward], bonusSpins, multiplier };
    next.total = count(next.total + 1);
    next.history.push({ ...result, rewards: result.rewards.map(entry => ({ ...entry })) });
    next.history = next.history.slice(-100);
    Object.assign(state, next);
    return result;
  }
  root.UmiArcadeRules = { ITEMS, MACHINES, RARITIES, POOLS, fresh, normalize, spin };
})(typeof globalThis === 'object' ? globalThis : window);
