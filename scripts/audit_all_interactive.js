'use strict';
/**
 * TrustFund - audit interactif complet.
 *
 * Ouvre chaque ecran de chaque role et chaque panneau, clique chaque bouton
 * visible et verifie : effet detecte (navigation, panneau, toast, changement
 * DOM), erreur console, image cassee, bouton sans nom accessible, IDs dupliques.
 *
 * Usage : node scripts/audit_all_interactive.js
 *         TRUST_INTERACTIVE_LIMIT=5 node scripts/audit_all_interactive.js  (test rapide)
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');
const { ROOT, resolveChromePath } = require('./chrome-path');

const OUT_DIR = path.join(ROOT, 'tmp', 'audit-interactive');
const WIDTH = Number(process.env.TRUST_INTERACTIVE_WIDTH || 375);
const HEIGHT = 812;
const LIMIT = Number(process.env.TRUST_INTERACTIVE_LIMIT || 0);
const CLICK_WAIT = 220;

const roleScreens = {
  user: ['home', 'goals', 'goal-detail', 'catalog', 'activity', 'profile', 'support', 'notifications', 'ai-insights', 'ai-coach', 'finalization'],
  provider: ['provider', 'provider-offers', 'provider-orders', 'provider-claims', 'profile', 'notifications'],
  admin: ['admin', 'admin-users', 'admin-suppliers', 'admin-goals', 'admin-orders', 'admin-support', 'admin-ai', 'admin-reports', 'admin-settings', 'admin-audit', 'profile', 'notifications'],
};
const authScreens = ['welcome', 'login', 'signup'];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const snapshotFn = () => {
  const activeScreen = document.querySelector('.screen.active');
  const activeAuth = document.querySelector('.auth-screen.active');
  const openDialogs = Array.from(document.querySelectorAll('dialog[open]')).map((d) => d.id).sort().join(',');
  const toasts = document.getElementById('toastZone');
  return {
    screen: activeScreen ? activeScreen.id : '',
    auth: activeAuth ? activeAuth.id : '',
    dialogs: openDialogs,
    toasts: toasts ? toasts.textContent.slice(0, 80) : '',
    bodyClass: document.body.className,
  };
};

const collectButtonsFn = (scopeSel) => {
  const scope = scopeSel === 'dialog' ? document.querySelector('dialog[open]') : document.querySelector(scopeSel);
  if (!scope) return [];
  const visible = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0 && r.width > 0 && r.height > 0;
  };
  const label = (el) => {
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    if (text) return text;
    const aria = el.getAttribute('aria-label');
    if (aria) return '[' + aria + ']';
    if (el.title) return '[' + el.title + ']';
    return '(SANS NOM)';
  };
  const describe = (el) => {
    let idPath = el.id ? '#' + el.id : '';
    if (!idPath) {
      const parent = el.closest('[id]');
      idPath = (parent ? parent.id + ' > ' : '') + el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ').filter(Boolean).slice(0, 2).join('.') : '');
    }
    return idPath;
  };
  return Array.from(scope.querySelectorAll('button, [role="button"], [data-view-target], [data-open], [data-close], input[type="submit"]'))
    .filter(el => el.matches('button, [role="button"], input[type="submit"]') || el.hasAttribute('data-view-target') || el.hasAttribute('data-open') || el.hasAttribute('data-close'))
    .filter(visible)
    .map((el, index) => {
      el.setAttribute('data-audit-idx', String(index));
      return { index, desc: describe(el), label: label(el), named: label(el) !== '(SANS NOM)' };
    });
};

const clickFn = (index) => {
  const scope = document.querySelector('dialog[open]') || document.querySelector('.screen.active') || document.querySelector('.auth-screen.active');
  const btn = scope && scope.querySelector('[data-audit-idx="' + index + '"]');
  if (!btn) return { clicked: false };
  const scopeHtml = scope.innerHTML.length;
  btn.click();
  return { clicked: true, scopeHtmlBefore: scopeHtml };
};

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: resolveChromePath(),
    protocolTimeout: 180000,
    args: ['--allow-file-access-from-files', '--no-sandbox'],
  });
  const page = await browser.newPage();
  page.on('dialog', (dialog) => dialog.dismiss().catch(() => {}));
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => pageErrors.push(String(e.message).slice(0, 200)));

  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => typeof enterApp === 'function' && typeof showScreen === 'function');
  await page.evaluate(() => document.fonts.ready);
  await delay(1200);

  const results = [];
  const staticIssues = await page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    return { duplicateIds: Array.from(new Set(dup)) };
  });

  const checkImages = async (label) => page.evaluate((stateLabel) => {
    const scope = document.querySelector('dialog[open]') || document.querySelector('.screen.active') || document.querySelector('.auth-screen.active') || document;
    return Array.from(scope.querySelectorAll('img'))
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => ({ state: stateLabel, src: (img.getAttribute('src') || '').slice(0, 80) }));
  }, label);

  const auditScope = async (label, setup, scopeSel) => {
    await setup();
    await delay(60);
    const brokenImages = await checkImages(label);
    const overflowInfo = await page.evaluate((sel) => {
      const scope = sel === 'dialog' ? document.querySelector('dialog[open]') : document.querySelector(sel);
      if (!scope) return { over: false, culprits: [] };
      const limit = scope.getBoundingClientRect().right;
      const culprits = Array.from(scope.querySelectorAll('*'))
        .filter((el) => {
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.position === 'fixed') return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.right > limit + 2;
        })
        .slice(0, 3)
        .map((el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ').filter(Boolean).slice(0, 2).join('.')));
      return { over: scope.scrollWidth > scope.clientWidth + 2, culprits };
    }, scopeSel);
    const buttons = await page.evaluate(collectButtonsFn, scopeSel);
    const clicked = LIMIT ? buttons.slice(0, LIMIT) : buttons;
    const buttonResults = [];
    for (const btn of clicked) {
      try {
      const before = await page.evaluate(snapshotFn);
      const errCount = pageErrors.length;
      const clickedInfo = await page.evaluate(clickFn, btn.index);
      await delay(CLICK_WAIT);
      const after = await page.evaluate(snapshotFn);
      const domChanged = clickedInfo.clicked ? await page.evaluate((prevLen) => {
        const scope = document.querySelector('dialog[open]') || document.querySelector('.screen.active') || document.querySelector('.auth-screen.active');
        return !scope || scope.innerHTML.length !== prevLen;
      }, clickedInfo.scopeHtmlBefore) : false;
      let effect = 'none';
      if (after.dialogs !== before.dialogs) effect = after.dialogs.length > before.dialogs.length ? 'sheet-open' : 'sheet-close';
      else if (after.screen !== before.screen) effect = 'navigation';
      else if (after.auth !== before.auth) effect = 'auth';
      else if (after.toasts !== before.toasts) effect = 'toast';
      else if (domChanged) effect = 'dom-change';
      const newErrors = pageErrors.slice(errCount);
      buttonResults.push({ desc: btn.desc, label: btn.label, named: btn.named, effect, errors: newErrors });
      } catch (error) {
        buttonResults.push({ desc: btn.desc, label: btn.label, named: btn.named, effect: 'crash', errors: [String(error.message).slice(0, 120)] });
        await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'networkidle0' }).catch(() => {});
        await page.waitForFunction(() => typeof enterApp === 'function', { timeout: 15000 }).catch(() => {});
        await delay(1000);
      }
      await setup();
      await delay(40);
    }
    results.push({ label, buttonCount: buttons.length, tested: buttonResults.length, overflow: overflowInfo.over, overflowCulprits: overflowInfo.culprits, brokenImages, noEffect: buttonResults.filter((b) => b.effect === 'none'), errored: buttonResults.filter((b) => b.errors.length), unnamed: buttonResults.filter((b) => !b.named) });
    console.log(`  ${label}: ${buttons.length} boutons testes${overflowInfo.over ? ' [OVERFLOW ' + overflowInfo.culprits.join(',') + ']' : ''}${brokenImages.length ? ' [IMG CASSEE]' : ''}`);
  };

  console.log('--- Audit interactif complet ---');
  for (const auth of authScreens) {
    await auditScope('auth/' + auth, async () => {
      await page.evaluate((value) => { document.querySelectorAll('dialog[open]').forEach((d) => d.close()); showAuth(value); }, auth);
    }, '.auth-screen.active');
  }
  for (const role of Object.keys(roleScreens)) {
    await page.setViewport({ width: role === 'admin' ? 1280 : WIDTH, height: role === 'admin' ? 900 : HEIGHT, deviceScaleFactor: 1 });
    for (const screen of roleScreens[role]) {
      await auditScope(role + '/' + screen, async () => {
        await page.evaluate((r, s) => { document.querySelectorAll('dialog[open]').forEach((d) => d.close()); enterApp(r); showScreen(s); }, role, screen);
      }, '.screen.active');
    }
  }
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  const dialogIds = await page.evaluate(() => Array.from(document.querySelectorAll('dialog')).map((d) => d.id));
  for (const id of dialogIds) {
    await auditScope('sheet/' + id, async () => {
      await page.evaluate((did) => {
        document.querySelectorAll('dialog[open]').forEach((d) => d.close());
        enterApp('user');
        const target = document.getElementById(did);
        if (target) target.showModal();
      }, id);
    }, 'dialog');
  }

  const report = {
    generatedAt: new Date().toISOString(),
    width: WIDTH,
    states: results.length,
    buttonsTested: results.reduce((sum, r) => sum + r.tested, 0),
    duplicateIds: staticIssues.duplicateIds,
    overflowStates: results.filter((r) => r.overflow).map((r) => ({ state: r.label, culprits: r.overflowCulprits })),
    brokenImages: results.flatMap((r) => r.brokenImages),
    noEffect: results.filter((r) => r.noEffect.length).map((r) => ({ state: r.label, buttons: r.noEffect.map((b) => b.desc + ' «' + b.label + '»') })),
    errored: results.filter((r) => r.errored.length).map((r) => ({ state: r.label, buttons: r.errored.map((b) => b.desc + ' «' + b.label + '» -> ' + b.errors.join(' | ')) })),
    unnamed: results.filter((r) => r.unnamed.length).map((r) => ({ state: r.label, buttons: r.unnamed.map((b) => b.desc) })),
    pageErrors: Array.from(new Set(pageErrors)),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'interactive.json'), JSON.stringify({ report, results }, null, 2), 'utf8');
  console.log('\n--- RAPPORT ---');
  console.log(JSON.stringify(report, null, 2));
  console.log('--- rapport detaille : ' + path.join(OUT_DIR, 'interactive.json'));
  await browser.close();
})();
