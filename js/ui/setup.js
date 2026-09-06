/* ==========================================================================
   setup.js - startskärmen: spelläge, inställningar och spelare
   ========================================================================== */
(function (Dart) {
  'use strict';

  var esc = Dart.dom.esc;

  /* Körs appen redan som installerad app? Då behövs ingen installera-knapp. */
  function isInstalled() {
    try {
      return (
        window.navigator.standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches
      );
    } catch (e) {
      return false;
    }
  }

  function toggleRow(key, on, title, text) {
    return (
      '<button class="row toggle-row" data-act="toggle" data-key="' + key + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
      '<span class="row-text"><span class="row-title">' + esc(title) + '</span>' +
      '<span class="row-sub">' + esc(text) + '</span></span>' +
      '<span class="switch ' + (on ? 'on' : '') + '"><span class="knob"></span></span>' +
      '</button>'
    );
  }

  function playerRow(p, index, total) {
    return (
      '<li class="player-row">' +
      '<span class="player-order">' + (index + 1) + '</span>' +
      '<span class="player-name">' + esc(p.name) + '</span>' +
      '<span class="player-tools">' +
      (index > 0
        ? '<button class="icon-btn" data-act="up-player" data-id="' + esc(p.id) + '" aria-label="Flytta upp ' + esc(p.name) + '">&#9650;</button>'
        : '<span class="icon-btn ghost" aria-hidden="true"></span>') +
      '<button class="icon-btn danger" data-act="rm-player" data-id="' + esc(p.id) + '" aria-label="Ta bort ' + esc(p.name) + '">&times;</button>' +
      '</span>' +
      '</li>'
    );
  }

  function render(app) {
    var s = app.settings;
    var isX01 = app.setup.mode !== 'FARFAR';
    var used = {};
    app.setup.players.forEach(function (p) {
      used[p.name.toLowerCase()] = true;
    });
    var suggestions = (s.lastPlayers || []).filter(function (n) {
      return !used[n.toLowerCase()];
    });

    var resume = '';
    if (app.savedMatch) {
      var sm = app.savedMatch;
      resume =
        '<div class="card resume">' +
        '<div class="resume-text"><strong>Pågående match</strong><span>' +
        esc(Dart.dom.modeLabel(sm.config.mode)) + ' · ' +
        esc(sm.config.players.map(function (p) { return p.name; }).join(', ')) +
        '</span></div>' +
        '<div class="resume-buttons">' +
        '<button class="btn primary" data-act="resume">Fortsätt</button>' +
        '<button class="btn ghost" data-act="discard">Släng</button>' +
        '</div></div>';
    }

    return (
      '<div class="setup-wrap">' +
      '<div class="setup-card card">' +
      '<div class="setup-head">' +
      '<div class="brand"><span class="brand-mark" aria-hidden="true"></span><h1>Dartkoll</h1></div>' +
      '<div class="setup-head-tools">' +
      (isInstalled() ? '' : '<button class="chip" data-act="install">Installera</button>') +
      '<button class="chip" data-act="history">Historik</button>' +
      '<button class="chip" data-act="rules">Regler</button>' +
      '</div></div>' +

      resume +

      '<h2 class="label">Välj spel</h2>' +
      '<div class="mode-grid">' +
      ['301', '501', 'FARFAR']
        .map(function (m) {
          return (
            '<button class="mode-btn' + (app.setup.mode === m ? ' active' : '') + '" data-act="mode" data-mode="' + m + '">' +
            (m === 'FARFAR' ? 'Farfar' : m) +
            '</button>'
          );
        })
        .join('') +
      '</div>' +

      (isX01
        ? toggleRow('doubleOut', app.setup.doubleOut, 'Dubbel utgång', 'Sista pilen måste vara dubbel eller röd 50')
        : toggleRow('farfarCap', app.setup.farfarCap, 'Tak på 100 poäng', 'Matchen avgörs efter runda 18')) +

      '<h2 class="label">Spelare <span class="count">' + app.setup.players.length + '/' + Dart.CONFIG.maxPlayers + '</span></h2>' +
      '<form class="add-player" id="add-player-form" autocomplete="off">' +
      '<input id="new-player" type="text" inputmode="text" maxlength="14" placeholder="Lägg till spelare…" aria-label="Namn på ny spelare">' +
      '<button class="btn add" type="submit" aria-label="Lägg till">+</button>' +
      '</form>' +
      (suggestions.length
        ? '<div class="chips">' +
          suggestions
            .map(function (n) {
              return '<button class="chip" data-act="quick-add" data-name="' + esc(n) + '">+ ' + esc(n) + '</button>';
            })
            .join('') +
          '</div>'
        : '') +
      '<ul class="player-list">' +
      app.setup.players
        .map(function (p, i) {
          return playerRow(p, i, app.setup.players.length);
        })
        .join('') +
      '</ul>' +
      '<p class="hint">Turordningen är uppifrån och ner. Pilen flyttar en spelare uppåt.</p>' +

      '<button class="btn primary big" data-act="start"' + (app.setup.players.length ? '' : ' disabled') + '>Starta match</button>' +

      '<div class="settings-row">' +
      '<button class="chip' + (s.sound ? ' on' : '') + '" data-act="setting" data-key="sound">Ljud ' + (s.sound ? 'på' : 'av') + '</button>' +
      '<button class="chip' + (s.haptics ? ' on' : '') + '" data-act="setting" data-key="haptics">Vibration ' + (s.haptics ? 'på' : 'av') + '</button>' +
      '<button class="chip' + (s.checkoutHelp ? ' on' : '') + '" data-act="setting" data-key="checkoutHelp">Utgångshjälp ' + (s.checkoutHelp ? 'på' : 'av') + '</button>' +
      '</div>' +
      '<div class="version">v' + esc(Dart.CONFIG.version) + '</div>' +
      '</div>' +

      (Dart.CONFIG.showSponsor
        ? '<a class="sponsor" href="' + esc(Dart.CONFIG.sponsorUrl) + '" target="_blank" rel="noopener noreferrer">☕ Bjud på en kaffe</a>'
        : '') +
      '</div>'
    );
  }

  Dart.ui = Dart.ui || {};
  Dart.ui.setup = { render: render };
})(window.Dart);
