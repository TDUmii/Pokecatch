/* Small bridge to the original casino. Batch rules and UI live in separate modules. */
(function (root) {
  'use strict';
  root.UmiCasinoBridge = {
    create({ game, ledger, ready, draw, evaluate, reels, lines, renderStops }) {
      return {
        ready,
        ledger,
        preview() {
          const stops = root.UmiArcadeRules.boostNativeStops(draw(), reels, lines(), ledger(), evaluate);
          const result = evaluate(stops);
          result.pay = result.total;
          return { stops, result };
        },
        credit(outcome) {
          const record = ledger(), pay = outcome.result.pay;
          record.spins++;
          record.bets = (record.bets || 0) + 1;
          record.bets2 = (record.bets2 || 0) + 1;
          if (pay) { game.coinIn(pay); record.won += pay; }
          return { spin: record.spins, pay };
        },
        renderBatch(outcome) { if (outcome) renderStops(outcome.stops); }
      };
    }
  };
})(window);
