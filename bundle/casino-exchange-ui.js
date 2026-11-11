(function (root) {
  'use strict';
  let filter = 'all';
  const groups = [
    { id: 'tickets', name: 'Vé & tiếp tế', ids: ['umi-spin-ticket', 'umi-ten-ticket', 'umi-choice-ticket', 'umi-supply-crate', 'umi-gold-ingot', 'umi-loot-charm'] },
    { id: 'pokemon', name: 'Bạn đồng hành', ids: ['umi-selected-egg', 'umi-missing-pass', 'umi-shiny-selector'] },
    { id: 'evolution', name: 'Tiến hóa & Mega', ids: ['umi-evolution-chest', 'umi-mega-shard', 'umi-mega-selector'] }
  ];
  function render(snapshot, { items, esc, fmt, img, button }) {
    const state = snapshot.state, balance = Number(state.scrap || 0), goal = items[state.goal];
    const affordable = Object.values(items).filter(item => balance >= item.cost).length;
    const choices = [['all', 'Tất cả'], ['affordable', `Đủ mảnh (${affordable})`], ...groups.map(group => [group.id, group.name])];
    let shown = 0;
    const sections = groups.map(group => {
      if (!['all', 'affordable', group.id].includes(filter)) return '';
      const entries = group.ids.map(id => items[id]).filter(item => item && (filter !== 'affordable' || balance >= item.cost));
      shown += entries.length;
      if (!entries.length) return '';
      return `<section class="ux-group" aria-label="${esc(group.name)}"><h4>${esc(group.name)}</h4><div class="ux-list">${entries.map(item => {
        const missing = Math.max(0, item.cost - balance), selected = state.goal === item.id;
        return `<article class="ux-entry${selected ? ' is-goal' : ''}"><div class="ux-item-art">${img(item.icon)}</div><div class="ux-item-copy"><h3>${esc(item.name)}</h3><p>${esc(item.desc)}</p><span class="ux-owned">Đang có ${fmt(state.items?.[item.id])}</span></div><div class="ux-price"><b>${fmt(item.cost)} <small>mảnh</small></b><span>${missing ? `Thiếu ${fmt(missing)} mảnh` : 'Có thể đổi ngay'}</span></div><div class="ux-actions">${button('Đổi quà', 'redeem', `data-id="${esc(item.id)}" aria-label="Đổi ${esc(item.name)} với ${fmt(item.cost)} mảnh"`, missing > 0, 'ux-redeem')}${button(selected ? 'Đang đặt mục tiêu' : 'Đặt mục tiêu', 'goal', `data-id="${esc(item.id)}" aria-pressed="${selected}"`, selected, 'ux-goal-button')}</div></article>`;
      }).join('')}</div></section>`;
    }).join('');
    return `<section class="ux-shop" aria-label="Quầy đổi thưởng"><header class="ux-shop-head"><div><h3>Đổi mảnh lấy quà</h3><p>Tái chế quà trong Túi quà để tích lũy mảnh.</p></div><div class="ux-balance">${img('assets/umi/mega-shard.svg')}<span><b>${fmt(balance)}</b> mảnh đổi thưởng</span></div></header>${goal ? `<section class="ux-goal" aria-label="Mục tiêu đổi thưởng">${img(goal.icon)}<div><span>Mục tiêu của bạn</span><b>${esc(goal.name)}</b><progress value="${Math.min(balance, goal.cost)}" max="${goal.cost}" aria-label="Tiến độ đổi ${esc(goal.name)}"></progress><small>${fmt(Math.min(balance, goal.cost))} / ${fmt(goal.cost)} mảnh · ${balance >= goal.cost ? 'Đã đủ mảnh để đổi' : `Còn thiếu ${fmt(goal.cost - balance)} mảnh`}</small></div></section>` : '<p class="ux-goal-hint">Chọn “Đặt mục tiêu” ở món bạn muốn để theo dõi tiến độ.</p>'}<div class="ux-mobile-filters"><label for="ux-category">Nhóm quà</label><select id="ux-category" data-exchange-category aria-label="Nhóm quà">${choices.filter(([id]) => id !== 'affordable').map(([id,label]) => `<option value="${id}"${filter === id || filter === 'affordable' && id === 'all' ? ' selected' : ''}>${esc(label)}</option>`).join('')}</select><button type="button" data-exchange-filter="${filter === 'affordable' ? 'all' : 'affordable'}" aria-pressed="${filter === 'affordable'}">Đủ mảnh (${affordable})</button></div><div class="ux-filters" role="group" aria-label="Lọc quà đổi thưởng">${choices.map(([id, label]) => `<button type="button" data-exchange-filter="${id}" aria-pressed="${filter === id}"${filter === id ? ' class="is-active"' : ''}>${esc(label)}</button>`).join('')}</div>${shown ? sections : '<p class="ux-empty">Chưa đủ mảnh để đổi quà. Tái chế vật phẩm trong Túi quà hoặc chọn Tất cả để xem mục tiêu tiếp theo.</p>'}</section>`;
  }
  root.UmiCasinoExchangeUI = { render, setFilter(value) { if (['all', 'affordable', ...groups.map(group => group.id)].includes(value)) filter = value; } };
})(globalThis);
