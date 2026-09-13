const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tmp', 'ui-audit-feedback');
const CHROME = 'C:\\Users\\moham\\.cache\\puppeteer\\chrome\\win64-127.0.6533.88\\chrome-win64\\chrome.exe';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function capture(page, name, prepare) {
  await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close()));
  await page.evaluate(prepare);
  await delay(120);
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => typeof enterApp === 'function' && typeof showAuth === 'function');
  await page.evaluate(() => document.fonts.ready);
  await delay(1900);

  await capture(page, '01-welcome-375.png', () => showAuth('welcome'));
  await capture(page, '02-guest-catalog-375.png', () => enterApp('user', { guest: true }));
  await capture(page, '03-guest-gate-375.png', () => {
    enterApp('user', { guest: true });
    document.getElementById('guestGateMessage').textContent = 'Connectez-vous pour associer ce produit à un objectif.';
    openSheet('guestGateSheet');
  });
  await capture(page, '04-privacy-375.png', () => {
    showAuth('welcome');
    openSheet('privacySheet');
  });
  await capture(page, '05-provider-home-375.png', () => enterApp('provider'));
  await capture(page, '06-provider-claims-375.png', () => {
    enterApp('provider');
    showScreen('provider-claims');
  });

  const mobileAudit = await page.evaluate(() => {
    enterApp('provider');
    const shell = document.getElementById('phoneShell');
    const metrics = [...document.querySelectorAll('#screen-provider .metrics-scroll article')].map(el => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, width: r.width };
    });
    const buttons = [...document.querySelectorAll('.screen.active button, .bottom-nav .nav-set.active button')]
      .map(el => Math.round(el.getBoundingClientRect().height))
      .filter(height => height > 0);
    return {
      viewport: innerWidth,
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
      shellOverflow: shell.scrollWidth > shell.clientWidth,
      metricCount: metrics.length,
      metricsWithinShell: metrics.every(item => item.left >= shell.getBoundingClientRect().left && item.right <= shell.getBoundingClientRect().right + 1),
      buttonMin: Math.min(...buttons),
      buttonMax: Math.max(...buttons),
    };
  });

  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });
  await capture(page, '07-provider-web-1440.png', () => enterApp('provider'));
  const providerColumns = await page.evaluate(() => getComputedStyle(document.querySelector('#screen-provider .metrics-scroll')).gridTemplateColumns);
  await capture(page, '08-admin-web-1440.png', () => enterApp('admin'));
  const adminColumns = await page.evaluate(() => getComputedStyle(document.querySelector('#screen-admin .metrics-scroll')).gridTemplateColumns);
  const desktopAudit = await page.evaluate(({ providerColumns, adminColumns }) => ({
    viewport: innerWidth,
    pageOverflow: document.documentElement.scrollWidth > innerWidth,
    providerColumns,
    adminColumns,
  }), { providerColumns, adminColumns });

  console.log(JSON.stringify({ mobileAudit, desktopAudit }, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
