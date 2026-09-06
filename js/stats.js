/* ==========================================================================
   stats.js - resultat per match och sammanräknad statistik per spelare
   ========================================================================== */
(function (Dart) {
  'use strict';

  function avg3(points, darts) {
    if (!darts) return 0;
    return (points / darts) * 3;
  }

  function countTurns(turns, limit) {
    return turns.filter(function (t) {
      return t >= limit;
    }).length;
  }

  function buildResult(match, st) {
    var cfg = match.config;
    return {
      id: match.id,
      date: new Date().toISOString(),
      mode: cfg.mode,
      doubleOut: !!cfg.doubleOut,
      farfarCap: !!cfg.farfarCap,
      winners: st.winners.slice(),
      rounds: cfg.mode === 'FARFAR' ? st.finalRound : st.turnNo,
      players: st.players.map(function (p) {
        var best = p.turns.length ? Math.max.apply(null, p.turns) : 0;
        return {
          name: p.name,
          darts: p.dartsThrown,
          points: p.pointsScored,
          avg3: avg3(p.pointsScored, p.dartsThrown),
          bestTurn: best,
          checkout: p.checkout || null,
          n180: countTurns(p.turns, 180),
          n100: countTurns(p.turns, 100),
          savedDarts: p.savedDarts === undefined ? null : p.savedDarts,
          eliminatedRound: p.eliminatedRound === undefined ? null : p.eliminatedRound,
          remaining: p.score === undefined ? null : p.score
        };
      })
    };
  }

  function key(name) {
    return String(name || '').trim().toLowerCase();
  }

  /* Slår ihop alla sparade matcher till en rad per spelare. */
  function aggregate(history) {
    var byPlayer = {};

    history.forEach(function (m) {
      var isX01 = m.mode !== 'FARFAR';
      m.players.forEach(function (p) {
        var k = key(p.name);
        if (!k) return;
        if (!byPlayer[k]) {
          byPlayer[k] = {
            name: p.name,
            matches: 0,
            wins: 0,
            x01Matches: 0,
            x01Points: 0,
            x01Darts: 0,
            bestTurn: 0,
            bestCheckout: 0,
            n180: 0,
            farfarMatches: 0,
            farfarWins: 0,
            farfarBestRound: 0
          };
        }
        var s = byPlayer[k];
        s.matches++;
        var won = (m.winners || []).some(function (w) {
          return key(w) === k;
        });
        if (won) s.wins++;

        if (isX01) {
          s.x01Matches++;
          s.x01Points += p.points || 0;
          s.x01Darts += p.darts || 0;
          s.bestTurn = Math.max(s.bestTurn, p.bestTurn || 0);
          s.bestCheckout = Math.max(s.bestCheckout, p.checkout || 0);
          s.n180 += p.n180 || 0;
        } else {
          s.farfarMatches++;
          if (won) s.farfarWins++;
          var reached = p.eliminatedRound || m.rounds || 0;
          s.farfarBestRound = Math.max(s.farfarBestRound, reached);
        }
      });
    });

    return Object.keys(byPlayer)
      .map(function (k) {
        var s = byPlayer[k];
        s.avg3 = avg3(s.x01Points, s.x01Darts);
        return s;
      })
      .sort(function (a, b) {
        return b.wins - a.wins || b.matches - a.matches;
      });
  }

  Dart.stats = {
    buildResult: buildResult,
    aggregate: aggregate,
    avg3: avg3
  };
})(window.Dart);
