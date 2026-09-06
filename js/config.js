/* ==========================================================================
   config.js - allt du kan vilja ändra på ett ställe
   ========================================================================== */
window.Dart = window.Dart || {};

window.Dart.CONFIG = {
  /* Versionen visas i appen. Höj den (och samma siffra i sw.js) när du
     publicerar en ny version, så hämtar telefonerna ner den nya koden. */
  version: '1.0.0',

  /* Sätt showSponsor till false om du vill ta bort kaffe-knappen helt. */
  showSponsor: true,
  sponsorUrl: 'https://kps-sponsring.netlify.app/?app=DartR%C3%A4knare%20Pro',

  /* Max antal spelare i en match. */
  maxPlayers: 8,

  /* Farfar: startmål och hur mycket målet ökar per runda. */
  farfar: {
    startTarget: 15,
    step: 5,
    capRound: 18 // runda 18 = mål 100 (används bara om "Tak på 100" är på)
  }
};
