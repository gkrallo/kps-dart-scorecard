/* ==========================================================================
   result.js - slutskärmen när matchen är avgjord
   ========================================================================== */
(function (Dart) {
  'use strict';

  var esc = Dart.dom.esc;
  var num = Dart.dom.num;

  function summaryX01(st) {
    var rows = st.players
      .slice()
      .sort(function (a, b) {
        return a.score - b.score;
      })
      .map(function (p) {
        return (
          '<tr>' +
          '<td class="name">' + esc(p.name) + '</td>' +
          '<td>' + p.score + '</td>' +
          '<td>' + num(Dart.stats.avg3(p.pointsScored, p.dartsThrown)) + '</td>' +
          '<td>' + (p.turns.length ? Math.max.apply(null, p.turns) : 0) + '</td>' +
          '<td>' + (p.checkout || '–') + '</td>' +
          '</tr>'
        );
      })
      .join('');
    return (
      '<table class="summary"><thead><tr>' +
      '<th>Spelare</th><th>Kvar</th><th>Snitt</th><th>Bästa</th><th>Utgång</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>'
    );
  }

  function summaryFarfar(st) {
    var rows = st.players
      .slice()
      .sort(function (a, b) {
        var ra = a.eliminatedRound === null ? 999 : a.eliminatedRound;
        var rb = b.eliminatedRound === null ? 999 : b.eliminatedRound;
        return rb - ra || b.savedDarts - a.savedDarts;
      })
      .map(function (p) {
        return (
          '<tr>' +
          '<td class="name">' + esc(p.name) + '</td>' +
          '<td>' + (p.eliminatedRound === null ? 'Kvar' : 'Runda ' + p.eliminatedRound) + '</td>' +
          '<td>' + p.savedDarts + '</td>' +
          '<td>' + p.dartsThrown + '</td>' +
          '<td>' + p.pointsScored + '</td>' +
          '</tr>'
        );
      })
      .join('');
    return (
      '<table class="summary"><thead><tr>' +
      '<th>Spelare</th><th>Slut</th><th>Sparade</th><th>Pilar</th><th>Poäng</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>'
    );
  }

  function render(app) {
    var st = Dart.match.state(app.match);
    var solo = st.players.length === 1;
    var shared = st.winners.length > 1;

    var headline;
    var sub;
    if (st.mode === 'FARFAR' && solo) {
      headline = 'Runda ' + st.finalRound;
      sub = 'Så långt kom du';
    } else {
      headline = st.winners.join(' & ') || 'Ingen';
      sub = shared ? 'Delad vinst!' : 'Vinnare!';
    }

    return (
      '<div class="result">' +
      '<div class="trophy" aria-hidden="true">🏆</div>' +
      '<h2 class="winner">' + esc(headline) + '</h2>' +
      '<p class="winner-sub">' + esc(sub) + '</p>' +
      (st.mode === 'FARFAR' ? summaryFarfar(st) : summaryX01(st)) +
      '<div class="result-actions">' +
      '<button class="btn primary" data-act="again">Kör igen</button>' +
      '<button class="btn ghost" data-act="undo-result">↶ Ångra sista</button>' +
      '<button class="btn ghost" data-act="menu-force">Meny</button>' +
      '</div>' +
      '<p class="hint">"Ångra sista" tar tillbaka matchen om någon råkade knappa in fel avslut.</p>' +
      '</div>'
    );
  }

  Dart.ui = Dart.ui || {};
  Dart.ui.result = { render: render };
})(window.Dart);
