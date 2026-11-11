/* Atomic instant batches for the native casino reels and existing arcade gifts. */
(() => {
  'use strict';
  let engine, arcade, native, busy = false;
  const fail = message => { throw new Error(message); };
  function quote(count) {
    const valid = [10, 100].includes(count);
    const s = arcade.state();
    const free = valid ? Math.min(count, s.nativeFree + arcade.quantity('umi-spin-ticket')) : 0;
    const paid = valid ? count - free : 0;
    const cost = paid ? 1000 : 0;
    const reason = !valid ? 'Chọn 10 hoặc 100 lượt quay.' : busy || !native.ready() ? 'Máy đang quay, hãy đợi một chút.' : engine.TabLock?.lost ? 'Game đang chạy ở cửa sổ khác.' : engine.Game.S.money < cost ? 'Chưa đủ Pokédollar cho gói quay này.' : '';
    return { count, cost, free, paid, available: !reason, reason };
  }
  async function spin(count) {
    const initial = quote(count);
    if (!initial.available) fail(initial.reason);
    busy = true;
    try {
      // One microtask keeps simultaneous clicks behind the same guard; reels never wait.
      await Promise.resolve();
      if (!native.ready()) fail('Máy đang quay, hãy đợi một chút.');
      const summary = arcade.transact(() => {
        const s = arcade.state(), game = engine.Game;
        if (engine.TabLock?.lost) fail('Game đang chạy ở cửa sổ khác.');
        const free = Math.min(count, s.nativeFree + arcade.quantity('umi-spin-ticket'));
        const paid = count - free, cost = paid ? 1000 : 0;
        if (game.S.money < cost) fail('Chưa đủ Pokédollar cho gói quay này.');
        if (cost) game.spend(cost, 'casino');
        native.ledger().spent = (native.ledger().spent || 0) + cost;
        // Reserve the quoted free turns first. Newly won turns stay for the next package.
        const nativeFree = Math.min(free, s.nativeFree);
        s.nativeFree -= nativeFree;
        s.items['umi-spin-ticket'] -= free - nativeFree;
        const summary = { count, cost, free, paid, coins: 0, wins: 0, rewards: [] };
        const gifts = new Map();
        for (let i = 0; i < count; i++) {
          const outcome = native.preview();
          native.credit(outcome);
          const coins = outcome.result.pay ?? outcome.result.total;
          if (!Number.isFinite(coins) || coins < 0) fail('Kết quả máy quay không hợp lệ.');
          summary.coins += coins;
          if (coins > 0) summary.wins++;
          const result = window.UmiArcadeRules.spin(s, 'supply', { bonus: i < free });
          for (const reward of result.rewards) {
            arcade.grant(reward);
            const key = reward.kind === 'money' ? 'money' : reward.id;
            const entry = gifts.get(key) || { ...reward, [reward.kind === 'money' ? 'amount' : 'qty']: 0 };
            const field = reward.kind === 'money' ? 'amount' : 'qty';
            entry[field] += reward[field];
            gifts.set(key, entry);
          }
          s.nativeFree += result.bonusSpins;
          const at = Date.now();
          s.history[s.history.length - 1].at = at;
          s.lastNativeReward = { ...result, kind: 'slots', at };
          summary.lastOutcome = outcome;
        }
        s.nativeReceipts.slots = native.ledger().spins;
        summary.rewards = [...gifts.values()];
        return summary;
      });
      // Rendering is a projection of the committed transaction, never a second payout.
      try { native.renderBatch(summary.lastOutcome, summary); }
      catch (error) { console.error('Casino batch render:', error); }
      return summary;
    } finally { busy = false; }
  }
  window.UmiCasinoBatch = { install(e, a, n) { engine = e; arcade = a; native = n; }, quote, spin };
})();
