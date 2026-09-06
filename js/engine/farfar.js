/* ==========================================================================
   farfar.js - reglerna för Farfar (husregler, bekräftade av Kristian):

   * Runda 1 kräver 15 poäng. Målet ökar med 5 poäng per runda
     (15, 20, 25, 30 ... runda 18 = 100).
   * Du kastar med 3 grundpilar + alla pilar du sparat tidigare. Sparade
     pilar staplas på varandra utan tak.
   * Så fort du nått målet är turen slut och pilarna du har kvar sparas.
   * RÖD BULL (50) avslutar turen direkt och sparar resten av pilarna, även
     om du inte nått målet. Grön bull (25) är bara 25 poäng.
   * Når du inte målet innan pilarna tar slut är du utslagen.
   * Rundan spelas alltid färdigt - alla som lever när rundan börjar får
     kasta, så ingen vinner bara för att hen står sist i turordningen.
   * Sista kvarvarande spelaren vinner. Slås alla ut i samma runda vinner
     den som fick högst poäng den rundan (delad vinst vid lika).
   * Med "Tak på 100" avgörs matchen efter runda 18 - flest sparade pilar
     vinner.
   ========================================================================== */
(function (Dart) {
  'use strict';

  var S = Dart.seg;

  function targetFor(round) {
    var f = Dart.CONFIG.farfar;
    return f.startTarget + (round - 1) * f.step;
  }

  function init(cfg) {
    return {
      mode: 'FARFAR',
      finished: false,
      winners: [],
      currentIndex: 0,
      round: 1,
      order: cfg.players.map(function (_, i) {
        return i;
      }),
      pos: 0,
      currentDarts: [],
      lastEvent: null,
      finalRound: null,
      players: cfg.players.map(function (p) {
        return {
          id: p.id,
          name: p.name,
          savedDarts: 0,
          eliminated: false,
          eliminatedRound: null,
          roundScore: null,
          lastTurnScore: null,
          dartsThrown: 0,
          pointsScored: 0,
          turns: []
        };
      })
    };
  }

  function currentIndex(st) {
    var i = st.order[st.pos];
    return i === undefined ? st.currentIndex || 0 : i;
  }

  /* Håller st.currentIndex i synk så att resten av appen kan läsa den
     på samma sätt oavsett spelläge. */
  function sync(st) {
    var i = st.order[st.pos];
    if (i !== undefined) st.currentIndex = i;
    return st;
  }

  function availableFor(player) {
    return 3 + player.savedDarts;
  }

  function canThrow(st) {
    if (st.finished) return false;
    var p = st.players[currentIndex(st)];
    if (!p) return false;
    return st.currentDarts.length < availableFor(p);
  }

  function throwDart(st, cfg, dart) {
    if (!canThrow(st)) return false;

    var p = st.players[currentIndex(st)];
    var available = availableFor(p);
    st.currentDarts.push(dart);
    st.lastEvent = null;

    var total = S.sum(st.currentDarts);
    var target = targetFor(st.round);
    var redBull = dart.v === 25 && dart.m === 2;

    var result = null;
    if (redBull) result = 'BULL';
    else if (total >= target) result = 'CLEARED';
    else if (st.currentDarts.length >= available) result = 'ELIMINATED';

    if (result) finishTurn(st, cfg, result, total, available);
    sync(st);
    return true;
  }

  function finishTurn(st, cfg, result, total, available) {
    var p = st.players[currentIndex(st)];

    p.dartsThrown += st.currentDarts.length;
    p.pointsScored += total;
    p.turns.push(total);
    p.roundScore = total;
    p.lastTurnScore = total;

    if (result === 'ELIMINATED') {
      p.eliminated = true;
      p.eliminatedRound = st.round;
    } else {
      p.savedDarts = available - st.currentDarts.length;
    }

    st.lastEvent = {
      type: result,
      name: p.name,
      saved: p.savedDarts,
      total: total,
      round: st.round
    };
    st.currentDarts = [];
    advance(st, cfg);
  }

  function advance(st, cfg) {
    st.pos++;
    if (st.pos < st.order.length) return; // fler spelare kvar i rundan

    /* Rundan är färdigspelad - nu avgörs den */
    var round = st.round;
    var alive = st.players.filter(function (p) {
      return !p.eliminated;
    });

    if (alive.length === 0) {
      var died = st.players.filter(function (p) {
        return p.eliminatedRound === round;
      });
      var best = died.reduce(function (m, p) {
        return Math.max(m, p.roundScore || 0);
      }, -1);
      st.winners = died
        .filter(function (p) {
          return (p.roundScore || 0) === best;
        })
        .map(function (p) {
          return p.name;
        });
      return end(st, round);
    }

    if (alive.length === 1 && st.players.length > 1) {
      st.winners = [alive[0].name];
      return end(st, round);
    }

    if (cfg.farfarCap && round >= Dart.CONFIG.farfar.capRound) {
      var mostDarts = alive.reduce(function (m, p) {
        return Math.max(m, p.savedDarts);
      }, -1);
      st.winners = alive
        .filter(function (p) {
          return p.savedDarts === mostDarts;
        })
        .map(function (p) {
          return p.name;
        });
      return end(st, round);
    }

    /* Ny runda */
    st.round = round + 1;
    st.order = [];
    st.players.forEach(function (p, i) {
      if (!p.eliminated) {
        p.roundScore = null;
        st.order.push(i);
      }
    });
    st.pos = 0;
  }

  function end(st, round) {
    st.finished = true;
    st.finalRound = round;
  }

  function endTurn() {
    /* Farfar avslutar turen automatiskt - knappen finns inte */
    return false;
  }

  function view(st) {
    var p = st.players[currentIndex(st)];
    var available = p ? availableFor(p) : 3;
    return {
      total: S.sum(st.currentDarts),
      target: targetFor(st.round),
      available: available,
      dartsLeft: available - st.currentDarts.length,
      round: st.round
    };
  }

  Dart.farfar = {
    init: init,
    throwDart: throwDart,
    endTurn: endTurn,
    view: view,
    targetFor: targetFor,
    availableFor: availableFor,
    currentIndex: currentIndex,
    hasEndTurn: false
  };
})(window.Dart);
