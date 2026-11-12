/* PC helpers, offline crafting and accessory progression. */
(() => {
  'use strict';
  const recipes = [
    {
      id: 'detector', name: 'Máy dò dấu vết', type: 'electric',
      description: 'Theo dấu Pokémon còn thiếu hoặc tìm thêm nguyên liệu khi thắng Pokémon hoang dã.',
      stages: [
        {money: 2500, durationMs: 60000, items: {'poke-ball': 5}},
        {money: 6000, durationMs: 80000, items: {'poke-ball': 8, 'exp-candy-m': 1}},
        {money: 12000, durationMs: 90000, items: {'poke-ball': 12, 'exp-candy-m': 3}}
      ],
      branches: [
        {id: 'species', name: 'Dò loài còn thiếu', description: 'Đổi 35%, 50% hoặc 65% lượt gặp loài khác thành mục tiêu, tùy cấp máy.'},
        {id: 'materials', name: 'Dò nguyên liệu hiếm', description: 'Tìm nguyên liệu sau mỗi 6, 4 hoặc 3 trận thắng hoang dã thường theo cấp máy.'}
      ]
    },
    {
      id: 'incubator', name: 'Ổ ấp ấm', type: 'fire',
      description: 'Tích một lượt để giảm một nửa thời gian còn lại của một trứng.',
      stages: [{money: 1500, durationMs: 60000, items: {'exp-candy-s': 2}}],
      branches: []
    },
    {
      id: 'berryBox', name: 'Hộp quả chăm sóc', type: 'grass',
      description: 'Nhận 3 Quả Razz và 2 Quả Pinap.',
      stages: [{money: 1000, durationMs: 60000, items: {'poke-ball': 3}}],
      branches: []
    }
  ];
  let engine;
  const game = () => engine?.Game;
  const save = () => game()?.S;
  const workshop = () => save()?.umiWorkshop;
  const isReady = () => !!save()?.trainer && Array.isArray(save()?.mons);
  const charges = () => {
    const value = workshop()?.incubationCharges;
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  };
  const detector = () => {
    const accessory = workshop()?.accessories?.detector;
    if (!Number.isInteger(accessory?.level) || accessory.level < 1 || accessory.level > 3) return null;
    const branch = recipes[0].branches.some(entry => entry.id === accessory.branch) ? accessory.branch : null;
    return {level: accessory.level, branch};
  };
  function writable() {
    const s = save();
    if (!s.umiWorkshop || typeof s.umiWorkshop !== 'object' || Array.isArray(s.umiWorkshop)) s.umiWorkshop = {};
    return s.umiWorkshop;
  }
  function helpers(recipe) {
    const s = save();
    const team = new Set([...(s.team || []), ...(s.link?.stash?.team || [])]);
    return s.mons.flatMap(mon => {
      const species = game().DEX[mon.id];
      if (!species || team.has(mon.uid)) return [];
      return [{
        id: String(mon.uid), pokemonId: mon.id, name: species.name, level: mon.level,
        icon: engine.UI?.monSrc?.(mon.id, !!mon.shiny) || `assets/pokemon/${mon.id}.png`,
        preferred: species.types.includes(recipe.type)
      }];
    });
  }
  const nextStage = recipe => recipe.stages[recipe.id === 'detector' ? detector()?.level || 0 : 0];
  const fail = message => { throw new Error(message); };
  const itemName = id => engine.UI?.itemName?.(id) || engine.ITEM_NAMES?.[id] || id;
  function currentJob() {
    const job = workshop()?.job;
    const recipe = recipes.find(entry => entry.id === job?.recipeId);
    if (!recipe || !Number.isFinite(job.endsAt) || !Number.isInteger(job.level) ||
        job.level < 1 || job.level > recipe.stages.length) return null;
    const remainingMs = Math.max(0, job.endsAt - Date.now());
    return {...job, remainingMs, ready: remainingMs === 0};
  }
  function status() {
    const ready = isReady();
    const accessory = detector();
    return {
      ready, money: save()?.money || 0, job: currentJob(), incubationCharges: charges(),
      recipes: recipes.map(recipe => {
        const stage = nextStage(recipe);
        const level = recipe.id === 'detector' ? accessory?.level || 0 : 0;
        return {
          id: recipe.id, name: recipe.name, type: recipe.type, description: recipe.description,
          branches: recipe.branches.map(branch => ({...branch})), branch: level ? accessory.branch : null,
          level, maxLevel: recipe.id === 'detector' ? recipe.stages.length : 0, owned: level > 0,
          durationMs: stage?.durationMs || 0, money: stage?.money || 0,
          items: Object.entries(stage?.items || {}).map(([id, qty]) => ({
            id, qty, name: ready ? itemName(id) : id, available: ready ? game().itemCount(id) : 0
          })),
          helpers: ready && stage ? helpers(recipe) : []
        };
      })
    };
  }
  function transact(action) {
    try {
      if (!isReady()) fail('Hãy vào game và chọn nhân vật trước.');
      if (!window.UmiArcade?.transact) fail('Xưởng phụ kiện đang tải.');
      return window.UmiArcade.transact(action);
    } catch (error) {
      return {ok: false, message: error.message};
    }
  }
  function start(recipeId, helperId) {
    return transact(() => {
      const recipe = recipes.find(entry => entry.id === recipeId);
      if (!recipe) fail('Công thức không hợp lệ.');
      if (currentJob()) fail('Hãy nhận món đang làm trước khi bắt đầu món mới.');
      const stage = nextStage(recipe);
      if (!stage) fail('Máy dò dấu vết đã đạt cấp tối đa.');
      const helper = helpers(recipe).find(entry => entry.id === helperId);
      if (!helper) fail('Hãy chọn một Pokémon đang ở PC.');
      const g = game();
      if (save().money < stage.money) fail('Chưa đủ Pokédollar.');
      const items = Object.entries(stage.items);
      for (const [id, qty] of items) {
        if (g.itemCount(id) < qty) fail(`Chưa đủ ${itemName(id)}.`);
      }
      if (g.spend(stage.money, 'shop') !== stage.money) fail('Không thể trừ Pokédollar.');
      for (const [id, qty] of items) g.addItem(id, -qty);
      writable().job = {
        recipeId, helperName: helper.name, level: recipe.stages.indexOf(stage) + 1,
        endsAt: Date.now() + stage.durationMs * (helper.preferred ? 0.75 : 1)
      };
      return {ok: true, message: `${helper.name} đã bắt đầu làm ${recipe.name}.`};
    });
  }
  function claim() {
    return transact(() => {
      const job = currentJob();
      if (!job?.ready) fail(job ? 'Món đồ vẫn đang được làm.' : 'Chưa có món nào để nhận.');
      const state = writable();
      const recipe = recipes.find(entry => entry.id === job.recipeId);
      if (recipe.id === 'detector') {
        const previous = detector();
        if (job.level !== (previous?.level || 0) + 1) fail('Cấp máy không khớp với công việc hiện tại.');
        state.accessories = {...state.accessories, detector: {level: job.level, branch: previous?.branch || null}};
      } else if (recipe.id === 'incubator') {
        state.incubationCharges = charges() + 1;
      } else {
        game().addItem('razz-berry', 3);
        game().addItem('pinap-berry', 2);
      }
      delete state.job;
      return {ok: true, message: `Đã nhận ${recipe.name}${recipe.id === 'detector' ? ` cấp ${job.level}` : ''}.`};
    });
  }
  function selectBranch(recipeId, branchId) {
    return transact(() => {
      const accessory = detector();
      const branch = recipes[0].branches.find(entry => entry.id === branchId);
      if (recipeId !== 'detector' || !accessory || !branch) fail('Hãy chế tạo Máy dò dấu vết và chọn nhánh hợp lệ.');
      writable().accessories.detector = {...accessory, branch: branchId};
      return {ok: true, message: `Đã bật nhánh ${branch.name}.`};
    });
  }
  // Call when warming a chosen egg, inside the same arcade transaction.
  function consumeIncubation() {
    const count = charges();
    if (!count) return false;
    writable().incubationCharges = count - 1;
    return true;
  }
  window.UmiWorkshop = {
    install(value) { engine = value; },
    status, start, claim, selectBranch, detector, consumeIncubation
  };
})();
