/* ==========================================================================
   game.js - spelvyn: ställning, turkort och knappsatsen
   ========================================================================== */
(function (Dart) {
  'use strict';

  var esc = Dart.dom.esc;
  var S = Dart.seg;

  /* --- knappsatsen (används både i spelet och i rättningsrutan) --------- */
  function keypad(multiplier, disabled, compact) {
    var d = disabled ? ' disabled' : '';
    var numbers = '';
    for (var n = 1; n <= 20; n++) {
      numbers += '<button class="key num" data-act="dart" data-v="' + n + '"' + d + '>' + n + '</button>';
    }
    return (
      '<div class="keypad' + (compact ? ' compact' : '') + '">' +
      '<div class="mult-row">' +
      [
        { m: 1, t: 'Enkel' },
        { m: 2, t: 'Dubbel' },
        { m: 3, t: 'Trippel' }
      ]
        .map(function (o) {
          return (
            '<button class="key mult m' + o.m + (multiplier === o.m ? ' active' : '') + '" data-act="mult" data-m="' + o.m + '"' + d + '>' +
            o.t +
            '</button>'
          );
        })
        .join('') +
      '</div>' +
      '<div class="num-grid">' + numbers + '</div>' +
      '<div class="special-row">' +
      '<button class="key miss" data-act="dart" data-v="0" data-m="1"' + d + '>Miss</button>' +
      '<button class="key green" data-act="dart" data-v="25" data-m="1"' + d + '>Grön 25</button>' +
      '<button class="key red" data-act="dart" data-v="25" data-m="2"' + d + '>Röd 50</button>' +
      '</div>' +
      '</div>'
    );
  }

  /* --- ställningen ------------------------------------------------------ */
  function scoreCardX01(p, isActive) {
    return (
      '<div class="pcard' + (isActive ? ' active' : '') + '">' +
      '<span class="pname">' + esc(p.name) + '</span>' +
      '<span class="pscore">' + p.score + '</span>' +
      '<span class="ptag">Senaste: ' + (p.lastTurnScore === null ? '–' : p.lastTurnScore) + '</span>' +
      '</div>'
    );
  }

  function scoreCardFarfar(p, isActive, hasThrown) {
    var body;
    if (p.eliminated) {
      body =
        '<span class="pscore out">UTE</span>' +
        '<span class="ptag">Runda ' + p.eliminatedRound + '</span>';
    } else {
      body =
        '<span class="pscore">' + (3 + p.savedDarts) + '</span>' +
        '<span class="psub">pilar</span>' +
        '<span class="ptag">Sparade: ' + p.savedDarts + '</span>';
    }
    return (
      '<div class="pcard' + (isActive ? ' active' : '') + (p.eliminated ? ' eliminated' : '') +
      (hasThrown && !p.eliminated ? ' done' : '') + '">' +
      '<span class="pname">' + esc(p.name) + '</span>' +
      body +
      '</div>'
    );
  }

  function scoreboard(app, st) {
    var isFarfar = st.mode === 'FARFAR';
    var cards = st.players.map(function (p, i) {
      var isActive = !st.finished && i === st.currentIndex;
      if (!isFarfar) return scoreCardX01(p, isActive);
      var pos = st.order.indexOf(i);
      var hasThrown = pos >= 0 && pos < st.pos;
      return scoreCardFarfar(p, isActive, hasThrown);
    });
    return '<div class="scoreboard">' + cards.join('') + '</div>';
  }

  /* --- turkortet -------------------------------------------------------- */
  function dartSlot(dart, filled) {
    if (!filled) return '<div class="slot empty"></div>';
    return (
      '<div class="slot filled"><span class="slot-label">' + esc(S.label(dart)) + '</span>' +
      '<span class="slot-score">' + S.score(dart) + '</span></div>'
    );
  }

  function turnCardX01(app, st) {
    var v = st.view;
    var slots = '';
    for (var i = 0; i < 3; i++) {
      slots += dartSlot(st.currentDarts[i], st.currentDarts[i] !== undefined);
    }

    var hint = '';
    if (app.settings.checkoutHelp && !v.bust && !v.win) {
      if (v.checkout) {
        hint =
          '<div class="checkout"><span class="checkout-tag">Utgång</span>' +
          v.checkout
            .map(function (d) {
              return '<span class="co-dart">' + esc(S.label(d)) + '</span>';
            })
            .join('') +
          '</div>';
      } else if (v.dartsLeft > 0 && v.remaining <= 170 && v.remaining > 1) {
        hint = '<div class="checkout none">Ingen utgång med ' + v.dartsLeft + ' pil' + (v.dartsLeft === 1 ? '' : 'ar') + '</div>';
      }
    }

    var overlay = '';
    if (v.bust) overlay = '<div class="overlay bust"><span>Tjock!</span><small>Turen ger 0 poäng</small></div>';
    else if (v.win) overlay = '<div class="overlay win"><span>Utgång!</span><small>Tryck Vinst</small></div>';

    return (
      '<div class="turncard">' +
      '<div class="turnhead">' +
      '<span class="thrower">' + esc(st.active.name) + ' kastar</span>' +
      '<span class="pill">Kvar: ' + v.remaining + '</span>' +
      '</div>' +
      '<div class="slots three">' + slots + '</div>' +
      '<div class="turnsum">Summa: <strong>' + v.total + '</strong></div>' +
      hint +
      overlay +
      '</div>'
    );
  }

  function turnCardFarfar(app, st) {
    var v = st.view;
    var shown = Math.min(v.available, 12);
    var slots = '';
    for (var i = 0; i < shown; i++) {
      slots += dartSlot(st.currentDarts[i], st.currentDarts[i] !== undefined);
    }
    if (v.available > shown) slots += '<div class="slot more">+' + (v.available - shown) + '</div>';

    var flash = '';
    if (app.ui.flash) {
      var f = app.ui.flash;
      if (f.type === 'CLEARED') {
        flash = '<div class="overlay ok"><span>Klar!</span><small>' + esc(f.name) + ' sparar ' + f.saved + ' pil' + (f.saved === 1 ? '' : 'ar') + '</small></div>';
      } else if (f.type === 'BULL') {
        flash = '<div class="overlay bull"><span>Röd bull!</span><small>' + esc(f.name) + ' sparar ' + f.saved + ' pil' + (f.saved === 1 ? '' : 'ar') + '</small></div>';
      } else if (f.type === 'ELIMINATED') {
        flash = '<div class="overlay bust"><span>Utslagen!</span><small>' + esc(f.name) + ' fick ' + f.total + ' poäng</small></div>';
      }
    }

    return (
      '<div class="turncard">' +
      '<div class="turnhead">' +
      '<span class="thrower">' + esc(st.active.name) + ' kastar</span>' +
      '<span class="pill">Mål: ' + v.target + '</span>' +
      '</div>' +
      '<div class="slots wrap">' + slots + '</div>' +
      '<div class="turnsum">Summa: <strong>' + v.total + '</strong> · ' + v.dartsLeft + ' pil' + (v.dartsLeft === 1 ? '' : 'ar') + ' kvar</div>' +
      flash +
      '</div>'
    );
  }

  /* --- hela vyn --------------------------------------------------------- */
  function render(app) {
    var st = Dart.match.state(app.match);
    var isFarfar = st.mode === 'FARFAR';
    var cfg = app.match.config;

    var subtitle = isFarfar
      ? 'Runda ' + st.round + ' · mål ' + Dart.farfar.targetFor(st.round)
      : cfg.doubleOut
        ? 'Dubbel utgång'
        : 'Valfri utgång';

    var blocked = !!app.ui.flash;
    var inputDisabled =
      blocked ||
      (isFarfar ? false : st.view.bust || st.view.win || st.currentDarts.length >= 3);

    var nextLabel = !isFarfar && st.view.win ? 'Vinst' : 'Nästa';

    return (
      '<div class="game">' +
      '<header class="topbar">' +
      '<button class="chip" data-act="menu">Meny</button>' +
      '<div class="topbar-title"><strong>' + esc(Dart.dom.modeLabel(st.mode)) + '</strong><span>' + esc(subtitle) + '</span></div>' +
      '<button class="chip" data-act="correct">Rätta</button>' +
      '</header>' +
      '<div class="game-body">' +
      '<div class="left-col">' + scoreboard(app, st) + '</div>' +
      '<div class="right-col">' +
      (isFarfar ? turnCardFarfar(app, st) : turnCardX01(app, st)) +
      keypad(app.ui.multiplier, inputDisabled) +
      '<div class="action-row">' +
      '<button class="btn ghost' + (isFarfar ? ' wide' : '') + '" data-act="undo"' + (Dart.match.canUndo(app.match) ? '' : ' disabled') + '>↶ Ångra</button>' +
      (isFarfar
        ? ''
        : '<button class="btn primary wide" data-act="next"' + (blocked ? ' disabled' : '') + '>' + nextLabel + '</button>') +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  Dart.ui = Dart.ui || {};
  Dart.ui.game = { render: render, keypad: keypad };
})(window.Dart);
