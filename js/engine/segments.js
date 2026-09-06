/* ==========================================================================
   segments.js - en pil beskrivs som { v: fält, m: multiplikator }
     v = 0        -> miss
     v = 1..20    -> vanligt fält, m = 1 (enkel), 2 (dubbel), 3 (trippel)
     v = 25, m=1  -> grön bull (25 poäng)
     v = 25, m=2  -> röd bull (50 poäng) - räknas som dubbel vid dubbel utgång
   Poängen är alltid v * m. Ingenting annat i appen räknar poäng själv.
   ========================================================================== */
(function (Dart) {
  'use strict';

  function seg(v, m) {
    return { v: v, m: m || 1 };
  }

  function score(d) {
    return d.v * d.m;
  }

  function isDouble(d) {
    return d.m === 2 && d.v > 0;
  }

  function label(d) {
    if (!d || d.v === 0) return 'Miss';
    if (d.v === 25) return d.m === 2 ? 'Röd' : 'Grön';
    if (d.m === 3) return 'T' + d.v;
    if (d.m === 2) return 'D' + d.v;
    return String(d.v);
  }

  function sum(darts) {
    return darts.reduce(function (a, d) {
      return a + score(d);
    }, 0);
  }

  /* ---- Utgångsförslag ------------------------------------------------------
     Byggs genom att söka igenom fälten i "så här kastar folk"-ordning i
     stället för en handskriven tabell. Bull undviks som mellanpil om det
     finns en annan väg (första sökningen görs utan bull).
     -------------------------------------------------------------------- */

  function build(list) {
    return list.map(function (d) {
      return { seg: d, score: score(d) };
    });
  }

  var TRIPLES = [];
  var SINGLES = [];
  var DOUBLES = [];
  for (var v = 20; v >= 1; v--) {
    TRIPLES.push(seg(v, 3));
    SINGLES.push(seg(v, 1));
    DOUBLES.push(seg(v, 2));
  }
  var BULL50 = seg(25, 2);
  var BULL25 = seg(25, 1);

  /* Pilar att sätta upp med (inte sista pilen) */
  var SETUP_NO_BULL = build([].concat(TRIPLES, SINGLES, DOUBLES));
  var SETUP_ALL = build([].concat(TRIPLES, SINGLES, DOUBLES, [BULL50, BULL25]));

  /* Dubblar i den ordning de flesta helst vill gå ut på */
  var FINISH_DOUBLE_ORDER = [20, 16, 8, 4, 2, 12, 10, 18, 6, 14, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  var FINISH_DOUBLES = build(
    FINISH_DOUBLE_ORDER.map(function (n) {
      return seg(n, 2);
    }).concat([BULL50])
  );
  /* Vid "valfri utgång" duger vilket fält som helst på sista pilen */
  var FINISH_ANY = build([].concat([BULL50], TRIPLES, DOUBLES, SINGLES, [BULL25]));

  function findIn(list, target) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].score === target) return list[i].seg;
    }
    return null;
  }

  function search(remaining, dartsLeft, finishes, setups) {
    var i, j, f, rem, first, second;

    for (i = 0; i < finishes.length; i++) {
      if (finishes[i].score === remaining) return [finishes[i].seg];
    }
    if (dartsLeft < 2) return null;

    for (i = 0; i < finishes.length; i++) {
      f = finishes[i];
      rem = remaining - f.score;
      if (rem <= 0) continue;
      first = findIn(setups, rem);
      if (first) return [first, f.seg];
    }
    if (dartsLeft < 3) return null;

    for (i = 0; i < finishes.length; i++) {
      f = finishes[i];
      rem = remaining - f.score;
      if (rem <= 0) continue;
      for (j = 0; j < setups.length; j++) {
        var r2 = rem - setups[j].score;
        if (r2 <= 0) continue;
        second = findIn(setups, r2);
        if (second) return [setups[j].seg, second, f.seg];
      }
    }
    return null;
  }

  /**
   * Föreslår en väg ut.
   * @param {number} remaining poäng kvar
   * @param {number} dartsLeft pilar kvar i turen (1-3)
   * @param {boolean} doubleOut kräver dubbel utgång
   * @returns {Array|null} lista med pilar, eller null om det inte går
   */
  function checkout(remaining, dartsLeft, doubleOut) {
    if (!(remaining > 0) || dartsLeft < 1) return null;
    if (doubleOut && remaining < 2) return null;
    if (remaining > 170) return null;
    var finishes = doubleOut ? FINISH_DOUBLES : FINISH_ANY;
    return (
      search(remaining, dartsLeft, finishes, SETUP_NO_BULL) ||
      search(remaining, dartsLeft, finishes, SETUP_ALL)
    );
  }

  Dart.seg = {
    seg: seg,
    score: score,
    isDouble: isDouble,
    label: label,
    sum: sum,
    checkout: checkout,
    BULL25: BULL25,
    BULL50: BULL50
  };
})(window.Dart);
