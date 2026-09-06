/* ==========================================================================
   modals.js - regler och rättningsrutan
   ========================================================================== */
(function (Dart) {
  'use strict';

  var esc = Dart.dom.esc;
  var S = Dart.seg;

  function shell(title, body, extraClass) {
    return (
      '<div class="modal-backdrop" data-act="close-modal">' +
      '<div class="modal ' + (extraClass || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
      '<div class="modal-head"><h2>' + esc(title) + '</h2>' +
      '<button class="icon-btn" data-act="close-modal" aria-label="Stäng">&times;</button></div>' +
      '<div class="modal-body">' + body + '</div>' +
      '</div></div>'
    );
  }

  var RULES =
    '<section class="rules-section">' +
    '<h3>301 / 501</h3>' +
    '<ul>' +
    '<li>Alla börjar på 301 respektive 501 och ska ner till <strong>exakt 0</strong>.</li>' +
    '<li>Tre pilar per tur. Tryck <em>Nästa</em> när turen är klar.</li>' +
    '<li><strong>Tjock:</strong> kastar du mer än du har kvar räknas hela turen som 0 poäng och du behåller ställningen du hade innan turen.</li>' +
    '<li><strong>Dubbel utgång</strong> (valfritt): sista pilen måste vara en dubbel eller röd bull (50). Hamnar du på 1 poäng blir du tjock.</li>' +
    '<li>Utgångshjälpen föreslår en väg ut när det finns en.</li>' +
    '</ul></section>' +
    '<section class="rules-section">' +
    '<h3>Farfar</h3>' +
    '<ul>' +
    '<li>Runda 1 kräver <strong>15 poäng</strong>. Målet ökar med 5 poäng varje runda (15, 20, 25 … runda 18 = 100).</li>' +
    '<li>Du kastar med <strong>3 pilar + alla pilar du sparat</strong>. Sparade pilar staplas utan tak.</li>' +
    '<li>När du nått målet är turen slut direkt och pilarna du har kvar sparas till nästa runda.</li>' +
    '<li><strong>Röd bull (50)</strong> avslutar turen direkt och sparar resten av pilarna, även om målet inte är nått. Grön bull (25) är bara 25 poäng.</li>' +
    '<li>Når du inte målet innan pilarna tar slut är du utslagen.</li>' +
    '<li>Rundan spelas alltid färdigt – alla som lever när rundan börjar får kasta.</li>' +
    '<li>Sista spelaren kvar vinner. Slås alla ut samma runda vinner högsta poängen den rundan (delad vinst vid lika).</li>' +
    '<li><strong>Tak på 100</strong> (valfritt): efter runda 18 vinner den som har flest sparade pilar.</li>' +
    '</ul></section>' +
    '<section class="rules-section">' +
    '<h3>Rätta fel</h3>' +
    '<ul>' +
    '<li><em>Ångra</em> tar bort senaste kastet – även om nästa spelare redan hunnit kasta.</li>' +
    '<li><em>Rätta</em> visar de senaste kasten. Tryck på ett kast för att ändra värdet, eller på krysset för att ta bort det. Ställningen räknas om automatiskt.</li>' +
    '</ul></section>';

  function rules() {
    return shell('Regler', RULES, 'wide');
  }

  function correction(app) {
    var st = Dart.match.state(app.match);
    var target = app.ui.correctTarget;

    if (target !== null && target !== undefined) {
      var entry = st.log.filter(function (l) {
        return l.ai === target;
      })[0];
      var who = entry
        ? esc(entry.playerName) +
          (st.mode === 'FARFAR' ? ' · runda ' : ' · varv ') +
          entry.round +
          ' · pil ' +
          entry.dartNo
        : 'Kastet';
      return shell(
        'Nytt värde',
        '<p class="modal-lead">' + who + '. Välj vad pilen skulle ha varit.</p>' +
          Dart.ui.game.keypad(app.ui.multiplier, false, true) +
          '<button class="btn ghost wide" data-act="cancel-correct">Avbryt</button>',
        'wide'
      );
    }

    var roundWord = st.mode === 'FARFAR' ? 'Runda ' : 'Varv ';
    var recent = st.log.slice(-18).reverse();
    var list = recent.length
      ? '<ul class="throw-list">' +
        recent
          .map(function (l) {
            return (
              '<li class="throw-row">' +
              '<button class="throw-pick" data-act="pick-correct" data-ai="' + l.ai + '">' +
              '<span class="throw-meta">' + roundWord + l.round + ' · ' + esc(l.playerName) + ' · pil ' + l.dartNo + '</span>' +
              '<span class="throw-val">' + esc(S.label(l.dart)) + '<em>' + S.score(l.dart) + 'p</em></span>' +
              '</button>' +
              '<button class="icon-btn danger" data-act="del-throw" data-ai="' + l.ai + '" aria-label="Ta bort kastet">&times;</button>' +
              '</li>'
            );
          })
          .join('') +
        '</ul>'
      : '<p class="empty-state">Inga kast att rätta än.</p>';

    return shell(
      'Rätta kast',
      '<p class="modal-lead">Tryck på ett kast för att ändra värdet, eller på krysset för att ta bort det. Allt efter kastet räknas om.</p>' +
        list,
      'wide'
    );
  }

  Dart.ui = Dart.ui || {};
  Dart.ui.modals = { rules: rules, correction: correction };
})(window.Dart);
