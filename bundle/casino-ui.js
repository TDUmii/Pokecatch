(function (root) {
  'use strict';
  let engine, arcade, screen;
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
        root.UmiArcadeUI.render(); updateFreeHint();
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
    let hint = screen.querySelector('.uc-free-hint');
    if (!hint) {
      hint = document.createElement('p'); hint.className = 'uc-free-hint';
      tabs.after(hint);
    }
    select(); updateFreeHint();
  }
  function updateFreeHint() {
    const hint = screen?.querySelector('.uc-free-hint');
    if (!hint) return;
    const free = arcade.state().nativeFree + arcade.quantity('umi-spin-ticket');
    hint.hidden = screen.dataset.tab !== 'slots' || !free;
    hint.textContent = fmt(free) + ' lượt miễn phí. Vé tự dùng khi nhấn QUAY.';
  }

  function install(game, service) {
    if (engine) return;
    engine = game; arcade = service;
    const casino = engine.Screens.casino;
    ['init', 'render', 'enter'].forEach(name => {
      const original = casino[name];
      casino[name] = function (...args) { const result = original?.apply(this, args); render(); return result; };
    });
    render();
  }
  root.UmiCasinoUI = { install, mount: render, render, refresh: updateFreeHint };
})(globalThis);
