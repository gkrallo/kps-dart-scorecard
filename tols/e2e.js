/* Beteendetest i riktig webbläsare: sparning, rättning och omladdning.
   Kör:  node tools/e2e.js   (kräver playwright och en server på :8123) */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8123/';

let pass = 0;
let fail = 0;
function check(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) pass++;
  else {
    fail++;
    console.log('  FAIL ' + name + ' fick ' + JSON.stringify(actual) + ' förväntat ' + JSON.stringify(expected));
  }
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto(BASE);

  const T = async (n, m) => {
    if (m) await page.click(`.key.mult[data-m="${m}"]`);
    await page.click(`.key.num:nth-child(${n})`);
  };
  const scores = () => page.$$eval('.pcard .pscore', (els) => els.map((e) => e.textContent));

  /* --- 301: spela två turer --- */
  await page.click('[data-act="mode"][data-mode="301"]');
  await page.click('[data-act="start"]');
  await page.waitForSelector('.keypad');
  await T(20, 3);
  await T(20, 3);
  await T(20, 3);
  await page.click('[data-act="next"]');
  check('Sofia efter 180', (await scores())[0], '121');

  await T(5, 1);
  await page.click('[data-act="next"]');
  check('Emil efter 5', (await scores())[1], '296');

  /* --- rätta ett kast från förra spelarens tur --- */
  await page.click('[data-act="correct"]');
  await page.waitForSelector('.throw-list');
  const rows = await page.$$eval('.throw-pick', (els) =>
    els.map((e) => e.querySelector('.throw-meta').textContent + ' | ' + e.dataset.ai)
  );
  check('rättningslistan visar senaste kastet först', rows[0].indexOf('Emil') > -1, true);
  const sofiaFirst = rows[rows.length - 1];
  const ai = sofiaFirst.split('|')[1].trim();
  await page.click(`[data-act="pick-correct"][data-ai="${ai}"]`);
  await page.waitForSelector('.keypad.compact');
  await page.click('.keypad.compact .key.num:nth-child(1)'); // 1 poäng i stället för T20
  check('Sofia räknas om efter rättning', (await scores())[0], '180');
  check('Emil påverkas inte', (await scores())[1], '296');
  check('rutan stängs inte av sig själv', await page.isVisible('.modal'), true);
  await page.click('[data-act="close-modal"]');

  /* --- ta bort ett kast --- */
  await page.click('[data-act="correct"]');
  await page.waitForSelector('.throw-list');
  const firstAi = await page.$eval('.throw-pick', (e) => e.dataset.ai);
  await page.click(`[data-act="del-throw"][data-ai="${firstAi}"]`);
  check('Emils kast borttaget', (await scores())[1], '301');
  await page.click('[data-act="close-modal"]');

  /* --- ladda om sidan: matchen ska gå att fortsätta --- */
  await page.reload();
  await page.waitForSelector('[data-act="resume"]');
  check('pågående match erbjuds', await page.isVisible('[data-act="resume"]'), true);
  await page.click('[data-act="resume"]');
  await page.waitForSelector('.keypad');
  check('ställningen överlevde omladdning', await scores(), ['180', '301', '301']);

  /* --- ångra hela vägen tillbaka --- */
  for (let i = 0; i < 15; i++) {
    if (await page.isDisabled('[data-act="undo"]')) break;
    await page.click('[data-act="undo"]');
  }
  check('allt ångrat', await scores(), ['301', '301', '301']);

  /* --- Farfar: utslagning och vinst --- */
  await page.click('[data-act="menu"]');
  await page.waitForSelector('[data-act="mode"]');
  for (const id of await page.$$eval('[data-act="rm-player"]', (e) => e.map((x) => x.dataset.id))) {
    await page.click(`[data-act="rm-player"][data-id="${id}"]`).catch(() => {});
  }
  await page.fill('#new-player', 'A');
  await page.press('#new-player', 'Enter');
  await page.fill('#new-player', 'B');
  await page.press('#new-player', 'Enter');
  await page.click('[data-act="mode"][data-mode="FARFAR"]');
  await page.click('[data-act="start"]');
  await page.waitForSelector('.keypad');
  await page.click('.key.miss');
  await page.click('.key.miss');
  await page.click('.key.miss'); // A ute
  await page.waitForTimeout(1600);
  check('B får kasta klart rundan', await page.textContent('.thrower'), 'B kastar');
  await T(20, 1); // B klarar 15
  await page.waitForTimeout(1700);
  await page.waitForSelector('.result');
  check('B vinner', (await page.textContent('.winner')).trim(), 'B');

  check('inga JS-fel', errors, []);
  console.log(pass + ' godkända, ' + fail + ' underkända');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
