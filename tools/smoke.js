/* Snabbtest i riktig webbläsare: klickar igenom appen och tar skärmbilder.
   Kör:  node tools/smoke.js   (kräver playwright och en server på :8123) */
const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://127.0.0.1:8123/';
const SHOTS = path.join(__dirname, '..', '..', 'shots');

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  async function newPage(size, name) {
    const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(name + ': ' + m.text());
    });
    page.on('pageerror', (e) => errors.push(name + ' pageerror: ' + e.message));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    return page;
  }

  const fs = require('fs');
  fs.mkdirSync(SHOTS, { recursive: true });

  /* --- telefon: startskärm --- */
  const phone = await newPage({ width: 390, height: 844 }, 'phone');
  await phone.screenshot({ path: path.join(SHOTS, '1-setup.png') });

  /* starta 301 och kasta lite */
  await phone.click('[data-act="start"]');
  await phone.waitForSelector('.keypad');
  await phone.click('.key.mult[data-m="3"]');
  await phone.click('.key.num:nth-child(20)'); // 20
  await phone.click('.key.mult[data-m="3"]');
  await phone.click('.key.num:nth-child(19)'); // 19
  await phone.click('.key.red');
  await phone.screenshot({ path: path.join(SHOTS, '2-x01.png') });
  const remaining = await phone.textContent('.pill');

  /* rättningsrutan */
  await phone.click('[data-act="correct"]');
  await phone.waitForSelector('.throw-list');
  await phone.waitForTimeout(400);
  await phone.screenshot({ path: path.join(SHOTS, '3-correct.png') });
  await phone.click('[data-act="close-modal"]');

  /* farfar */
  await phone.click('[data-act="next"]');
  await phone.click('[data-act="menu"]');
  phone.on('dialog', (d) => d.accept());
  await phone.click('[data-act="menu"]').catch(() => {});
  await phone.waitForSelector('[data-act="mode"]');
  await phone.click('[data-act="mode"][data-mode="FARFAR"]');
  await phone.click('[data-act="start"]');
  await phone.waitForSelector('.keypad');
  await phone.click('.key.mult[data-m="3"]');
  await phone.click('.key.num:nth-child(20)');
  await phone.waitForTimeout(300);
  await phone.screenshot({ path: path.join(SHOTS, '4-farfar-flash.png') });
  await phone.waitForTimeout(1600);
  await phone.screenshot({ path: path.join(SHOTS, '5-farfar.png') });

  /* --- surfplatta --- */
  const tab = await newPage({ width: 1280, height: 800 }, 'tablet');
  await tab.click('[data-act="mode"][data-mode="501"]');
  await tab.click('[data-act="start"]');
  await tab.waitForSelector('.keypad');
  await tab.click('.key.mult[data-m="3"]');
  await tab.click('.key.num:nth-child(20)');
  await tab.click('.key.num:nth-child(20)');
  await tab.screenshot({ path: path.join(SHOTS, '6-tablet.png') });

  /* --- regler och historik --- */
  await tab.click('[data-act="next"]');
  await tab.click('[data-act="menu"]');
  tab.on('dialog', (d) => d.accept());
  await tab.click('[data-act="menu"]').catch(() => {});
  await tab.waitForSelector('[data-act="rules"]');
  await tab.click('[data-act="rules"]');
  await tab.waitForTimeout(400);
  await tab.screenshot({ path: path.join(SHOTS, '7-rules.png') });
  await tab.click('[data-act="close-modal"]');

  /* --- spela klart en 301 och titta på resultat + historik --- */
  const win = await newPage({ width: 390, height: 844 }, 'win');
  win.on('dialog', (d) => d.accept());
  await win.click('[data-act="mode"][data-mode="301"]');
  for (const id of await win.$$eval('[data-act="rm-player"]', (els) => els.map((e) => e.dataset.id))) {
    if (id) await win.click(`[data-act="rm-player"][data-id="${id}"]`).catch(() => {});
  }
  await win.fill('#new-player', 'Kristian');
  await win.press('#new-player', 'Enter');
  await win.click('[data-act="start"]');
  await win.waitForSelector('.keypad');
  const T20 = async () => {
    await win.click('.key.mult[data-m="3"]');
    await win.click('.key.num:nth-child(20)');
  };
  await T20();
  await T20();
  await T20();
  await win.click('[data-act="next"]'); // 121 kvar
  await T20();
  await T20();
  await win.click('.key.mult[data-m="1"]');
  await win.click('.key.num:nth-child(1)'); // 1 -> exakt 0
  await win.waitForTimeout(300);
  await win.screenshot({ path: path.join(SHOTS, '8-win-overlay.png') });
  await win.click('[data-act="next"]');
  await win.waitForSelector('.result');
  await win.screenshot({ path: path.join(SHOTS, '9-result.png') });
  await win.click('[data-act="menu-force"]');
  await win.waitForSelector('[data-act="history"]');
  await win.click('[data-act="history"]');
  await win.waitForSelector('.hist-list');
  await win.screenshot({ path: path.join(SHOTS, '10-history.png') });
  await win.click('[data-act="hist-tab"][data-tab="stats"]');
  await win.screenshot({ path: path.join(SHOTS, '11-stats.png') });

  console.log('kvar efter T20+T19+röd:', remaining);
  console.log(errors.length ? 'KONSOLFEL:\n' + errors.join('\n') : 'inga konsolfel');
  await browser.close();
})();
