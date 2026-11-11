(function (root) {
  'use strict';
  let engine, service, host, tab = 'machines', machine = 'supply', busy = false, results = [], notice = '', error = '', dialog;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const fmt = value => Number(value || 0).toLocaleString('vi-VN');
  const img = (src, alt = '') => src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : '';
  const button = (label, action, data = '', disabled = false, cls = '') => `<button type="button" class="${cls}" data-action="${action}" ${data}${disabled || busy ? ' disabled' : ''}>${label}</button>`;
  const definitions = () => root.UmiArcadeRules.ITEMS;
  const rarity = tier => root.UmiArcadeRules.RARITIES[tier] || root.UmiArcadeRules.RARITIES[0];
  const symbol = tier => ['●', '◆', '✦', '✶', 'ĐỘC ĐẮC'][tier] || '●';
  function itemInfo(id) {
    const own = definitions()[id];
    return own || { id, name: engine.UI?.itemName?.(id) || id, icon: engine.UI?.itemSrc?.(id) || `assets/items/${id}.png` };
  }
  function rewardView(reward, tier, usable = true) {
    const info = reward.kind === 'money' ? { name: `${fmt(reward.amount)} ₽`, icon: 'assets/umi/gold-ingot.svg' } : itemInfo(reward.id);
    return `<article class="ua-reward" data-tier="${tier}">${img(info.icon)}<span class="ua-reward-name">${esc(info.name)}${reward.kind === 'item' ? ` ×${fmt(reward.qty)}` : ''}</span><small class="ua-tier" data-tier="${tier}">${symbol(tier)} ${esc(rarity(tier).name)}</small>${usable && reward.kind === 'item' ? button('Dùng', 'claim', `data-id="${esc(reward.id)}"`) : ''}</article>`;
  }
  function bonusCount(state) {
    return (state.bonus || []).reduce((sum, entry) => sum + ((typeof entry === 'string' ? entry : entry.machineId) === machine ? (typeof entry === 'string' ? 1 : Number(entry.remaining ?? entry.count ?? entry.qty ?? 1)) : 0), 0);
  }
  function machines(snapshot) {
    const models = snapshot.machines || root.UmiArcadeRules.MACHINES;
    const list = Array.isArray(models) ? models : Object.values(models);
    const model = list.find(entry => entry.id === machine) || root.UmiArcadeRules.MACHINES[machine];
    const pity = snapshot.state.pity?.[machine] || { rare: 0, epic: 0 };
    const queued = bonusCount(snapshot.state);
    const last = results.at(-1), tier = last?.tier || 0;
    const reelRewards = last?.rewards || [{ kind: 'item', id: machine === 'evolution' ? 'umi-evolution-chest' : machine === 'pokemon' ? 'umi-selected-egg' : 'umi-supply-crate' }];
    const payment = machine === 'pokemon' ? 'ticket' : (host.querySelector('[data-payment]')?.value || 'money');
    return `<div class="ua-machine-tabs">${list.map(entry => `<button type="button" data-machine="${esc(entry.id)}" class="${machine === entry.id ? 'is-active' : ''}" ${busy ? 'disabled' : ''}>${img(entry.icon)}<b>${esc(entry.title)}</b><small>${entry.id === 'pokemon' ? '1 vé / lượt' : `${fmt(entry.price)} ₽ / lượt`}</small></button>`).join('')}</div>
      <section class="ua-console ${busy ? 'is-spinning' : ''}" data-rarity="${tier}" aria-busy="${busy}"><div class="ua-machine-head"><h3>${esc(model.title)}</h3><p>${esc(model.subtitle)}</p></div>
      <div class="ua-reels" aria-hidden="true">${[0, 1, 2].map(index => `<div class="ua-reel">${img(itemInfo(reelRewards[index % reelRewards.length].id || 'umi-gold-ingot').icon)}</div>`).join('')}</div>
      <div class="ua-flash" role="status">${busy ? 'Đang mở phần thưởng…' : last ? `${symbol(tier)} ${esc(rarity(tier).name)}${last.multiplier > 1 ? ' · Quà ×2!' : ''}` : 'Mỗi lượt đều có quà'}</div>
      ${machine !== 'pokemon' ? `<label class="ua-payment">Thanh toán <select data-payment ${busy ? 'disabled' : ''}><option value="money" ${payment === 'money' ? 'selected' : ''}>Tiền trong trò chơi</option><option value="ticket" ${payment === 'ticket' ? 'selected' : ''}>Vé quay</option></select></label>` : '<p class="ua-payment">Dùng vé quay Pokémon trong túi quà.</p>'}
      <div class="ua-controls">${button('Quay 1 lượt', 'spin', 'data-count="1"', false, 'ua-primary')}${button('Quay 10 lượt', 'spin', 'data-count="10"')}${machine === 'pokemon' ? button('Dùng vé 10 lượt', 'ten') : ''}</div>
      ${queued > 0 ? `<div class="ua-bonus-banner">Còn ${fmt(queued)} lượt miễn phí tại máy này. ${button(`Chơi ${Math.min(5, queued)} lượt miễn phí`, 'bonus')}</div>` : ''}
      <div class="ua-pity">${[['rare', 'Hiếm trở lên', 10], ['epic', 'Sử thi trở lên', 50]].map(([key, name, max]) => `<div class="ua-meter"><label>${name}<span>${fmt(pity[key])}/${max}</span></label><progress value="${pity[key]}" max="${max}" aria-label="Tiến độ bảo đảm ${name}"></progress><small>Chậm nhất sau ${max - pity[key]} lượt nữa.</small></div>`).join('')}</div></section>
      ${results.length && !busy ? `<section aria-label="Kết quả mới nhất"><h3>Quà đã nhận vào kho</h3><div class="ua-results">${results.map(result => result.rewards.map(reward => rewardView(reward, result.tier)).join('') + (result.bonusSpins ? `<p class="ua-bonus-banner">+${result.bonusSpins} lượt miễn phí!</p>` : '')).join('')}</div></section>` : ''}
      <section class="ua-panel"><h3>Quà có thể nhận</h3><p>${[...new Set(root.UmiArcadeRules.POOLS[machine].flat().map(reward => reward.kind === "money" ? fmt(reward.amount) + " ₽" : itemInfo(reward.id).name))].map(esc).join(" · ")}</p></section><details class="ua-panel"><summary>Tỷ lệ và cách chơi</summary><p>Chỉ sử dụng tiền và vật phẩm trong trò chơi. Mọi lượt đều nhận quà; phần thưởng được lưu trước khi hoạt ảnh chạy.</p><p>${root.UmiArcadeRules.RARITIES.map((entry, index) => `${symbol(index)} ${esc(entry.name)}: ${entry.weight}%`).join(' · ')}</p><p>Bảo đảm ít nhất Hiếm mỗi 10 lượt và Sử thi mỗi 50 lượt, riêng từng máy. Lượt miễn phí cũng được tính. Mỗi lượt thường từ bậc Hiếm có 12% cơ hội nhận 5 lượt miễn phí. Lượt miễn phí có 10% cơ hội nhân đôi quà và không sinh thêm vòng miễn phí.</p></details>`;
  }
  function itemCard(info, qty, custom = true, exchange = false) {
    return `<article class="ua-item">${img(info.icon)}<h3>${esc(info.name)}</h3><span class="ua-count">×${fmt(qty)}</span>${info.desc ? `<p>${esc(info.desc)}</p>` : ''}<div class="ua-item-actions">${exchange ? `${button(`Đổi ${fmt(info.cost)} mảnh`, 'redeem', `data-id="${esc(info.id)}"`, service.state().scrap < info.cost)}${button('Đặt mục tiêu', 'goal', `data-id="${esc(info.id)}"`)}` : `${button('Dùng', 'claim', `data-id="${esc(info.id)}"`, !qty || info.usable === false)}${custom || info.scrappable !== false ? button('Tái chế', 'scrap', `data-id="${esc(info.id)}" data-qty="${qty}"`, !qty) : ''}`}</div>${exchange ? '' : `<small>${custom ? `${fmt(info.scrap)} mảnh / món` : ''}</small>`}</article>`;
  }
  function bag(snapshot) {
    const inventory = Array.isArray(snapshot.items) ? snapshot.items : Object.values(definitions()).map(info => ({ ...info, qty: snapshot.state.items?.[info.id] || 0 }));
    return `${eggView(snapshot)}<section class="ua-panel"><h3>Túi quà riêng</h3><p>Dùng vé, mở rương hoặc tái chế quà thành mảnh đổi thưởng.</p><div class="ua-grid">${inventory.map(info => itemCard({ ...definitions()[info.id], ...info }, info.qty ?? snapshot.state.items?.[info.id] ?? 0)).join('')}</div></section><section class="ua-panel"><h3>Vật phẩm huấn luyện</h3><p>Vật phẩm đang có trong Túi của trò chơi.</p><div class="ua-grid">${(snapshot.inventory || []).map(info => itemCard(info, info.qty, false)).join('') || '<p class="ua-empty">Chưa có vật phẩm phù hợp.</p>'}</div></section>`;
  }
  function eggView(snapshot) {
    return '<section class="ua-panel"><h3>Trứng đang ấp</h3>' + button('Cập nhật tiến độ', 'refresh') + '<p>Trứng sẵn sàng sau 3 phút hoặc 5 trận thắng. Tiến độ được lưu khi trở lại.</p><div class="ua-grid">' + (snapshot.eggs || []).map(egg => '<article class="ua-item">' + img(egg.icon) + '<h3>' + esc(egg.name) + '</h3><span>' + (egg.ready ? 'Sẵn sàng nở!' : 'Còn ' + Math.ceil((egg.remainingMs || 0) / 60000) + ' phút hoặc ' + fmt(egg.winsLeft) + ' trận thắng') + '</span><div class="ua-item-actions">' + button(egg.ready ? 'Nhận Pokémon' : 'Đang ấp trứng', 'hatch', 'data-key="' + esc(egg.key) + '"', !egg.ready) + '</div></article>').join('') + '</div>' + (!(snapshot.eggs || []).length ? '<p class="ua-empty">Chưa có trứng đang ấp. Dùng Trứng tự chọn để bắt đầu.</p>' : '') + (snapshot.pendingEncounter ? '<p class="ua-bonus-banner">' + esc(snapshot.pendingEncounter.name) + ' sẽ xuất hiện trong cuộc chạm trán hoang dã phù hợp tiếp theo.</p>' : '') + (snapshot.lootRemainingMs > 0 ? '<p class="ua-bonus-banner">Bùa chiến lợi phẩm: còn ' + Math.ceil(snapshot.lootRemainingMs / 60000) + ' phút. Nhận thêm quả mọng hoặc Kẹo Kinh Nghiệm sau mỗi 5 trận thắng.</p>' : '') + '</section>';
  }
  function exchange(snapshot) {
    const goal = definitions()[snapshot.state.goal];
    return `<section class="ua-panel"><h3>Quầy đổi quà</h3><p>Mảnh đổi thưởng: <b>${fmt(snapshot.state.scrap)}</b>. Tái chế vật phẩm trong Túi quà để tích lũy.</p>${goal ? `<div class="ua-goal"><b>Mục tiêu: ${esc(goal.name)}</b><small>${fmt(snapshot.state.scrap)} / ${fmt(goal.cost)} mảnh</small><progress value="${Math.min(snapshot.state.scrap || 0, goal.cost)}" max="${goal.cost}" aria-label="Tiến độ đổi ${esc(goal.name)}"></progress></div>` : ''}<div class="ua-grid">${Object.values(definitions()).map(info => itemCard(info, snapshot.state.items?.[info.id] || 0, true, true)).join('')}</div></section>`;
  }
  function history(snapshot) {
    return `<section class="ua-panel"><h3>Lịch sử 100 lượt gần nhất</h3><ol class="ua-log">${[...(snapshot.state.history || [])].reverse().map(entry => `<li><b class="ua-tier" data-tier="${entry.tier}">${symbol(entry.tier)} ${esc(rarity(entry.tier).name)}</b> · ${esc(root.UmiArcadeRules.MACHINES[entry.machineId]?.title || 'Máy quay')}<small>${(entry.rewards || []).map(reward => reward.kind === 'money' ? `${fmt(reward.amount)} ₽` : `${esc(itemInfo(reward.id).name)} ×${fmt(reward.qty)}`).join(' · ')}${entry.multiplier > 1 ? ' · Quà ×2' : ''}${entry.bonusSpins ? ` · +${entry.bonusSpins} lượt miễn phí` : ''}</small></li>`).join('') || '<li class="ua-empty">Chưa có lượt quay nào.</li>'}</ol></section>`;
  }
  function mega() {
    const options = service.megaOptions?.() || { forms: [], unlocked: [], mons: [] };
    return `<section class="ua-panel"><h3>Trang bị Đá Mega</h3><p>Chọn Pokémon và Đá Mega tương thích từ bộ sưu tập đã mở khóa.</p><div class="ua-grid">${options.mons.map(mon => `<article class="ua-item">${img(mon.icon)}<h3>${esc(mon.name)}</h3><span>Cấp ${fmt(mon.level)}</span><p>${mon.megaKey ? `Đang trang bị: ${esc(options.forms.find(form => (form.key || form.id) === mon.megaKey)?.name || mon.megaKey)}` : 'Chưa trang bị Đá Mega'}</p><div class="ua-item-actions">${button('Trang bị', 'equip', `data-uid="${esc(mon.uid)}"`)}${button('Tháo', 'unequip', `data-uid="${esc(mon.uid)}"`, !mon.megaKey)}</div></article>`).join('') || '<p class="ua-empty">Chưa có Pokémon phù hợp.</p>'}</div></section><section class="ua-panel"><h3>Bộ sưu tập Đá Mega</h3><div class="ua-grid">${options.forms.map(form => `<article class="ua-item">${img(form.icon || form.src)}<h3>${esc(form.name)}</h3><span>${options.unlocked.includes(form.key || form.id) ? 'Đã mở khóa' : 'Chưa mở khóa'}</span></article>`).join('')}</div></section>`;
  }
  function render() {
    if (!host || !service || !host.closest('.active')) return;
    try {
      const snapshot = service.snapshot();
      snapshot.state ||= service.state();
      host.innerHTML = `<header class="ua-header"><div><h2>Khu quà may mắn</h2><p>Quay nhận quà, tích mảnh và chọn người bạn đồng hành.</p></div></header><div class="ua-wallet"><span class="ua-wallet-chip">${img("assets/umi/gold-ingot.svg")} ${fmt(snapshot.money)} ₽</span><span class="ua-wallet-chip">${img("assets/umi/spin-ticket.svg")} ${fmt(snapshot.state.items?.['umi-spin-ticket'])} vé</span><span class="ua-wallet-chip">${img("assets/umi/mega-shard.svg")} ${fmt(snapshot.state.scrap)} mảnh</span><span class="ua-wallet-chip">${fmt(snapshot.state.total)} lượt đã chơi</span></div><div class="ua-controls">${button("Mua 1 vé · 5.000 ₽", "buy", "data-count=\"1\"")}${button("Mua 10 vé · 45.000 ₽", "buy", "data-count=\"10\"")}</div><nav class="ua-tabs" aria-label="Khu quà">${[['machines', 'Máy quay'], ['bag', 'Túi quà'], ['exchange', 'Đổi thưởng'], ['history', 'Lịch sử'], ['mega', 'Đá Mega']].map(([id, name]) => `<button type="button" data-tab="${id}" class="${tab === id ? 'is-active' : ''}" aria-current="${tab === id ? 'page' : 'false'}" ${busy ? 'disabled' : ''}>${name}</button>`).join('')}</nav><div role="status" aria-live="polite">${notice ? `<p class="ua-bonus-banner">${esc(notice)}</p>` : ''}</div>${error ? `<p class="ua-error" role="alert">${esc(error)}</p>` : ''}<div class="ua-view">${tab === 'machines' ? machines(snapshot) : tab === 'bag' ? bag(snapshot) : tab === 'exchange' ? exchange(snapshot) : tab === 'history' ? history(snapshot) : mega()}</div>`;
    } catch (failure) { host.innerHTML = `<p class="ua-error">${esc(failure.message || 'Không thể mở khu quà.')}</p>`; }
  }
  function choose(title, options, execute) {
    dialog?.remove();
    dialog = document.createElement('dialog');
    dialog.className = 'ua-modal';
    dialog.setAttribute('aria-label', title);
    dialog.innerHTML = `<header><h2>${esc(title)}</h2><button type="button" class="ua-close" aria-label="Đóng">✕</button></header><p data-dialog-error role="alert"></p><div class="ua-choice-grid">${options.map((option, index) => `<button type="button" class="ua-choice" data-index="${index}">${img(option.icon)}<b>${esc(option.name)}</b><small>${esc(option.description || '')}</small></button>`).join('')}</div>`;
    dialog.querySelector('.ua-close').onclick = () => dialog.close();
    const currentDialog = dialog;
    dialog.addEventListener('close', () => { currentDialog.remove(); if (dialog === currentDialog) dialog = null; });
    dialog.addEventListener('click', event => {
      const target = event.target.closest('[data-index]');
      if (!target || busy) return;
      busy = true;
      try {
        const result = execute(options[Number(target.dataset.index)].id);
        notice = result?.message || 'Đã nhận phần thưởng.';
        const previousDialog = dialog; previousDialog.close();
        if (result?.mon) showAward(result.mon);
      } catch (failure) { dialog.querySelector('[data-dialog-error]').textContent = failure.message || 'Không thể thực hiện. Vật phẩm chưa được dùng.'; }
      finally { busy = false; render(); }
    });
    document.body.append(dialog);
    dialog.showModal();
  }
  function checkResult(result) {
    if (result?.ok === false) throw new Error(result.message || 'Không thể trang bị Đá Mega.');
    return result;
  }
  function showAward(mon) {
    const modal = document.createElement('dialog');
    modal.className = 'ua-modal';
    modal.setAttribute('aria-label', 'Pokémon đã gia nhập bộ sưu tập');
    const name = engine.Game.DEX[mon.id]?.name || 'Pokémon';
    const art = engine.UI.animSrc?.(mon.id, mon.shiny) || engine.UI.monSrc(mon, mon.shiny);
    modal.innerHTML = '<header><h2>Người bạn mới!</h2><button type="button" class="ua-close" aria-label="Đóng">✕</button></header><div class="ua-choice" style="text-align:center;padding:24px"><img style="width:180px;height:180px;object-fit:contain;image-rendering:pixelated;animation:ua-award-in .5s ease-out" src="' + esc(art) + '" alt="' + esc(name) + '"><h3>' + esc(name) + (mon.shiny ? ' khác màu' : '') + '</h3><p>Đã gia nhập bộ sưu tập · Cấp ' + fmt(mon.level) + '</p></div><style>@keyframes ua-award-in{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}@media(prefers-reduced-motion:reduce){.ua-modal img{animation:none!important}}</style>';
    modal.querySelector('button').onclick = () => modal.close();
    modal.addEventListener('close', () => { modal.remove(); if (dialog === modal) dialog = null; });
    document.body.append(modal); dialog = modal; modal.showModal();
  }
  function claim(id) {
    const options = service.choices?.(id) || [];
    if (options.length) choose(`Dùng ${itemInfo(id).name}`, options, choice => service.claim(id, choice));
    else {
      const result = service.claim(id);
      notice = result?.message || 'Đã dùng vật phẩm.';
      if (result?.mon) showAward(result.mon);
    }
  }
  async function action(event) {
    const target = event.target.closest('button');
    if (!target || busy) return;
    error = ''; notice = '';
    try {
      if (target.dataset.tab) { tab = target.dataset.tab; render(); return; }
      if (target.dataset.machine) { machine = target.dataset.machine; results = []; render(); return; }
      const id = target.dataset.id;
      switch (target.dataset.action) {
        case 'spin': case 'ten': case 'bonus': {
          const payment = target.dataset.action === 'bonus' ? 'bonus' : target.dataset.action === 'ten' ? 'ten-ticket' : machine === 'pokemon' ? 'ticket' : host.querySelector('[data-payment]')?.value || 'money';
          const count = payment === 'bonus' ? Math.min(5, bonusCount(service.state())) : payment === 'ten-ticket' ? 10 : Number(target.dataset.count || 1);
          busy = true;
          results = service.spin(machine, count, payment);
          render();
          await new Promise(resolve => setTimeout(resolve, root.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 500));
          busy = false;
          break;
        }
        case 'claim': claim(id); break;
        case 'hatch': { const result = service.claimEgg(target.dataset.key); notice = result?.message || 'Đã nhận Pokémon từ trứng.'; if (result?.mon) showAward(result.mon); break; }
        case 'refresh': break;
        case 'buy': notice = service.buyTickets(Number(target.dataset.count))?.message || 'Đã mua vé bằng tiền trong trò chơi.'; break;
        case 'redeem': notice = service.redeem(id)?.message || 'Đã đổi quà.'; break;
        case 'goal': service.setGoal(id); notice = 'Đã đặt mục tiêu đổi thưởng.'; break;
        case 'scrap': {
          const max = Number(target.dataset.qty);
          const quantities = [...new Set([1, Math.min(10, max), max])].filter(qty => qty > 0);
          choose(`Tái chế ${itemInfo(id).name}`, quantities.map(qty => ({ id: qty, name: `${fmt(qty)} món`, description: qty === max ? 'Toàn bộ số đang có' : 'Đổi thành mảnh thưởng' })), qty => service.scrapItem(id, qty));
          break;
        }
        case 'unequip': notice = checkResult(service.unequipMega(target.dataset.uid))?.message || 'Đã tháo Đá Mega.'; break;
        case 'equip': {
          const options = service.megaOptions();
          const mon = options.mons.find(entry => String(entry.uid) === target.dataset.uid);
          const forms = options.forms.filter(form => options.unlocked.includes(form.key || form.id) && (form.base === mon?.id || form.baseId === mon?.id || form.pokemonId === mon?.id || form.id === mon?.id));
          if (!forms.length) { notice = 'Chưa có Đá Mega đã mở khóa tương thích với Pokémon này.'; break; }
          choose('Chọn Đá Mega', forms.map(form => ({ ...form, icon: form.icon || form.src, id: form.key || form.id })), key => checkResult(service.equipMega(target.dataset.uid, key)));
          break;
        }
      }
    } catch (failure) { busy = false; error = failure.message || 'Không thể thực hiện thao tác này.'; }
    render();
  }
  function mount(game, adapter) {
    engine = game; service = adapter;
    const screen = document.getElementById('screen-umiArcade');
    if (!screen) throw new Error('Chưa có màn hình khu quà.');
    host = screen.querySelector('.ua-root');
    if (!host) { host = document.createElement('div'); host.className = 'ua-root'; screen.append(host); }
    host.removeEventListener('click', action);
    host.addEventListener('click', action);
    render();
  }
  root.UmiArcadeUI = { mount, render };
})(globalThis);
