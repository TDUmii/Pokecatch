(function (root) {
  'use strict';
  let engine, arcade, batch, screen, pending = false, resultText = '', rewardText = '';
  const fmt = value => Number(value || 0).toLocaleString('vi-VN');
  function select() {
    const gifts = screen.dataset.tab === 'prizes';
    const panel = screen.querySelector('#umi-casino-prizes');
    if (panel) panel.hidden = !gifts;
    screen.querySelectorAll('.cs-tabs [data-cs-tab]').forEach(button => {
      const selected = button.dataset.csTab === screen.dataset.tab;
      button.classList.toggle('on', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
  }
  function render() {
    screen = document.getElementById('screen-casino');
    if (!screen?.querySelector('.cs-main')) return;
    const tabs = screen.querySelector('.cs-tabs');
    tabs.querySelector('[data-cs-tab="shop"]').textContent = 'Đổi xu';
    if (!tabs.querySelector('[data-cs-tab="prizes"]')) {
      tabs.setAttribute('role', 'tablist');
      tabs.setAttribute('aria-label', 'Sòng bạc');
      const prize = document.createElement('button');
      prize.type = 'button'; prize.id = 'umi-casino-prize-tab'; prize.dataset.csTab = 'prizes'; prize.textContent = 'Vé & quà'; prize.setAttribute('aria-controls', 'umi-casino-prizes');
      tabs.append(prize);
      tabs.querySelectorAll('button[data-cs-tab]').forEach(button => button.setAttribute('role', 'tab'));
      tabs.addEventListener('click', event => {
        const button = event.target.closest('[data-cs-tab]');
        if (!button) return;
        if (button.dataset.csTab === 'prizes') {
          // Let the native shop transition stop either machine before showing gifts.
          tabs.querySelector('[data-cs-tab="shop"]').click();
          screen.dataset.tab = 'prizes';
        }
        select();
        root.UmiArcadeUI.render();
        if (tabs.getBoundingClientRect().top < 0) tabs.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
      tabs.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const buttons = [...tabs.querySelectorAll('[data-cs-tab]')].filter(button => !button.disabled && button.getAttribute('aria-disabled') !== 'true');
        let index = buttons.indexOf(event.target);
        if (index < 0) return;
        event.preventDefault();
        index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[index].click(); buttons[index].focus();
      });
    }
    root.UmiArcadeUI.mount(engine, arcade);
    const giftPanel = screen.querySelector('#umi-casino-prizes');
    giftPanel.setAttribute('role', 'tabpanel'); giftPanel.setAttribute('aria-labelledby', 'umi-casino-prize-tab');
    let controls = screen.querySelector('#umi-casino-batch');
    if (!controls) {
      controls = document.createElement('section'); controls.id = 'umi-casino-batch';
      controls.setAttribute('aria-label', 'Quay nhiều lượt');
      controls.innerHTML = '<p class="uc-free"></p><div class="uc-batch-buttons"><button type="button" data-batch="10"><b>QUAY ×10</b><small></small></button><button type="button" data-batch="100"><b>QUAY ×100</b><small></small></button></div><p class="uc-batch-result" role="status" aria-live="polite"></p><details class="uc-reward-details" hidden><summary>Quà nhận được</summary><p></p></details>';
      screen.querySelector('.cs-stagebox').before(controls);
      controls.addEventListener('click', async event => {
        const button = event.target.closest('[data-batch]');
        if (!button || pending) return;
        pending = true; rewardText = ''; resultText = 'Đang quay…'; updateControls();
        try {
          const result = await batch.spin(Number(button.dataset.batch));
          const rewards = (result.rewards || []).map(reward => reward.kind === 'money' ? `${fmt(reward.amount)} ₽` : `${root.UmiArcadeRules?.ITEMS?.[reward.id]?.name || engine.UI.itemName?.(reward.id) || 'Quà'} ×${fmt(reward.qty)}`);
          resultText = `${fmt(result.count)} lượt · ${fmt(result.wins)} lượt trúng · Nhận ${fmt(result.coins)} xu.`;
          rewardText = rewards.join(' · ');
        } catch (failure) { resultText = failure.message || 'Chưa thể quay. Hãy kiểm tra tiền và thử lại.'; }
        finally { pending = false; render(); }
      });
    }
    select(); updateControls();
  }
  function updateControls() {
    const controls = screen?.querySelector('#umi-casino-batch');
    if (!controls) return;
    const quote = batch.quote(10);
    controls.querySelector('.uc-free').textContent = `${fmt(arcade.snapshot().customBonusRemaining)} lượt miễn phí · Gói thưởng ×1`;
    controls.querySelectorAll('[data-batch]').forEach(button => {
      const offer = Number(button.dataset.batch) === 10 ? quote : batch.quote(100);
      button.disabled = pending || !offer.available;
      button.querySelector('small').textContent = `${offer.cost ? fmt(offer.cost) + ' ₽ cho cả gói' : 'Miễn phí cả gói'}`;
      button.title = offer.reason || '';
    });
    controls.querySelector('.uc-batch-result').textContent = resultText || quote.reason || '';
    const details = controls.querySelector('.uc-reward-details');
    details.hidden = !rewardText; details.querySelector('p').textContent = rewardText;
  }
  function install(game, service, adapter) {
    if (engine) return;
    engine = game; arcade = service; batch = adapter;
    const casino = engine.Screens.casino;
    ['init', 'render', 'enter'].forEach(name => {
      const original = casino[name];
      casino[name] = function (...args) { const result = original?.apply(this, args); render(); return result; };
    });
    render();
  }
  root.UmiCasinoUI = { install, mount: render, render, refresh: updateControls };
})(globalThis);
