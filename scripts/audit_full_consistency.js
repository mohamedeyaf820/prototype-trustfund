const path = require('path');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:\\Users\\moham\\.cache\\puppeteer\\chrome\\win64-127.0.6533.88\\chrome-win64\\chrome.exe';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const roleScreens = {
  user: ['home', 'goals', 'goal-detail', 'catalog', 'activity', 'profile', 'support', 'notifications', 'ai-insights', 'ai-coach', 'finalization'],
  provider: ['provider', 'provider-offers', 'provider-orders', 'provider-claims', 'profile', 'notifications'],
  admin: ['admin', 'admin-users', 'admin-suppliers', 'admin-goals', 'admin-orders', 'admin-support', 'admin-ai', 'admin-reports', 'admin-settings', 'admin-audit', 'profile', 'notifications'],
};

async function auditVisibleState(page, label, expectCoach = false) {
  await delay(40);
  return page.evaluate(({ label, expectCoach }) => {
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    };
    const shell = document.getElementById('phoneShell');
    const shellRect = shell.getBoundingClientRect();
    const scope = document.querySelector('dialog[open]')
      || document.querySelector('.auth-screen.active')
      || document.querySelector('.screen.active');
    const standardButtons = [...scope.querySelectorAll('.main-button,.secondary-button,.auth-primary,.auth-secondary,.choose-product')]
      .filter(visible)
      .map(button => ({ text: button.textContent.trim().slice(0, 45), height: Math.round(button.getBoundingClientRect().height) }));
    const clippedInteractive = [...scope.querySelectorAll('button,input,select,textarea,a')]
      .filter(visible)
      .map(element => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, text: (element.textContent || element.getAttribute('placeholder') || '').trim().slice(0, 35), left: rect.left, right: rect.right };
      })
      .filter(item => item.left < shellRect.left - 1 || item.right > shellRect.right + 1);
    const tinyText = [...scope.querySelectorAll('*')]
      .filter(element => visible(element) && element.children.length === 0 && (element.textContent || '').trim().length > 1)
      .map(element => ({ text: element.textContent.trim().slice(0, 45), size: Number.parseFloat(getComputedStyle(element).fontSize) }))
      .filter(item => item.size < 10.5);
    const coach = document.getElementById('trustCoachFab');
    const coachVisible = coach ? visible(coach) : false;
    return {
      label,
      pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      shellOverflow: shell.scrollWidth > shell.clientWidth + 1,
      scopeOverflow: scope.scrollWidth > scope.clientWidth + 2,
      clippedInteractive,
      shortStandardButtons: standardButtons.filter(button => button.height < 44),
      tinyText: tinyText.slice(0, 8),
      tinyTextCount: tinyText.length,
      coachMissing: expectCoach && !coachVisible,
    };
  }, { label, expectCoach });
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'],
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => consoleErrors.push(error.message));
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => typeof enterApp === 'function' && typeof showScreen === 'function');
  await page.evaluate(() => document.fonts.ready);
  await delay(1700);

  const rows = [];
  for (const auth of ['splash', 'welcome', 'login', 'signup']) {
    await page.evaluate(name => showAuth(name), auth);
    rows.push(await auditVisibleState(page, `auth/${auth}`));
  }

  for (const [role, screens] of Object.entries(roleScreens)) {
    await page.evaluate(currentRole => enterApp(currentRole), role);
    for (const screen of screens) {
      await page.evaluate(name => showScreen(name), screen);
      rows.push(await auditVisibleState(page, `${role}/${screen}`, role === 'user' && screen !== 'ai-coach'));
    }
  }

  await page.evaluate(() => enterApp('user'));
  const dialogIds = await page.evaluate(() => [...document.querySelectorAll('dialog')].map(dialog => dialog.id));
  const dialogRows = [];
  for (const id of dialogIds) {
    await page.evaluate(dialogId => {
      document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
      document.getElementById(dialogId).showModal();
    }, id);
    dialogRows.push(await auditVisibleState(page, `dialog/${id}`));
  }

  const failures = [...rows, ...dialogRows].filter(row =>
    row.pageOverflow || row.shellOverflow || row.scopeOverflow || row.clippedInteractive.length || row.shortStandardButtons.length || row.coachMissing
  );
  const textWarnings = [...rows, ...dialogRows].filter(row => row.tinyTextCount > 0);
  const result = {
    coverage: {
      authStates: 4,
      roleScreens: rows.length - 4,
      dialogs: dialogRows.length,
      roles: Object.keys(roleScreens),
    },
    failures,
    textWarningStates: textWarnings.map(row => ({ label: row.label, count: row.tinyTextCount, samples: row.tinyText })),
    consoleErrors,
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (failures.length || consoleErrors.length) process.exitCode = 1;
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
