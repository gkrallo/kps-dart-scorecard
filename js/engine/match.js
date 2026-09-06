/* ==========================================================================
   match.js - en match = inställningar + en lista med kast.

   Ställningen sparas aldrig, den räknas alltid fram från kastlistan. Det gör
   att man kan ångra, ta bort eller ändra vilket kast som helst, även flera
   spelare tillbaka, och få en korrekt ställning igen.

   Kast i listan: { t:'T', v:fält, m:multiplikator }   (T = throw)
                  { t:'E' }                            (E = tur klar, bara X01)
   ========================================================================== */
(function (Dart) {
  'use strict';

  var START = { '301': 301, '501': 501, FARFAR: 0 };

  function engineFor(cfg) {
    return cfg.mode === 'FARFAR' ? Dart.farfar : Dart.x01;
  }

  function create(opts) {
    var cfg = {
      mode: opts.mode,
      start: START[opts.mode] || 0,
      doubleOut: !!opts.doubleOut,
      farfarCap: !!opts.farfarCap,
      players: opts.players.map(function (p, i) {
        return { id: p.id || 'p' + i + '-' + Date.now(), name: p.name };
      })
    };
    return {
      id: 'm' + Date.now(),
      createdAt: new Date().toISOString(),
      version: Dart.CONFIG.version,
      config: cfg,
      actions: [],
      resultId: null,
      _rev: 0,
      _stateRev: -1,
      _state: null
    };
  }

  /* Räknar fram ställningen från kastlistan. Kast som inte är giltiga längre
     (t.ex. efter en rättning som avslutade matchen tidigare) hoppas över,
     men ligger kvar i listan så att de kommer tillbaka om rättningen ångras. */
  function compute(match) {
    var cfg = match.config;
    var engine = engineFor(cfg);
    var st = engine.init(cfg);
    st.log = [];
    st.config = cfg;

    for (var i = 0; i < match.actions.length; i++) {
      var a = match.actions[i];
      if (a.t === 'T') {
        var player = st.players[st.currentIndex];
        var round = st.round || st.turnNo || 1;
        var dartNo = st.currentDarts.length + 1;
        if (engine.throwDart(st, cfg, { v: a.v, m: a.m })) {
          st.log.push({
            ai: i,
            playerId: player.id,
            playerName: player.name,
            round: round,
            dartNo: dartNo,
            dart: { v: a.v, m: a.m }
          });
        }
      } else if (a.t === 'E') {
        engine.endTurn(st, cfg);
      }
    }

    /* view räknas fram även när matchen är slut - spelvyn ritas ju en sista
       gång medan "Klar!"-rutan visas innan resultatskärmen tar över */
    st.view = engine.view(st, cfg);
    st.active = st.players[st.currentIndex];
    return st;
  }

  function state(match) {
    if (match._stateRev !== match._rev || !match._state) {
      match._state = compute(match);
      match._stateRev = match._rev;
    }
    return match._state;
  }

  /* Efter varje ändring: spara pågående match och lägg in/plocka bort
     resultatet i historiken om matchen blev klar / blev oklar igen. */
  function commit(match) {
    match._rev++;
    var st = state(match);

    if (st.finished && !match.resultId) {
      var result = Dart.stats.buildResult(match, st);
      Dart.storage.saveMatchResult(result);
      match.resultId = result.id;
    } else if (!st.finished && match.resultId) {
      Dart.storage.removeMatchResult(match.resultId);
      match.resultId = null;
    }

    Dart.storage.saveCurrent(serialize(match));
    return st;
  }

  function serialize(match) {
    return {
      id: match.id,
      createdAt: match.createdAt,
      version: match.version,
      config: match.config,
      actions: match.actions,
      resultId: match.resultId
    };
  }

  function restore(data) {
    if (!data || !data.config || !Array.isArray(data.actions)) return null;
    if (!data.config.players || !data.config.players.length) return null;
    return {
      id: data.id,
      createdAt: data.createdAt,
      version: data.version,
      config: data.config,
      actions: data.actions,
      resultId: data.resultId || null,
      _rev: 0,
      _stateRev: -1,
      _state: null
    };
  }

  /* --- handlingar ------------------------------------------------------- */

  function throwDart(match, dart) {
    var before = state(match).log.length;
    match.actions.push({ t: 'T', v: dart.v, m: dart.m });
    var st = commit(match);
    if (st.log.length === before) {
      /* kastet var inte tillåtet just nu - ta bort det igen */
      match.actions.pop();
      return commit(match);
    }
    return st;
  }

  function endTurn(match) {
    match.actions.push({ t: 'E' });
    return commit(match);
  }

  /* Ångra: tar bort det senaste kastet/turbytet som faktiskt gav effekt,
     plus eventuella döda kast efter det. */
  function undo(match) {
    var st = state(match);
    var lastIndex = -1;
    for (var i = match.actions.length - 1; i >= 0; i--) {
      if (match.actions[i].t === 'E') {
        lastIndex = i;
        break;
      }
      var live = st.log.some(function (l) {
        return l.ai === i;
      });
      if (live) {
        lastIndex = i;
        break;
      }
    }
    if (lastIndex < 0) return st;
    match.actions.length = lastIndex;
    return commit(match);
  }

  function canUndo(match) {
    return match.actions.length > 0;
  }

  function removeThrow(match, actionIndex) {
    if (actionIndex < 0 || actionIndex >= match.actions.length) return state(match);
    match.actions.splice(actionIndex, 1);
    return commit(match);
  }

  function replaceThrow(match, actionIndex, dart) {
    if (actionIndex < 0 || actionIndex >= match.actions.length) return state(match);
    match.actions[actionIndex] = { t: 'T', v: dart.v, m: dart.m };
    return commit(match);
  }

  Dart.match = {
    create: create,
    state: state,
    commit: commit,
    serialize: serialize,
    restore: restore,
    engineFor: engineFor,
    throwDart: throwDart,
    endTurn: endTurn,
    undo: undo,
    canUndo: canUndo,
    removeThrow: removeThrow,
    replaceThrow: replaceThrow
  };
})(window.Dart);
