/* Workshop screen. Crafting and Adventure effects are owned by their respective services. */
(function (root) {
  'use strict';

  const scanner = 'detector';
  const art = {
    detector: 'assets/items/silph-scope.png',
    incubator: 'assets/items/mystery-egg.png',
    berryBox: 'assets/items/pinap-berry.png'
  };
  const branchArt = {
    species: 'assets/ui/tallgrass-icon.png',
    materials: 'assets/items/gem-rock.png'
  };
  const moneyIcon = 'assets/ui/relic-gold.png';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const number = value => Number(value).toLocaleString('vi-VN');
  const icon = (src, classes = '') => src ? '<img class="' + classes + '" src="' + esc(src) + '" alt="">' : '';
  const time = ms => {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(seconds / 60);
    return minutes + ':' + String(seconds % 60).padStart(2, '0');
  };
  const workshop = () => root.UmiWorkshop;
  const effects = () => root.UmiWorkshopEffects;

  let screen;
  let timer;
  let selected = scanner;
  let helperId = '';
  let targetId = '';
  let eggId = '';
  let feedback = '';
  let failed = false;
  let jobEndsAt = 0;
  let statusLine;
  let liveEffect;

  function recipeMenu(recipes) {
    return '<div class="wk-recipes" aria-label="Công thức">' + recipes.map(recipe =>
      '<button type="button" class="wk-recipe" data-wk-recipe="' + esc(recipe.id) + '" aria-pressed="' +
      (recipe.id === selected) + '">' + icon(recipe.icon || art[recipe.id]) + '<span>' +
      esc(recipe.name) + '</span></button>'
    ).join('') + '</div>';
  }

  function ingredients(recipe, money) {
    const ingredients = [{ name: 'Tiền', qty: recipe.money, available: money, icon: moneyIcon }, ...recipe.items];
    return '<ul class="wk-ingredients" aria-label="Chi phí">' + ingredients.filter(item => item.qty > 0).map(item =>
      '<li class="' + (item.available < item.qty ? 'wk-short' : '') + '">' +
      icon(item.icon || 'assets/items/' + item.id + '.png') +
      '<span>' + esc(item.name) + '</span><b aria-label="Có ' + number(item.available) + ', cần ' +
      number(item.qty) + '">' + number(item.available) + ' / ' + number(item.qty) + '</b></li>'
    ).join('') + '</ul>';
  }

  function helpers(recipe) {
    if (!recipe.helpers.length) return '<p class="wk-hint">Cần một Pokémon đang rảnh trong PC.</p>';
    const helper = recipe.helpers.find(candidate => String(candidate.id) === helperId);
    const help = helper?.preferred ? 'Hợp công thức · Giảm 25% thời gian' : 'Pokémon hợp công thức sẽ làm nhanh hơn 25%.';
    const options = recipe.helpers.map(candidate => '<option value="' + esc(candidate.id) + '"' +
      (candidate === helper ? ' selected' : '') + '>' + esc(candidate.name) + ' · Cấp ' +
      number(candidate.level) + (candidate.preferred ? ' · Hợp công thức' : '') + '</option>').join('');
    return '<div class="wk-helper">' + icon(helper?.icon) + '<label>Trợ thủ từ PC<select data-wk-helper' +
      ' aria-describedby="wk-helper-help"><option value="">Chọn Pokémon</option>' + options +
      '</select><span class="wk-hint" id="wk-helper-help">' + help + '</span></label></div>';
  }

  function recipeDetails(recipe, status) {
    const isDetector = recipe.id === scanner;
    const atMax = recipe.maxLevel > 0 && recipe.level >= recipe.maxLevel;
    const helper = recipe.helpers.find(candidate => String(candidate.id) === helperId);
    const duration = helper?.preferred ? recipe.durationMs * .75 : recipe.durationMs;
    const affordable = status.money >= recipe.money && recipe.items.every(item => item.available >= item.qty);
    const available = affordable && helper && !status.job;
    const title = isDetector && recipe.owned ? 'Nâng cấp lên Lv.' + (recipe.level + 1) : 'Bắt đầu chế tạo';
    const reason = status.job ? 'Xưởng đang có một mẻ.' : !affordable ? 'Chưa đủ nguyên liệu.' : !helper ? 'Chọn trợ thủ để bắt đầu.' : '';
    return '<section class="wk-craft" aria-labelledby="wk-recipe-title"><div class="wk-title-row">' +
      icon(recipe.icon || art[recipe.id]) + '<div><h3 id="wk-recipe-title">' + esc(recipe.name) + '</h3><p>' +
      esc(recipe.description) + '</p></div></div>' +
      (recipe.id === 'incubator' ? '<p class="wk-hint">Lượt hỗ trợ ấp đang có: <b>' + number(status.incubationCharges ?? 0) + '</b></p>' : '') +
      (atMax ? '<p class="wk-hint">Máy đã đạt cấp tối đa. Bạn có thể đổi nhánh bên dưới.</p>' :
        ingredients(recipe, status.money) + helpers(recipe) +
        '<div class="wk-action-row"><div><b class="wk-duration">' + time(duration) + '</b><span class="wk-hint">Thời gian dự kiến</span></div>' +
        '<button type="button" class="wk-primary" data-wk-action="craft"' + (available ? '' : ' disabled') + '>' + title +
        '</button></div>' + (reason ? '<p class="wk-hint">' + reason + '</p>' : '')) + '</section>';
  }

  function currentJob(job, recipes) {
    jobEndsAt = job?.endsAt ?? 0;
    if (!job) return '<section class="wk-job" aria-labelledby="wk-job-title"><h3 id="wk-job-title">Mẻ đang làm</h3>' +
      '<p>Xưởng đang trống. Thời gian chế tạo vẫn tiếp tục khi bạn rời game.</p></section>';
    const recipe = recipes.find(item => item.id === job.recipeId);
    const title = recipe?.name || 'Mẻ chế tạo';
    const level = recipe?.id === scanner && job.level ? ' · Lv.' + job.level : '';
    return '<section class="wk-job" aria-labelledby="wk-job-title"><div><h3 id="wk-job-title">' + esc(title + level) +
      '</h3><p>Trợ thủ ' + esc(job.helperName) + '</p></div>' +
      (job.ready ? '<button type="button" class="wk-primary" data-wk-action="claim">Nhận thành phẩm</button>' :
        '<span class="wk-countdown" data-wk-countdown aria-label="Thời gian còn lại">' + time(job.remainingMs) + '</span>') +
      '</section>';
  }

  function huntControls(active) {
    if (active) {
      return '<div class="wk-tracking"><div><h4>' + (active.paused ? 'Tạm dừng dò ' : 'Đang dò ') +
        esc(active.name) + '</h4><p>Còn ' + number(active.remaining) + ' lượt gặp phù hợp.</p>' +
        (active.routes?.length ? '<p>Có thể gặp tại ' + esc(active.routes.join(', ')) + '.</p>' : '') + '</div>' +
        '<button type="button" data-wk-action="cancel">Dừng dò</button></div>';
    }
    const targets = effects()?.targets() || [];
    if (!targets.length) return '<p class="wk-hint">Chưa có loài chưa bắt trong các tuyến đường đã mở của chương này.</p>';
    const target = targets.find(value => String(value.id) === targetId);
    const options = targets.map(value => '<option value="' + esc(value.id) + '"' +
      (value === target ? ' selected' : '') + '>' + esc(value.name) + '</option>').join('');
    return '<div class="wk-hunt"><div class="wk-helper">' + icon(target?.icon) +
      '<label>Loài chưa bắt<select data-wk-target><option value="">Chọn Pokémon cần dò</option>' +
      options + '</select></label></div>' + (target?.routes.length ?
        '<p class="wk-hint">Có thể gặp tại ' + esc(target.routes.join(', ')) + '.</p>' : '') +
      '<button type="button" class="wk-primary" data-wk-action="hunt"' + (target ? '' : ' disabled') +
      '>Bật máy dò</button></div>';
  }

  function materialProgress(progress) {
    if (!progress?.every) return '';
    return '<div class="wk-tracking"><div><h4>Tiến độ tìm nguyên liệu</h4><p>' +
      number(Math.min(progress.wins, progress.every)) + ' / ' + number(progress.every) + ' trận thắng Pokémon hoang dã</p>' +
      (progress.lastReward ? '<p>Lần nhặt gần nhất: ' + esc(progress.lastReward) + '</p>' : '') + '</div>' +
      '<progress max="' + progress.every + '" value="' + progress.wins + '" aria-label="Tiến độ tìm nguyên liệu"></progress></div>';
  }

  function eggControls(charges) {
    const eggs = effects()?.eggs() || [];
    const egg = eggs.find(value => String(value.id) === eggId);
    const options = eggs.map(value => '<option value="' + esc(value.id) + '"' +
      (value === egg ? ' selected' : '') + '>' + esc(value.name) + ' · ' + esc(value.source) + '</option>').join('');
    return '<section class="wk-detector" aria-labelledby="wk-egg-title"><div class="wk-title-row">' +
      icon(art.incubator) + '<div><h3 id="wk-egg-title">Dùng lượt ấp</h3><p>Giảm một nửa thời gian còn lại. Mỗi trứng chỉ dùng được một lượt.</p></div></div>' +
      (!eggs.length ? '<p class="wk-hint">Chưa có trứng đang ấp đủ điều kiện.</p>' :
        '<div class="wk-hunt"><div class="wk-helper"><label>Trứng đang ấp<select data-wk-egg>' +
        '<option value="">Chọn trứng</option>' + options + '</select></label></div>' +
        (egg ? '<p class="wk-hint">Thời gian còn lại: ' + time(egg.remaining) + '</p>' : '') +
        '<button type="button" class="wk-primary" data-wk-action="warm"' + (egg && charges ? '' : ' disabled') +
        '>Dùng 1 lượt ấp</button></div>') + '</section>';
  }

  function detectorDetails(recipe) {
    if (!recipe?.owned) return '';
    const level = recipe.level ? ' · Lv.' + recipe.level : '';
    const branches = recipe.branches.map(branch => {
      const active = branch.id === recipe.branch;
      return '<button type="button" class="wk-branch" data-wk-branch="' + esc(branch.id) + '" aria-pressed="' +
        active + '">' + icon(branchArt[branch.id]) + '<span><b>' + esc(branch.name) + '</b><small>' +
        esc(branch.description) + '</small></span>' + (active ? '<span class="wk-active">Đang dùng</span>' : '') + '</button>';
    }).join('');
    const help = recipe.branch === 'materials'
      ? 'Nhận Kẹo EXP M khi đủ trận thắng hoang dã thường lúc đang chơi. Mỗi lần nhặt thứ ba có thêm Kẹo Hiếm.'
      : 'Đổi ' + Math.round((effects()?.huntChance() ?? 0) * 100) +
        '% lượt gặp loài khác thành mục tiêu trên tuyến có loài đó. Máy tự dừng khi gặp mục tiêu hoặc sau 30 lượt phù hợp.';
    const isMaterials = recipe.branch === 'materials';
    const progress = isMaterials ? effects()?.materialProgress() : effects()?.hunt();
    liveEffect = JSON.stringify(progress);
    return '<section class="wk-detector" aria-labelledby="wk-detector-title"><div class="wk-title-row">' +
      icon(art.detector) + '<div><h3 id="wk-detector-title">Máy dò dấu vết' + level +
      '</h3><p>Chọn hướng sử dụng trước khi đi phiêu lưu.</p></div></div>' +
      '<div class="wk-branches" aria-label="Nhánh máy dò">' + branches + '</div>' +
      '<p class="wk-hint">' + help + '</p>' +
      '<div data-wk-live="' + (isMaterials ? 'materials' : 'species') + '">' +
      (isMaterials ? materialProgress(progress) : huntControls(progress)) + '</div></section>';
  }

  function refreshDetector() {
    const region = screen?.querySelector('[data-wk-live]');
    if (!region) return;
    const isMaterials = region.dataset.wkLive === 'materials';
    const progress = isMaterials ? effects()?.materialProgress() : effects()?.hunt();
    const next = JSON.stringify(progress);
    if (next === liveEffect) return;
    const cancelFocused = document.activeElement?.matches('[data-wk-action="cancel"]');
    liveEffect = next;
    region.innerHTML = isMaterials ? materialProgress(progress) : huntControls(progress);
    if (cancelFocused) focus(progress ? '[data-wk-action="cancel"]' : '[data-wk-target]');
  }

  function focus(selector) {
    if (selector) screen.querySelector(selector)?.focus({ preventScroll: true });
  }

  function render(restore) {
    if (!screen) return;
    const status = workshop()?.status();
    if (!status?.ready || !status.recipes.length) {
      screen.innerHTML = '<p class="wk-shell">Xưởng đang tải dữ liệu.</p>';
      return;
    }
    const recipe = status.recipes.find(item => item.id === selected) || status.recipes[0];
    selected = recipe.id;
    const detector = status.recipes.find(item => item.id === scanner);
    screen.innerHTML = '<div class="wk-shell"><header class="wk-head"><div><h2>Xưởng chế tạo</h2>' +
      '<p>Cùng Pokémon trong PC làm vật phẩm và nâng cấp máy dò.</p></div>' +
      '<span class="wk-wallet">' + icon(moneyIcon) + '<span>' + number(status.money) + ' tiền</span></span></header>' +
      '<div class="wk-status-slot"></div>' +
      currentJob(status.job, status.recipes) + recipeMenu(status.recipes) + recipeDetails(recipe, status) +
      (recipe.id === 'incubator' ? eggControls(status.incubationCharges) : recipe.id === scanner ? detectorDetails(detector) : '') + '</div>';
    screen.querySelector('.wk-status-slot').replaceWith(statusLine);
    statusLine.toggleAttribute('data-error', failed);
    statusLine.textContent = feedback;
    focus(restore);
  }

  function act(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const { wkRecipe, wkBranch, wkAction } = button.dataset;
    feedback = '';
    failed = false;
    if (wkRecipe) {
      selected = wkRecipe;
      helperId = '';
      render('[data-wk-recipe="' + CSS.escape(wkRecipe) + '"]');
      return;
    }
    let result;
    try {
      if (wkBranch) result = workshop().selectBranch(scanner, wkBranch);
      else if (wkAction === 'craft') {
        const recipe = workshop().status().recipes.find(value => value.id === selected);
        const helper = recipe?.helpers.find(value => String(value.id) === helperId);
        result = workshop().start(selected, helper?.id);
      }
      else if (wkAction === 'claim') result = workshop().claim();
      else if (wkAction === 'hunt') result = effects()?.startHunt(Number(targetId));
      else if (wkAction === 'cancel') result = effects()?.cancelHunt();
      else if (wkAction === 'warm') result = effects()?.warmEgg(eggId);
      else return;
    } catch (error) {
      result = { ok: false, message: error.message };
    }
    feedback = typeof result === 'string' ? result : result?.message || '';
    failed = result?.ok === false;
    if (result?.ok && wkAction === 'claim') helperId = '';
    render(wkBranch ? '[data-wk-branch="' + CSS.escape(wkBranch) + '"]' :
      wkAction === 'hunt' ? '[data-wk-action="cancel"]' :
      wkAction === 'cancel' ? '[data-wk-target]' :
      wkAction === 'warm' ? '[data-wk-egg]' :
      '[data-wk-recipe][aria-pressed="true"]');
  }

  function init() {
    screen = document.getElementById('screen-workshop');
    if (!screen || screen.dataset.workshopReady) return;
    screen.dataset.workshopReady = 'true';
    statusLine = document.createElement('p');
    statusLine.className = 'wk-status';
    statusLine.setAttribute('role', 'status');
    screen.addEventListener('click', act);
    screen.addEventListener('change', ({ target }) => {
      if (target.matches('[data-wk-helper]')) {
        helperId = target.value;
        render('[data-wk-helper]');
      } else if (target.matches('[data-wk-target]')) {
        targetId = target.value;
        render('[data-wk-target]');
      } else if (target.matches('[data-wk-egg]')) {
        eggId = target.value;
        render('[data-wk-egg]');
      }
    });
  }

  function leave() {
    clearInterval(timer);
  }

  function enter() {
    init();
    render();
    leave();
    let checkedSecond = 0;
    timer = setInterval(() => {
      const now = Date.now();
      const second = Math.floor(now / 1000);
      if (checkedSecond !== second) {
        checkedSecond = second;
        refreshDetector();
      }
      const countdown = screen?.querySelector('[data-wk-countdown]');
      if (!countdown) return;
      const remaining = jobEndsAt - now;
      if (remaining <= 0) render();
      else countdown.textContent = time(remaining);
    }, 250);
  }

  function install(engine) {
    engine.Screens.workshop = { init, render, enter, leave };
  }

  root.UmiWorkshopUI = { install };
  const previous = root.__setInternalPoke;
  root.__setInternalPoke = engine => {
    previous?.(engine);
    install(engine);
  };
})(globalThis);
