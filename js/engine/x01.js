/* ==========================================================================
   x01.js - reglerna för 301 och 501.
   Rena funktioner: samma pilar in ger alltid samma ställning ut. Därför kan
   vilken pil som helst ångras eller rättas i efterhand - allt räknas om.
   ========================================================================== */
(function (Dart) {
  'use strict';

  var S = Dart.seg;

  function init(cfg) {
    return {
      mode: cfg.mode,
      finished: false,
      winners: [],
      turnNo: 1,
      currentIndex: 0,
      currentDarts: [],
      lastEvent: null,
      players: cfg.players.map(function (p) {
        return {
          id: p.id,
          name: p.name,
          score: cfg.start,
          lastTurnScore: null,
          dartsThrown: 0,
          pointsScored: 0,
          turns: [],
          checkout: null
        };
      })
    };
  }

  /* Hur turen ligger till just nu, innan den bekräftas. */
  function pending(st, cfg) {
    var p = st.players[st.currentIndex];
    var total = S.sum(st.currentDarts);
    var remaining = p ? p.score - total : 0;
    var bust = false;
    var win = false;

    if (remaining < 0) {
      bust = true;
    } else if (remaining === 0) {
      if (cfg.doubleOut) {
        var last = st.currentDarts[st.currentDarts.length - 1];
        if (last && S.isDouble(last)) win = true;
        else bust = true;
      } else {
        win = true;
      }
    } else if (remaining === 1 && cfg.doubleOut) {
      /* 1 kvar går inte att gå ut på med dubbel */
      bust = true;
    }

    return { total: total, remaining: remaining, bust: bust, win: win };
  }

  function canThrow(st, cfg) {
    if (st.finished) return false;
    if (st.currentDarts.length >= 3) return false;
    var p = pending(st, cfg);
    return !p.bust && !p.win;
  }

  function throwDart(st, cfg, dart) {
    if (!canThrow(st, cfg)) return false;
    st.currentDarts.push(dart);
    st.lastEvent = null;
    var p = pending(st, cfg);
    if (p.bust) st.lastEvent = { type: 'BUST', name: st.players[st.currentIndex].name };
    if (p.win) st.lastEvent = { type: 'WIN', name: st.players[st.currentIndex].name };
    return true;
  }

  function endTurn(st, cfg) {
    if (st.finished) return false;
    var p = st.players[st.currentIndex];
    var res = pending(st, cfg);

    p.dartsThrown += st.currentDarts.length;

    if (res.win) {
      p.pointsScored += res.total;
      p.turns.push(res.total);
      p.lastTurnScore = res.total;
      p.checkout = res.total;
      p.score = 0;
      st.finished = true;
      st.winners = [p.name];
    } else if (res.bust) {
      /* Tjock: turen räknas som 0, poängen står kvar */
      p.turns.push(0);
      p.lastTurnScore = 0;
    } else {
      p.score = res.remaining;
      p.pointsScored += res.total;
      p.turns.push(res.total);
      p.lastTurnScore = res.total;
    }

    st.currentDarts = [];
    st.lastEvent = null;
    if (!st.finished) {
      st.currentIndex = (st.currentIndex + 1) % st.players.length;
      if (st.currentIndex === 0) st.turnNo++;
    }
    return true;
  }

  /* Info som vyn behöver för den aktiva spelaren */
  function view(st, cfg) {
    var res = pending(st, cfg);
    var dartsLeft = 3 - st.currentDarts.length;
    var suggestion = null;
    if (!res.bust && !res.win && dartsLeft > 0) {
      suggestion = S.checkout(res.remaining, dartsLeft, cfg.doubleOut);
    }
    return {
      total: res.total,
      remaining: res.remaining,
      bust: res.bust,
      win: res.win,
      dartsLeft: dartsLeft,
      available: 3,
      checkout: suggestion
    };
  }

  Dart.x01 = {
    init: init,
    throwDart: throwDart,
    endTurn: endTurn,
    pending: pending,
    view: view,
    hasEndTurn: true
  };
})(window.Dart);
