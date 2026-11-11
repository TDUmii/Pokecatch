/* Presentation pacing only. Native Adventure.step still owns every game result. */
(function (root) {
  'use strict';
  const routine = new Set(['battleStart','attack','rage','enemyKo','allyKo','send','status','xp','buddyCandy','capture','captureSkip','fled','victory','heal','berry','item','soul','skip']);
  let lastStart = null;
  function canCompact(events, { speed, visible, blocked }) {
    if (speed < 10 || !visible || blocked || !Array.isArray(events) || !events.length) return false;
    return events.every(event => {
      if (!routine.has(event.type)) return false;
      if (event.evolve || [...(event.fed || []), ...(event.candy?.fed || [])].some(reward => reward.evolve)) return false;
      if (event.type === 'battleStart') return !event.gym && !event.node?.zone && !event.roam && !event.node?.special && ['wild','trainer'].includes(event.kind) && !(event.enemies || [event.enemy]).some(mon => mon?.shiny || mon?.legendary || mon?.mythical);
      if (event.type === 'capture') return !event.enemy?.shiny && !event.isNew && !event.roam && !event.event && !event.raid && !event.legend;
      if (event.type === 'victory') return !event.badge && !event.champion && ['wild','trainer'].includes(event.kind);
      return true;
    });
  }
  async function present(events, context) {
    if (!canCompact(events, context)) { lastStart = null; return false; }
    const now = context.now || (() => performance.now());
    const sleep = context.sleep || (ms => new Promise(resolve => setTimeout(resolve, ms)));
    const interval = Math.max(32, context.actionMs / context.speed);
    const current = now();
    if (lastStart !== null) await sleep(Math.max(0, interval - (current - lastStart)));
    if (context.current && !canCompact(events, { ...context, ...context.current() })) { lastStart = null; return false; }
    lastStart = now();
    try { context.render(events); }
    catch (error) { lastStart = null; console.error('Adventure presentation:', error); return true; }
    const capture = events.find(event => event.type === 'capture');
    const last = events.at(-1);
    const message = capture ? capture.success ? 'Đã bắt Pokémon' : 'Đã xử lý lượt bắt' : ({ battleStart:'Gặp đối thủ mới', attack:'Đang chiến đấu', victory:'Thắng trận', heal:'Đội đã hồi phục', item:'Đã nhận vật phẩm', berry:'Đội đã nhận quả mọng', enemyKo:'Đối thủ đã ngất' }[last.type] || 'Đang tiếp tục hành trình');
    context.caption?.(`×${context.speed} · ${message}`);
    const arena = typeof document === 'undefined' ? null : document.querySelector('#arena');
    if (arena) {
      arena.dataset.umiFast = 'true';
      arena.style.setProperty('--umi-adventure-pace', context.speed);
    }
    return true;
  }
  root.UmiAdventureSpeed = { canCompact, present, reset() {
    lastStart = null;
    if (typeof document !== 'undefined') document.querySelector('#arena')?.removeAttribute('data-umi-fast');
  } };
  root.__umiAdventurePresentFrame = present;
})(globalThis);
