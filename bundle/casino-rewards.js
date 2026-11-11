/* Ordinary slot/Pachinko settlement. Batch settlement is owned by casino-batch.js. */
(function (root) {
  'use strict';
  root.UmiCasinoRewards = {
    install(engine, service) {
      root.__umiCasinoStops = root.UmiArcadeRules.boostNativeStops;
      root.__umiCasinoFreeAvailable = () => service.state().nativeFree + service.quantity('umi-spin-ticket') > 0;
      root.__umiCasinoReward = (kind, meta) => {
        try {
          const key = kind === 'slots' ? meta.spin : meta.batch;
          if (!Number.isFinite(key) || key <= (service.state().nativeReceipts[kind] || 0)) return;
          service.transact(() => {
            const state = service.state(), free = kind === 'slots' && meta.cost === 0;
            if (free) {
              if (state.nativeFree > 0) state.nativeFree--;
              else state.items['umi-spin-ticket']--;
            }
            const result = root.UmiArcadeRules.spin(state, kind === 'slots' ? 'supply' : 'evolution', { bonus: free });
            result.rewards.forEach(service.grant);
            state.nativeFree += result.bonusSpins;
            state.nativeReceipts[kind] = key;
            state.lastNativeReward = { ...result, kind, at: Date.now() };
            state.history.at(-1).at = Date.now();
          });
          const label = document.querySelector('#screen-casino .cs-slots .cs-betv');
          if (label && kind === 'slots') label.textContent = root.__umiCasinoFreeAvailable() ? 'Miễn phí' : `${Number(meta.bet || meta.cost).toLocaleString('vi-VN')} ₽`;
        } catch (error) {
          console.error('Casino reward:', error);
          engine.UI.toast('Chưa nhận được quà bổ sung. Phần thưởng máy quay vẫn được giữ.');
        }
      };
    }
  };
})(window);
