/* ==========================================================================
   test-engine.js - regeltester som körs utan webbläsare.
   Kör:  node tools/test-engine.js
   ========================================================================== */
'use strict';

/* --- minimal webbläsarmiljö --------------------------------------------- */
var store = {};
global.window = {
  localStorage: {
    getItem: function (k) {
      return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
    },
    setItem: function (k, v) {
      store[k] = String(v);
    },
    removeItem: function (k) {
      delete store[k];
    }
  }
};
/* navigator finns redan i moderna Node - rör den inte */

var path = require('path');
var root = path.join(__dirname, '..');
[
  'js/config.js',
  'js/storage.js',
  'js/engine/segments.js',
  'js/engine/x01.js',
  'js/engine/farfar.js',
  'js/stats.js',
  'js/engine/match.js'
].forEach(function (f) {
  require(path.join(root, f));
});

var Dart = global.window.Dart;
var M = Dart.match;

/* --- pyttelitet testramverk -------------------------------------------- */
var passed = 0;
var failed = 0;

function check(name, actual, expected) {
  var a = JSON.stringify(actual);
  var e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failed++;
    console.log('  FAIL  ' + name + '\n        fick      ' + a + '\n        förväntat ' + e);
  }
}

function ok(name, value) {
  check(name, !!value, true);
}

function group(name) {
  console.log('\n' + name);
}

/* --- hjälpare ----------------------------------------------------------- */
function match(mode, names, opts) {
  opts = opts || {};
  return M.create({
    mode: mode,
    doubleOut: !!opts.doubleOut,
    farfarCap: !!opts.farfarCap,
    players: names.map(function (n) {
      return { name: n };
    })
  });
}

function t(m, v, mult) {
  M.throwDart(m, { v: v, m: mult || 1 });
}
function end(m) {
  M.endTurn(m);
}
function st(m) {
  return M.state(m);
}
function player(m, name) {
  return st(m).players.filter(function (p) {
    return p.name === name;
  })[0];
}

/* ======================================================================== */
group('Pilar och poäng');
var S = Dart.seg;
check('trippel 20 = 60', S.score({ v: 20, m: 3 }), 60);
check('röd bull = 50', S.score({ v: 25, m: 2 }), 50);
check('grön bull = 25', S.score({ v: 25, m: 1 }), 25);
check('miss = 0', S.score({ v: 0, m: 1 }), 0);
check('röd bull räknas som dubbel', S.isDouble({ v: 25, m: 2 }), true);
check('etikett T20', S.label({ v: 20, m: 3 }), 'T20');

/* ======================================================================== */
group('Utgångsförslag');
function co(score, darts, doubleOut) {
  var r = S.checkout(score, darts === undefined ? 3 : darts, doubleOut === undefined ? true : doubleOut);
  return r ? r.map(S.label).join(' ') : null;
}
check('170', co(170), 'T20 T20 Röd');
check('167', co(167), 'T20 T19 Röd');
check('100', co(100), 'T20 D20');
check('40', co(40), 'D20');
check('2 (dubbel 1)', co(2), 'D1');
check('50', co(50), 'Röd');
check('81', co(81), 'T19 D12');
check('169 går inte ut', co(169), null);
check('171 går inte ut', co(171), null);
check('3 med en pil kvar', co(3, 1), null);
check('32 med en pil kvar', co(32, 1), 'D16');
check('61 med två pilar', co(61, 2), 'T7 D20');
ok('ingen utgång innehåller mer än 3 pilar', S.checkout(167, 3, true).length === 3);

/* ======================================================================== */
group('301 / 501');
var m1 = match('301', ['A', 'B']);
t(m1, 20, 3);
t(m1, 20, 3);
t(m1, 20, 3);
check('180 kvar 121', st(m1).view.remaining, 121);
end(m1);
check('poängen sparas', player(m1, 'A').score, 121);
check('turen loggas', player(m1, 'A').turns, [180]);
check('nästa spelare är B', st(m1).active.name, 'B');

/* tjock */
var m2 = match('301', ['A']);
for (var i = 0; i < 93; i++) {
  /* snabbt ner till 21: 301-280 = 21 med 14 turer om 20 */
}
var m2b = match('301', ['A', 'B']);
t(m2b, 20, 3);
t(m2b, 20, 3);
t(m2b, 20, 3);
end(m2b);
t(m2b, 1);
end(m2b); /* B */
t(m2b, 20, 3);
t(m2b, 20, 3);
t(m2b, 1, 1);
check('A är på 121 - 121 = 0? nej, 121-121', st(m2b).view.remaining, 0);

/* dubbel utgång */
var m3 = match('301', ['A'], { doubleOut: true });
/* ta A ner till 40: 301 - 261 */
[60, 60, 60].forEach(function () {
  t(m3, 20, 3);
});
end(m3);
[60, 21].forEach(function () {});
t(m3, 20, 3);
t(m3, 7, 3);
check('121 - 81 = 40 kvar', st(m3).view.remaining, 40);
end(m3);
check('A står på 40', player(m3, 'A').score, 40);
t(m3, 20, 1);
check('20 enkel ger 20 kvar', st(m3).view.remaining, 20);
t(m3, 20, 1);
check('utan dubbel blir det tjock', st(m3).view.bust, true);
end(m3);
check('tjock behåller 40', player(m3, 'A').score, 40);
t(m3, 20, 2);
check('D20 vinner', st(m3).view.win, true);
end(m3);
check('matchen är klar', st(m3).finished, true);
check('vinnaren är A', st(m3).winners, ['A']);
check('utgång sparas', player(m3, 'A').checkout, 40);

/* man får inte lämna 1 kvar när dubbel utgång är på */
var m4 = match('301', ['A'], { doubleOut: true });
[20, 20, 20].forEach(function () {
  t(m4, 20, 3);
});
end(m4); /* 121 kvar */
t(m4, 20, 3);
t(m4, 20, 3); /* skulle ge 1 kvar */
check('1 kvar blir tjock', st(m4).view.bust, true);
end(m4);
check('A står kvar på 121', player(m4, 'A').score, 121);

/* röd bull som utgång */
var m5 = match('301', ['A'], { doubleOut: true });
[0, 1, 2].forEach(function () {
  t(m5, 20, 3);
});
end(m5); /* 121 */
t(m5, 20, 3);
t(m5, 7, 1); /* 121-67 = 54 */
end(m5);
check('A står på 54', player(m5, 'A').score, 54);
t(m5, 4, 1);
t(m5, 25, 2);
check('röd bull går ut', st(m5).view.win, true);

/* ======================================================================== */
group('Ångra och rätta');
var m6 = match('301', ['A', 'B']);
t(m6, 20, 3);
t(m6, 20, 3);
t(m6, 20, 3);
end(m6);
t(m6, 5, 1);
check('B har kastat en pil', st(m6).currentDarts.length, 1);
M.undo(m6);
check('ångra tar bort Bs pil', st(m6).currentDarts.length, 0);
check('det är fortfarande Bs tur', st(m6).active.name, 'B');
M.undo(m6);
check('ångra igen ger tillbaka As tur', st(m6).active.name, 'A');
check('As tur har 3 pilar igen', st(m6).currentDarts.length, 3);
check('As poäng är tillbaka på 301', player(m6, 'A').score, 301);

/* rätta ett gammalt kast när nästa spelare redan kastat */
var m7 = match('501', ['A', 'B']);
t(m7, 20, 3); /* 60 */
t(m7, 20, 3);
t(m7, 20, 3);
end(m7);
t(m7, 20, 3);
end(m7);
check('A har 321 kvar', player(m7, 'A').score, 321);
var firstThrow = st(m7).log[0];
M.replaceThrow(m7, firstThrow.ai, { v: 1, m: 1 }); /* T20 var egentligen en 1:a */
check('A får rätt poäng efter rättning', player(m7, 'A').score, 380);
check('B påverkas inte', player(m7, 'B').score, 441);
check('det är fortfarande As tur', st(m7).active.name, 'A');

M.removeThrow(m7, firstThrow.ai);
check('borttaget kast ger 2 pilar i turen', player(m7, 'A').score, 381);
check('pilar räknas om', player(m7, 'A').dartsThrown, 2);

/* ======================================================================== */
group('Farfar - grunder');
check('mål runda 1', Dart.farfar.targetFor(1), 15);
check('mål runda 2', Dart.farfar.targetFor(2), 20);
check('mål runda 18', Dart.farfar.targetFor(18), 100);

var f1 = match('FARFAR', ['A', 'B']);
t(f1, 20, 3); /* 60 >= 15, klart på en pil */
check('A sparar 2 pilar', player(f1, 'A').savedDarts, 2);
check('turen går vidare till B', st(f1).active.name, 'B');
check('A har 5 pilar nästa gång', 3 + player(f1, 'A').savedDarts, 5);

t(f1, 20, 1); /* B: 20 >= 15 */
check('B sparar 2 pilar', player(f1, 'B').savedDarts, 2);
check('ny runda när alla kastat', st(f1).round, 2);
check('A börjar runda 2', st(f1).active.name, 'A');
check('A har 5 pilar tillgängliga', st(f1).view.available, 5);

/* grön bull avslutar inte turen om målet inte är nått */
var f2 = match('FARFAR', ['A', 'B']);
var fst = M.state(f2);
fst.round = 4; /* mål 30 */
Dart.farfar.throwDart(fst, f2.config, { v: 25, m: 1 });
check('grön 25 under målet avslutar inte', fst.currentDarts.length, 1);
check('ingen händelse', fst.lastEvent, null);

/* röd bull avslutar turen även under målet */
var f3 = match('FARFAR', ['A', 'B']);
var fst3 = M.state(f3);
fst3.round = 9; /* mål 55 */
Dart.farfar.throwDart(fst3, f3.config, { v: 25, m: 2 });
check('röd bull avslutar turen', fst3.lastEvent.type, 'BULL');
check('röd bull sparar resten', fst3.players[0].savedDarts, 2);

/* utslagning */
var f4 = match('FARFAR', ['A', 'B']);
t(f4, 0);
t(f4, 0);
t(f4, 0);
check('A slås ut', player(f4, 'A').eliminated, true);
check('A slogs ut i runda 1', player(f4, 'A').eliminatedRound, 1);
check('matchen fortsätter tills rundan är färdig', st(f4).finished, false);
check('B får kasta', st(f4).active.name, 'B');
t(f4, 20, 1);
check('B vinner när rundan är slut', st(f4).finished, true);
check('vinnare B', st(f4).winners, ['B']);

/* rundan spelas färdigt: sista spelaren måste kasta */
var f5 = match('FARFAR', ['A', 'B', 'C']);
t(f5, 20, 1); /* A klarar */
t(f5, 0);
t(f5, 0);
t(f5, 0); /* B ut */
check('C står på tur', st(f5).active.name, 'C');
check('matchen är inte avgjord än', st(f5).finished, false);
t(f5, 0);
t(f5, 0);
t(f5, 0); /* C ut */
check('A vinner när rundan är färdigspelad', st(f5).winners, ['A']);

/* alla ut i samma runda -> högsta poäng vinner */
var f6 = match('FARFAR', ['A', 'B']);
t(f6, 5, 1);
t(f6, 5, 1);
t(f6, 1, 1); /* A: 11 poäng, ut */
t(f6, 5, 1);
t(f6, 5, 1);
t(f6, 4, 1); /* B: 14 poäng, ut */
check('alla ute samma runda', st(f6).finished, true);
check('högsta poängen vinner', st(f6).winners, ['B']);

/* delad vinst vid lika */
var f7 = match('FARFAR', ['A', 'B']);
t(f7, 5, 1);
t(f7, 5, 1);
t(f7, 4, 1);
t(f7, 5, 1);
t(f7, 5, 1);
t(f7, 4, 1);
check('delad vinst', st(f7).winners, ['A', 'B']);

/* ======================================================================== */
group('Farfar - tak på 100');
var f8 = match('FARFAR', ['A', 'B'], { farfarCap: true });
/* Låt båda klara varje runda till och med runda 18. A träffar alltid trippel
   20 (klarar sig länge på en pil), B kastar tills målet är nått. */
var guard = 0;
while (!st(f8).finished && guard < 400) {
  guard++;
  var s = st(f8);
  var need = Dart.farfar.targetFor(s.round) - s.view.total;
  if (need <= 60) t(f8, Math.ceil(need / 3) > 20 ? 20 : Math.ceil(need / 3), 3);
  else t(f8, 20, 3);
}
check('matchen avgörs efter runda 18', st(f8).finalRound, 18);
ok('någon vann på sparade pilar', st(f8).winners.length >= 1);

/* ======================================================================== */
group('Statistik');
var res = Dart.stats.buildResult(m3, st(m3));
check('resultatet har vinnare', res.winners, ['A']);
check('läget sparas', res.mode, '301');
var agg = Dart.stats.aggregate([res]);
check('en spelare i statistiken', agg.length, 1);
check('en vinst', agg[0].wins, 1);

/* ======================================================================== */
console.log('\n' + passed + ' godkända, ' + failed + ' underkända');
process.exit(failed ? 1 : 0);
