/* ==========================================================================
   app.js - limmet: vilken skärm som visas och vad knapparna gör
   ========================================================================== */
(function (Dart) {
  'use strict';

  var $ = Dart.dom.$;

  var app = {
    settings: null,
    setup: { mode: '301', doubleOut: false, farfarCap: false, players: [] },
    match: null,
    savedMatch: null,
    screen: 'setup',
    ui: {
      multiplier: 1,
      flash: null,
      modal: null,
      correctTarget: null,
      historyTab: 'matches',
      focusInput: false
    },
    deferredInstall: null
  };
  Dart.app = app;

  var flashTimer = null;

  /* --- start ------------------------------------------------------------ */
  function boot() {
    app.settings = Dart.storage.loadSettings();
    Dart.settings = app.settings;

    app.setup.mode = app.settings.lastMode || '301';
    app.setup.doubleOut = !!app.settings.doubleOut;
    app.setup.farfarCap = !!app.settings.farfarCap;
    app.setup.players = (app.settings.lastPlayers || []).map(function (name, i) {
      return { id: 'p' + i + '-' + Date.now(), name: name };
    });

    var saved = Dart.storage.loadCurrent();
    app.savedMatch = saved && saved.actions && saved.actions.length ? saved : null;

    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      app.deferredInstall = e;
      render();
    });

    render();
    registerServiceWorker();
  }

  /* --- rendering -------------------------------------------------------- */
  function render() {
    var root = $('#app');
    var html = '';
    if (app.screen === 'setup') html = Dart.ui.setup.render(app);
    else if (app.screen === 'game') html = Dart.ui.game.render(app);
    else if (app.screen === 'result') html = Dart.ui.result.render(app);
    else if (app.screen === 'history') html = Dart.ui.history.render(app);
    root.innerHTML = html;

    var modalRoot = $('#modal-root');
    if (app.ui.modal === 'rules') modalRoot.innerHTML = Dart.ui.modals.rules();
    else if (app.ui.modal === 'correct') modalRoot.innerHTML = Dart.ui.modals.correction(app);
    else if (app.ui.modal === 'install') modalRoot.innerHTML = installModal();
    else modalRoot.innerHTML = '';

    document.body.classList.toggle('modal-open', !!app.ui.modal);

    if (app.screen === 'setup' && app.ui.focusInput) {
      var input = $('#new-player');
      if (input) input.focus();
      app.ui.focusInput = false;
    }
  }
  app.render = render;

  function installModal() {
    return (
      '<div class="modal-backdrop" data-act="close-modal">' +
      '<div class="modal" role="dialog" aria-modal="true" aria-label="Installera appen">' +
      '<div class="modal-head"><h2>Installera appen</h2>' +
      '<button class="icon-btn" data-act="close-modal" aria-label="Stäng">&times;</button></div>' +
      '<div class="modal-body">' +
      '<p class="modal-lead">Då startar Dartkoll som en vanlig app, utan adressfält, och fungerar utan nät.</p>' +
      '<section class="rules-section"><h3>iPhone / iPad</h3><ul>' +
      '<li>Öppna sidan i <strong>Safari</strong>.</li>' +
      '<li>Tryck på dela-ikonen (fyrkanten med pilen).</li>' +
      '<li>Välj <strong>Lägg till på hemskärmen</strong>.</li>' +
      '</ul></section>' +
      '<section class="rules-section"><h3>Android / Samsung</h3><ul>' +
      '<li>Öppna sidan i <strong>Chrome</strong>.</li>' +
      '<li>Meny (tre punkter) → <strong>Installera app</strong> eller <strong>Lägg till på startskärmen</strong>.</li>' +
      '</ul></section>' +
      '</div></div></div>'
    );
  }

  /* --- händelser -------------------------------------------------------- */
  function onSubmit(e) {
    if (e.target && e.target.id === 'add-player-form') {
      e.preventDefault();
      var input = $('#new-player');
      addPlayer(input ? input.value : '');
    }
  }

  function onClick(e) {
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el) return;
    /* backdrop stänger bara om man träffar backdropen själv */
    if (el.classList.contains('modal-backdrop') && e.target !== el) return;
    if (el.disabled) return;

    e.preventDefault();
    Dart.sound.unlock();
    var act = el.dataset.act;
    var handler = handlers[act];
    if (handler) handler(el, e);
  }

  /* --- setup ------------------------------------------------------------ */
  function addPlayer(rawName) {
    var name = String(rawName || '').trim();
    if (!name) return;
    if (app.setup.players.length >= Dart.CONFIG.maxPlayers) return;
    var exists = app.setup.players.some(function (p) {
      return p.name.toLowerCase() === name.toLowerCase();
    });
    if (exists) return;
    app.setup.players.push({ id: 'p' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), name: name });
    app.ui.focusInput = true;
    Dart.sound.tap();
    render();
  }

  function saveSetupToSettings() {
    app.settings.lastPlayers = app.setup.players.map(function (p) {
      return p.name;
    });
    app.settings.lastMode = app.setup.mode;
    app.settings.doubleOut = app.setup.doubleOut;
    app.settings.farfarCap = app.setup.farfarCap;
    Dart.storage.saveSettings(app.settings);
  }

  function startMatch() {
    if (!app.setup.players.length) return;
    saveSetupToSettings();
    Dart.storage.clearCurrent();
    app.match = Dart.match.create({
      mode: app.setup.mode,
      doubleOut: app.setup.doubleOut,
      farfarCap: app.setup.farfarCap,
      players: app.setup.players
    });
    Dart.match.commit(app.match);
    app.savedMatch = null;
    app.ui.multiplier = 1;
    app.ui.flash = null;
    app.screen = 'game';
    enterFullScreen();
    render();
  }

  /* --- spelet ----------------------------------------------------------- */
  function throwDart(dart) {
    if (app.ui.flash) return;
    var st = Dart.match.throwDart(app.match, dart);
    if (!st) return;
    app.ui.multiplier = 1;
    Dart.sound.dart();
    handleEvents(st);
    render();
  }

  function handleEvents(st) {
    if (st.mode === 'FARFAR') {
      if (st.lastEvent) {
        var type = st.lastEvent.type;
        app.ui.flash = st.lastEvent;
        if (type === 'BULL') Dart.sound.bull();
        else if (type === 'CLEARED') Dart.sound.cleared();
        else if (type === 'ELIMINATED') Dart.sound.bust();
        clearTimeout(flashTimer);
        flashTimer = setTimeout(function () {
          app.ui.flash = null;
          if (Dart.match.state(app.match).finished) {
            Dart.sound.win();
            app.screen = 'result';
          }
          render();
        }, 1400);
      }
      return;
    }
    if (st.view && st.view.bust) Dart.sound.bust();
    else if (st.view && st.view.win) Dart.sound.cleared();
  }

  function nextPlayer() {
    if (app.ui.flash) return;
    var st = Dart.match.endTurn(app.match);
    app.ui.multiplier = 1;
    if (st.finished) {
      Dart.sound.win();
      app.screen = 'result';
    } else {
      Dart.sound.tap();
    }
    render();
  }

  function leaveGame(force) {
    var st = app.match ? Dart.match.state(app.match) : null;
    if (!force && st && !st.finished && app.match.actions.length) {
      if (!window.confirm('Lämna matchen? Den sparas och du kan fortsätta senare.')) return;
    }
    exitFullScreen();
    if (st && st.finished) Dart.storage.clearCurrent();
    app.savedMatch = st && !st.finished && app.match.actions.length ? Dart.match.serialize(app.match) : null;
    app.match = null;
    app.ui.flash = null;
    app.screen = 'setup';
    render();
  }

  /* --- knapparnas beteende --------------------------------------------- */
  var handlers = {
    /* startskärm */
    mode: function (el) {
      app.setup.mode = el.dataset.mode;
      Dart.sound.tap();
      render();
    },
    toggle: function (el) {
      var key = el.dataset.key;
      app.setup[key] = !app.setup[key];
      Dart.sound.tap();
      render();
    },
    setting: function (el) {
      var key = el.dataset.key;
      app.settings[key] = !app.settings[key];
      Dart.storage.saveSettings(app.settings);
      Dart.sound.tap();
      render();
    },
    'quick-add': function (el) {
      addPlayer(el.dataset.name);
    },
    'rm-player': function (el) {
      app.setup.players = app.setup.players.filter(function (p) {
        return p.id !== el.dataset.id;
      });
      render();
    },
    'up-player': function (el) {
      var list = app.setup.players;
      var i = list.findIndex(function (p) {
        return p.id === el.dataset.id;
      });
      if (i > 0) {
        var tmp = list[i - 1];
        list[i - 1] = list[i];
        list[i] = tmp;
      }
      render();
    },
    start: startMatch,
    resume: function () {
      var restored = Dart.match.restore(app.savedMatch);
      if (!restored) return;
      app.match = restored;
      var st = Dart.match.state(app.match);
      app.screen = st.finished ? 'result' : 'game';
      app.savedMatch = null;
      app.ui.flash = null;
      render();
    },
    discard: function () {
      if (!window.confirm('Släng den pågående matchen?')) return;
      Dart.storage.clearCurrent();
      app.savedMatch = null;
      render();
    },
    install: function () {
      if (app.deferredInstall) {
        app.deferredInstall.prompt();
        app.deferredInstall = null;
        return;
      }
      app.ui.modal = 'install';
      render();
    },

    /* spelet */
    mult: function (el) {
      app.ui.multiplier = parseInt(el.dataset.m, 10);
      Dart.sound.tap();
      render();
    },
    dart: function (el) {
      var v = parseInt(el.dataset.v, 10);
      var m = el.dataset.m ? parseInt(el.dataset.m, 10) : app.ui.multiplier;
      if (v === 0) m = 1;
      var dart = { v: v, m: m };

      if (app.ui.modal === 'correct' && app.ui.correctTarget !== null) {
        Dart.match.replaceThrow(app.match, app.ui.correctTarget, dart);
        app.ui.correctTarget = null;
        app.ui.multiplier = 1;
        Dart.sound.tap();
        afterCorrection();
        return;
      }
      throwDart(dart);
    },
    next: nextPlayer,
    undo: function () {
      Dart.match.undo(app.match);
      app.ui.flash = null;
      clearTimeout(flashTimer);
      Dart.sound.undo();
      render();
    },
    correct: function () {
      app.ui.modal = 'correct';
      app.ui.correctTarget = null;
      render();
    },
    menu: function () {
      leaveGame(false);
    },
    'menu-force': function () {
      leaveGame(true);
    },
    again: function () {
      var cfg = app.match.config;
      Dart.storage.clearCurrent();
      app.match = Dart.match.create({
        mode: cfg.mode,
        doubleOut: cfg.doubleOut,
        farfarCap: cfg.farfarCap,
        players: cfg.players
      });
      Dart.match.commit(app.match);
      app.ui.flash = null;
      app.ui.multiplier = 1;
      app.screen = 'game';
      render();
    },
    'undo-result': function () {
      Dart.match.undo(app.match);
      app.screen = 'game';
      app.ui.flash = null;
      render();
    },

    /* rättning */
    'pick-correct': function (el) {
      app.ui.correctTarget = parseInt(el.dataset.ai, 10);
      app.ui.multiplier = 1;
      render();
    },
    'cancel-correct': function () {
      app.ui.correctTarget = null;
      render();
    },
    'del-throw': function (el) {
      Dart.match.removeThrow(app.match, parseInt(el.dataset.ai, 10));
      Dart.sound.undo();
      afterCorrection();
    },

    /* historik */
    history: function () {
      app.ui.historyTab = 'matches';
      app.screen = 'history';
      render();
    },
    'hist-tab': function (el) {
      app.ui.historyTab = el.dataset.tab;
      render();
    },
    'del-match': function (el) {
      Dart.storage.removeMatchResult(el.dataset.id);
      render();
    },
    'clear-history': function () {
      if (!window.confirm('Rensa all historik och statistik?')) return;
      Dart.storage.clearHistory();
      render();
    },
    back: function () {
      app.screen = app.match ? (Dart.match.state(app.match).finished ? 'result' : 'game') : 'setup';
      render();
    },

    /* modaler */
    rules: function () {
      app.ui.modal = 'rules';
      render();
    },
    'close-modal': function () {
      app.ui.modal = null;
      app.ui.correctTarget = null;
      render();
    }
  };

  function afterCorrection() {
    var st = Dart.match.state(app.match);
    app.ui.flash = null;
    clearTimeout(flashTimer);
    if (st.finished) {
      app.ui.modal = null;
      app.screen = 'result';
    } else if (app.screen === 'result') {
      app.screen = 'game';
    }
    render();
  }

  /* --- helskärm (gör ingenting i en installerad app, den är redan det) --- */
  function enterFullScreen() {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    var el = document.documentElement;
    try {
      if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch (e) {
      /* iOS Safari stödjer det inte - strunt i det */
    }
  }

  function exitFullScreen() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(function () {});
      } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch (e) {
      /* ignorera */
    }
  }

  /* --- offline / uppdateringar ------------------------------------------ */
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;
    navigator.serviceWorker
      .register('sw.js')
      .then(function (reg) {
        reg.addEventListener('updatefound', function () {
          var sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', function () {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast();
            }
          });
        });
      })
      .catch(function () {
        /* appen fungerar ändå, bara utan offline-läge */
      });
  }

  function showUpdateToast() {
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<span>Ny version finns</span><button class="btn small">Ladda om</button>';
    toast.querySelector('button').addEventListener('click', function () {
      window.location.reload();
    });
    document.body.appendChild(toast);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.Dart);
