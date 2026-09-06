/* ==========================================================================
   storage.js - allt som sparas lokalt i webbläsaren
   Inget lämnar telefonen. Allt är inslaget i try/catch, så appen fungerar
   även i privat läge där lagring kan vara avstängd.
   ========================================================================== */
(function (Dart) {
  'use strict';

  var KEY_CURRENT = 'dart.current.v1';   // pågående match
  var KEY_HISTORY = 'dart.history.v1';   // spelade matcher
  var KEY_SETTINGS = 'dart.settings.v1'; // ljud, senaste spelare m.m.

  function read(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var value = JSON.parse(raw);
      return value === null || value === undefined ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      /* strunt i det */
    }
  }

  var DEFAULT_SETTINGS = {
    sound: true,
    haptics: true,
    checkoutHelp: true,
    lastPlayers: ['Sofia', 'Emil', 'Kristian'],
    lastMode: '301',
    doubleOut: false,
    farfarCap: false
  };

  Dart.storage = {
    /* --- inställningar --- */
    loadSettings: function () {
      var s = read(KEY_SETTINGS, {});
      var out = {};
      Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
        out[k] = s[k] === undefined ? DEFAULT_SETTINGS[k] : s[k];
      });
      return out;
    },
    saveSettings: function (settings) {
      write(KEY_SETTINGS, settings);
    },

    /* --- pågående match (så en omladdning inte förstör matchen) --- */
    loadCurrent: function () {
      return read(KEY_CURRENT, null);
    },
    saveCurrent: function (match) {
      write(KEY_CURRENT, match);
    },
    clearCurrent: function () {
      remove(KEY_CURRENT);
    },

    /* --- spelade matcher --- */
    loadHistory: function () {
      var h = read(KEY_HISTORY, []);
      return Array.isArray(h) ? h : [];
    },
    saveMatchResult: function (result) {
      var h = Dart.storage.loadHistory();
      h.unshift(result);
      if (h.length > 200) h = h.slice(0, 200);
      write(KEY_HISTORY, h);
    },
    removeMatchResult: function (id) {
      var h = Dart.storage.loadHistory().filter(function (m) {
        return m.id !== id;
      });
      write(KEY_HISTORY, h);
    },
    clearHistory: function () {
      remove(KEY_HISTORY);
    }
  };
})(window.Dart);
