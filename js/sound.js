/* ==========================================================================
   sound.js - korta toner via Web Audio (inga ljudfiler att ladda ner) och
   vibration där webbläsaren stödjer det (Android; iPhone ignorerar det).
   ========================================================================== */
(function (Dart) {
  'use strict';

  var ctx = null;

  function audio() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function enabled() {
    return Dart.settings && Dart.settings.sound;
  }

  function tone(freq, duration, type, gainValue, delay) {
    var ac = audio();
    if (!ac) return;
    try {
      if (ac.state === 'suspended') ac.resume();
      var t0 = ac.currentTime + (delay || 0);
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(gainValue || 0.2, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.02);
    } catch (e) {
      /* ljud är aldrig viktigt nog att krascha på */
    }
  }

  function vibrate(pattern) {
    if (!Dart.settings || !Dart.settings.haptics) return;
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) {
      /* ignorera */
    }
  }

  Dart.sound = {
    /* väcker ljudet vid första tryck (krav i iOS/Safari) */
    unlock: function () {
      var ac = audio();
      if (ac && ac.state === 'suspended') ac.resume();
    },
    dart: function () {
      if (enabled()) tone(660, 0.06, 'triangle', 0.15);
      vibrate(12);
    },
    tap: function () {
      if (enabled()) tone(440, 0.04, 'sine', 0.08);
    },
    bust: function () {
      if (enabled()) {
        tone(180, 0.18, 'sawtooth', 0.18);
        tone(120, 0.22, 'sawtooth', 0.18, 0.12);
      }
      vibrate([40, 60, 120]);
    },
    cleared: function () {
      if (enabled()) {
        tone(660, 0.09, 'triangle', 0.16);
        tone(880, 0.12, 'triangle', 0.16, 0.08);
      }
      vibrate(30);
    },
    bull: function () {
      if (enabled()) {
        tone(880, 0.08, 'square', 0.12);
        tone(1170, 0.08, 'square', 0.12, 0.07);
        tone(1320, 0.16, 'square', 0.12, 0.14);
      }
      vibrate([20, 40, 20]);
    },
    win: function () {
      if (enabled()) {
        tone(523, 0.12, 'triangle', 0.2);
        tone(659, 0.12, 'triangle', 0.2, 0.12);
        tone(784, 0.12, 'triangle', 0.2, 0.24);
        tone(1046, 0.3, 'triangle', 0.2, 0.36);
      }
      vibrate([30, 50, 30, 50, 90]);
    },
    undo: function () {
      if (enabled()) tone(300, 0.07, 'sine', 0.12);
    }
  };
})(window.Dart);
