(function (root) {
  'use strict';
  let engine, service, host, tab = 'bag', busy = false, notice = '', error = '', dialog;
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
    return `<section class="ua-panel"><h3>Lịch sử 100 lượt gần nhất</h3><ol class="ua-log">${[...(snapshot.state.history || [])].reverse().map(entry => `<li><b class="ua-tier" data-tier="${entry.tier}">${symbol(entry.tier)} ${esc(rarity(entry.tier).name)}</b> · ${entry.machineId === 'evolution' ? 'Pachinko' : 'Máy quay Sòng bạc'}<small>${(entry.rewards || []).map(reward => reward.kind === 'money' ? `${fmt(reward.amount)} ₽` : `${esc(itemInfo(reward.id).name)} ×${fmt(reward.qty)}`).join(' · ')}${entry.multiplier > 1 ? ' · Quà ×2' : ''}${entry.bonusSpins ? ` · +${entry.bonusSpins} lượt miễn phí` : ''}</small></li>`).join('') || '<li class="ua-empty">Chưa có lượt quay nào.</li>'}</ol></section>`;
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
      const wasOpen = host.querySelector('.ua-casino-drawer')?.open || false;
      const giftCount = Object.values(snapshot.state.items || {}).reduce((sum, qty) => sum + Math.max(0, Number(qty) || 0), 0) + (snapshot.eggs || []).length;
      const freeCount = snapshot.customBonusRemaining ?? 0;
      host.innerHTML = `<p class="ua-casino-help">Máy quay đã dễ trúng hơn: không quá 2 lượt trượt liên tiếp. Vé miễn phí tự dùng khi nhấn QUAY.</p><details class="ua-casino-drawer" ${wasOpen ? 'open' : ''}><summary>Quà của tôi (${fmt(giftCount)}) · ${fmt(freeCount)} lượt miễn phí</summary><p>Quà tích lũy từ máy quay và mỗi lần mua bóng Pachinko. Vé, mảnh và quà cũ được giữ nguyên.</p><div class="ua-wallet"><span class="ua-wallet-chip">${img('assets/umi/spin-ticket.svg')} ${fmt(snapshot.state.items?.['umi-spin-ticket'])} vé</span><span class="ua-wallet-chip">${img('assets/umi/mega-shard.svg')} ${fmt(snapshot.state.scrap)} mảnh</span></div><nav class="ua-tabs" aria-label="Quà Sòng bạc">${[['bag', 'Túi quà'], ['exchange', 'Đổi thưởng'], ['history', 'Lịch sử'], ['mega', 'Đá Mega']].map(([id, name]) => `<button type="button" data-tab="${id}" class="${tab === id ? 'is-active' : ''}" aria-current="${tab === id ? 'page' : 'false'}" ${busy ? 'disabled' : ''}>${name}</button>`).join('')}</nav><div role="status" aria-live="polite">${notice ? `<p class="ua-bonus-banner">${esc(notice)}</p>` : ''}</div>${error ? `<p class="ua-error" role="alert">${esc(error)}</p>` : ''}<div class="ua-view">${tab === 'bag' ? bag(snapshot) : tab === 'exchange' ? exchange(snapshot) : tab === 'history' ? history(snapshot) : mega()}</div></details>`;

    } catch (failure) { host.innerHTML = `<p class="ua-error">${esc(failure.message || 'Không thể mở quà Sòng bạc.')}</p>`; }
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
  function action(event) {
    const target = event.target.closest('button');
    if (!target || busy) return;
    error = ''; notice = '';
    try {
      if (target.dataset.tab) { tab = target.dataset.tab; render(); return; }
      const id = target.dataset.id;
      switch (target.dataset.action) {
        case 'claim': claim(id); break;
        case 'hatch': { const result = service.claimEgg(target.dataset.key); notice = result?.message || 'Đã nhận Pokémon từ trứng.'; if (result?.mon) showAward(result.mon); break; }
        case 'refresh': break;
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
    const screen = document.getElementById('screen-casino');
    if (!screen) throw new Error('Chưa có màn hình Sòng bạc.');
    host = screen.querySelector('#umi-casino-prizes');
    if (!host) { host = document.createElement('div'); host.id = 'umi-casino-prizes'; screen.append(host); }
    host.classList.add('ua-root');
    host.removeEventListener('click', action);
    host.addEventListener('click', action);
    render();
  }
  root.UmiArcadeUI = { mount, render };
})(globalThis);
