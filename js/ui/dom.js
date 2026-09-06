/* ==========================================================================
   dom.js - små hjälpare. Ingen bild av ett ramverk, bara det som behövs.
   ========================================================================== */
(function (Dart) {
  'use strict';

  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function num(value, decimals) {
    if (!isFinite(value)) return '0';
    return value.toFixed(decimals === undefined ? 1 : decimals).replace('.', ',');
  }

  function dateLabel(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString('sv-SE') + ' ' + d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function modeLabel(mode) {
    return mode === 'FARFAR' ? 'Farfar' : mode;
  }

  Dart.dom = {
    esc: esc,
    $: $,
    $$: $$,
    num: num,
    dateLabel: dateLabel,
    modeLabel: modeLabel
  };
})(window.Dart);
