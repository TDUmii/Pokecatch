(function (root) {
  'use strict';
  let installed = false, portal, active, previousDescription;
  const tipSelector = '.bag-tip,.info-tip-box,[role="tooltip"]';
  function position(anchor, size, viewport) {
    const margin = 12, gap = 8;
    const left = Math.max(margin, Math.min(anchor.left + anchor.width / 2 - size.width / 2, viewport.width - size.width - margin));
    const below = anchor.bottom + gap;
    const top = below + size.height <= viewport.height - margin ? below : Math.max(margin, anchor.top - size.height - gap);
    return { left, top };
  }
  function hide() {
    if (!active) return;
    if (previousDescription === null) active.removeAttribute('aria-describedby');
    else active.setAttribute('aria-describedby', previousDescription);
    active = null; portal.hidden = true; portal.dataset.pinned = '';
  }
  function show(host) {
    const tip = host.querySelector(tipSelector);
    if (!tip) return;
    if (active !== host) { hide(); active = host; previousDescription = host.getAttribute('aria-describedby'); }
    portal.innerHTML = tip.innerHTML;
    portal.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    portal.hidden = false;
    host.setAttribute('aria-describedby', portal.id);
    const box = host.getBoundingClientRect();
    const point = position(box, portal.getBoundingClientRect(), { width: innerWidth, height: innerHeight });
    portal.style.left = `${point.left}px`; portal.style.top = `${point.top}px`;
  }
  function hostFor(target) {
    const card = target.closest?.('.dexcard.v2');
    if (!card) return null;
    let node = target;
    while (node && node !== card) {
      if (node.matches?.('[data-umi-card-help]')) return node;
      node = node.parentElement;
    }
    return null;
  }
  function prepare() {
    document.querySelectorAll('.dexcard.v2').forEach(card => {
      card.querySelectorAll(tipSelector).forEach(tip => {
        if (tip.parentElement.closest(tipSelector)) return;
        const host = tip.parentElement;
        host.dataset.umiCardHelp = '';
        if (!host.matches('button,a,input,select,textarea,[tabindex]')) host.tabIndex = 0;
      });
    });
    if (active && !active.isConnected) hide();
  }
  function install() {
    if (installed || !document.body) return;
    installed = true;
    portal = document.createElement('div'); portal.id = 'umi-pokemon-tooltip';
    portal.setAttribute('role', 'tooltip'); portal.hidden = true; document.body.append(portal);
    prepare();
    const observer = new MutationObserver(prepare);
    observer.observe(document.getElementById('modal-root') || document.body, { childList: true, subtree: true });
    document.addEventListener('pointerover', event => { if (event.pointerType === 'touch') return; const host = hostFor(event.target); if (host) show(host); });
    document.addEventListener('pointerout', event => { if (active && !active.contains(event.relatedTarget)) hide(); });
    document.addEventListener('focusin', event => { const host = hostFor(event.target); if (host) show(host); else hide(); });
    document.addEventListener('focusout', event => { if (active && !active.contains(event.relatedTarget)) hide(); });
    document.addEventListener('click', event => {
      const host = hostFor(event.target);
      if (!host) { hide(); return; }
      if (event.detail === 0 || event.pointerType === 'touch' || !matchMedia('(hover:hover)').matches) {
        if (active === host && portal.dataset.pinned === 'true') { hide(); portal.dataset.pinned = ''; }
        else { show(host); portal.dataset.pinned = 'true'; }
      }
    }, true);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') hide();
      const host = hostFor(event.target);
      if (host && !host.matches('button,a,input,select,textarea') && ['Enter', ' '].includes(event.key)) { event.preventDefault(); show(host); }
    });
    document.addEventListener('scroll', hide, true); addEventListener('resize', hide);
  }
  root.UmiPokemonCard = { install, position };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
    else install();
  }
})(globalThis);
