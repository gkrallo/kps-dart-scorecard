/* ==========================================================================
   history.js - sparade matcher och statistik per spelare
   ========================================================================== */
(function (Dart) {
  'use strict';

  var esc = Dart.dom.esc;
  var num = Dart.dom.num;

  function matchRow(m) {
    var winners = (m.winners || []).join(' & ') || '–';
    var names = m.players
      .map(function (p) {
        return p.name;
      })
      .join(', ');
    var extra =
      m.mode === 'FARFAR'
        ? 'Rundor: ' + (m.rounds || '–')
        : (m.doubleOut ? 'Dubbel ut' : 'Valfri ut');
    return (
      '<li class="hist-row">' +
      '<div class="hist-main">' +
      '<div class="hist-top"><span class="badge">' + esc(Dart.dom.modeLabel(m.mode)) + '</span>' +
      '<strong>' + esc(winners) + '</strong></div>' +
      '<div class="hist-sub">' + esc(Dart.dom.dateLabel(m.date)) + ' · ' + esc(extra) + '</div>' +
      '<div class="hist-sub dim">' + esc(names) + '</div>' +
      '</div>' +
      '<button class="icon-btn danger" data-act="del-match" data-id="' + esc(m.id) + '" aria-label="Ta bort match">&times;</button>' +
      '</li>'
    );
  }

  function statItem(value, label) {
    return '<div class="stat-item"><em>' + esc(value) + '</em><span>' + esc(label) + '</span></div>';
  }

  function statsCards(rows) {
    if (!rows.length) return '<p class="empty-state">Ingen statistik än. Spela en match!</p>';
    return (
      '<ul class="stat-list">' +
      rows
        .map(function (s) {
          var items = '';
          if (s.x01Matches) {
            items +=
              statItem(num(s.avg3), 'Snitt (3 pilar)') +
              statItem(s.bestTurn || '–', 'Bästa tur') +
              statItem(s.bestCheckout || '–', 'Bästa utgång') +
              statItem(s.n180 || 0, 'Antal 180');
          }
          if (s.farfarMatches) {
            items +=
              statItem(s.farfarWins + '/' + s.farfarMatches, 'Farfar-vinster') +
              statItem(s.farfarBestRound || '–', 'Längsta runda');
          }
          return (
            '<li class="stat-card">' +
            '<div class="stat-head"><strong>' + esc(s.name) + '</strong>' +
            '<span>' + s.matches + (s.matches === 1 ? ' match' : ' matcher') + ' · ' +
            s.wins + (s.wins === 1 ? ' vinst' : ' vinster') + '</span></div>' +
            '<div class="stat-grid">' + items + '</div>' +
            '</li>'
          );
        })
        .join('') +
      '</ul>'
    );
  }

  function render(app) {
    var history = Dart.storage.loadHistory();
    var tab = app.ui.historyTab || 'matches';

    var body;
    if (tab === 'stats') {
      body = statsCards(Dart.stats.aggregate(history));
    } else if (!history.length) {
      body = '<p class="empty-state">Inga sparade matcher än.</p>';
    } else {
      body = '<ul class="hist-list">' + history.map(matchRow).join('') + '</ul>';
    }

    return (
      '<div class="page">' +
      '<header class="topbar">' +
      '<button class="chip" data-act="back">← Tillbaka</button>' +
      '<div class="topbar-title"><strong>Historik</strong><span>' +
      history.length + (history.length === 1 ? ' match' : ' matcher') + '</span></div>' +
      '<button class="chip danger"' + (history.length ? '' : ' disabled') + ' data-act="clear-history">Rensa</button>' +
      '</header>' +
      '<div class="tabs">' +
      '<button class="tab' + (tab === 'matches' ? ' active' : '') + '" data-act="hist-tab" data-tab="matches">Matcher</button>' +
      '<button class="tab' + (tab === 'stats' ? ' active' : '') + '" data-act="hist-tab" data-tab="stats">Statistik</button>' +
      '</div>' +
      '<div class="page-body">' + body + '</div>' +
      '</div>'
    );
  }

  Dart.ui = Dart.ui || {};
  Dart.ui.history = { render: render };
})(window.Dart);
