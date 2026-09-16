'use strict';
/**
 * TrustFund - audit du design system.
 *
 * Mesure, pour chaque ecran, panneau (dialog) et etat d authentification :
 *  - les debordements (page, telephone, zone active, cartes rognees) ;
 *  - la hauteur de tous les controles interactifs ;
 *  - la taille des textes (plancher de lisibilite) ;
 *  - les cadres imbriques (un cadre dans un autre cadre) ;
 *  - la geometrie des panneaux venant du bas (largeur, marges, padding, rayon).
 *
 * Usage : node scripts/audit_design_system.js
 *         TRUST_AUDIT_WIDTHS=320,375,414 node scripts/audit_design_system.js
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');
const { ROOT, resolveChromePath } = require('./chrome-path');

const OUT_DIR = path.join(ROOT, 'tmp', 'audit-design-system');
const TEXT_MIN = 12;
const BUTTON_MIN = 40;
const BUTTON_PRIMARY_MIN = 48;
const WIDTHS = (process.env.TRUST_AUDIT_WIDTHS || '375').split(',').map((value) => Number(value.trim())).filter(Boolean);

const roleScreens = {
  user: ['home', 'goals', 'goal-detail', 'catalog', 'activity', 'profile', 'support', 'notifications', 'ai-insights', 'ai-coach', 'finalization'],
  provider: ['provider', 'provider-offers', 'provider-orders', 'provider-claims', 'profile', 'notifications'],
  admin: ['admin', 'admin-users', 'admin-suppliers', 'admin-goals', 'admin-orders', 'admin-support', 'admin-ai', 'admin-reports', 'admin-settings', 'admin-audit', 'profile', 'notifications'],
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const auditState = (page, label, kind, viewport, expectCoach) => page.evaluate((config) => {
  const round = (value) => Math.round(value * 10) / 10;
  const css = (el) => getComputedStyle(el);
  const visible = (el) => {
    const style = css(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
  };
  const name = (el) => {
    if (el.id) return el.id;
    const classes = (el.className || '').toString().split(' ').filter(Boolean).slice(0, 3);
    return el.tagName.toLowerCase() + (classes.length ? '.' + classes.join('.') : '');
  };
  const borderSides = (el) => {
    const style = css(el);
    let sides = 0;
    if ((parseFloat(style.borderTopWidth) || 0) > 0) sides += 1;
    if ((parseFloat(style.borderRightWidth) || 0) > 0) sides += 1;
    if ((parseFloat(style.borderBottomWidth) || 0) > 0) sides += 1;
    if ((parseFloat(style.borderLeftWidth) || 0) > 0) sides += 1;
    return sides;
  };
  const framed = (el) => {
    const style = css(el);
    return borderSides(el) >= 3 || style.boxShadow !== 'none';
  };
  const darkSurface = (el) => {
    const style = css(el);
    const parts = style.backgroundColor.replace(/[^0-9,]/g, '').split(',');
    if (parts.length < 3) return false;
    const red = Number(parts[0]);
    const green = Number(parts[1]);
    const blue = Number(parts[2]);
    const alpha = parts.length > 3 ? Number(parts[3]) : 1;
    if (alpha < 0.5) return false;
    const luminance = (red + green + blue) / 3 / 255;
    const radius = parseFloat(style.borderTopLeftRadius) || 0;
    return luminance < 0.45 && radius >= 6;
  };
  const darkSurfaces = [];
  const scope = document.querySelector('dialog[open]') || document.querySelector('.auth-screen.active') || document.querySelector('.screen.active');
  if (!scope) return { label: config.label, kind: config.kind, viewport: config.viewport, missing: true };
  const shell = document.getElementById('phoneShell');
  const shellRect = shell.getBoundingClientRect();
  const scopeRect = scope.getBoundingClientRect();
  const controls = Array.prototype.slice.call(scope.querySelectorAll('button,[role=button],summary,input[type=submit]')).filter(visible);
  const rows = controls.map((el) => {
    const rect = el.getBoundingClientRect();
    return { sel: name(el), text: (el.textContent || el.value || '').trim().slice(0, 28), h: Math.round(rect.height), cls: (el.className || '').toString() };
  });
  const shortButtons = rows.filter((row) => row.h < config.buttonMin);
  const shortPrimary = rows.filter((row) => new RegExp(config.primaryPattern).test(row.cls) && row.h < config.buttonPrimaryMin);
  const tiny = Array.prototype.slice.call(scope.querySelectorAll('*'))
    .filter((el) => visible(el) && el.children.length === 0 && (el.textContent || '').trim().length > 1)
    .map((el) => ({ sel: name(el), parent: name(el.parentElement), size: round(parseFloat(css(el).fontSize)), text: el.textContent.trim().slice(0, 28) }))
    .filter((item) => item.size < config.textMin);
  const nested = [];
  Array.prototype.slice.call(scope.querySelectorAll('*')).filter((el) => visible(el) && framed(el)).forEach((el) => {
    let depth = 0;
    let parent = el.parentElement;
    let lastFrame = null;
    while (parent && parent !== scope && parent !== document.body) {
      if (visible(parent) && framed(parent)) { depth += 1; lastFrame = parent; }
      parent = parent.parentElement;
    }
    if (depth > 0) nested.push({ sel: name(el), parent: lastFrame ? name(lastFrame) : null, depth: depth });
  });
  Array.prototype.slice.call(scope.querySelectorAll('button,div,article,section,aside,header,nav')).filter(visible).forEach(function (el) {
    const rect = el.getBoundingClientRect();
    if (rect.width * rect.height < 6000) return;
    if (!darkSurface(el)) return;
    const style = css(el);
    darkSurfaces.push({ sel: name(el), bg: style.backgroundColor, radius: style.borderTopLeftRadius, w: Math.round(rect.width), h: Math.round(rect.height), text: (el.textContent || '').trim().slice(0, 24) });
  });
  const clipped = Array.prototype.slice.call(scope.querySelectorAll('article,li,.summary-band,.mobile-goal-card,.mobile-product,.metrics-scroll'))
    .filter(visible)
    .map((el) => { const rect = el.getBoundingClientRect(); return { sel: name(el), left: Math.round(rect.left - scopeRect.left), right: Math.round(rect.right - scopeRect.left) }; })
    .filter((item) => item.left < -1 || item.right > Math.round(scopeRect.width) + 1);
  let sheet = null;
  if (scope.tagName === 'DIALOG') {
    const style = css(scope);
    const container = scope.firstElementChild;
    sheet = {
      width: Math.round(scopeRect.width),
      leftMargin: Math.round(scopeRect.left - shellRect.left),
      rightMargin: Math.round(shellRect.right - scopeRect.right),
      radius: style.borderTopLeftRadius,
      paddingLeft: Math.round(parseFloat(style.paddingLeft) || 0),
      paddingTop: Math.round(parseFloat(style.paddingTop) || 0),
      container: container ? name(container) : null,
      containerPadding: container ? Math.round(parseFloat(css(container).paddingLeft) || 0) : null,
    };
  }
  const screenStyle = css(scope);
  const fab = document.getElementById('trustCoachFab');
  return {
    label: config.label,
    kind: config.kind,
    viewport: config.viewport,
    screenPadding: [screenStyle.paddingTop, screenStyle.paddingRight, screenStyle.paddingBottom, screenStyle.paddingLeft].join(' '),
    pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    shellOverflow: shell.scrollWidth > shell.clientWidth + 1,
    scopeOverflow: scope.scrollWidth > scope.clientWidth + 2,
    buttonHeights: Array.from(new Set(rows.map((row) => row.h))).sort((a, b) => a - b),
    buttons: rows,
    shortButtons: shortButtons,
    shortPrimary: shortPrimary,
    tinyTextCount: tiny.length,
    tinyText: tiny.slice(0, 40),
    nestedFrameCount: nested.length,
    nestedFrames: nested.slice(0, 30),
    darkSurfaceCount: darkSurfaces.length,
    darkSurfaces: darkSurfaces.slice(0, 12),
    clippedCards: clipped,
    sheet: sheet,
    coachMissing: Boolean(config.expectCoach) && !(fab && visible(fab)),
  };
}, { label: label, kind: kind, viewport: viewport, textMin: TEXT_MIN, buttonMin: BUTTON_MIN, buttonPrimaryMin: BUTTON_PRIMARY_MIN, primaryPattern: 'main-button|auth-primary|login-submit', expectCoach: expectCoach });

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: resolveChromePath(),
    args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'],
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  const states = [];
  for (const width of WIDTHS) {
    await page.setViewport({ width: width, height: 812, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => typeof enterApp === 'function' && typeof showScreen === 'function');
    await page.evaluate(() => document.fonts.ready);
    await delay(1500);
    for (const auth of ['splash', 'welcome', 'login', 'signup']) {
      await page.evaluate((value) => showAuth(value), auth);
      states.push(await auditState(page, 'auth/' + auth, 'navigation', width, false));
    }
    for (const role of Object.keys(roleScreens)) {
      await page.evaluate((value) => enterApp(value), role);
      await delay(60);
      for (const screen of roleScreens[role]) {
        await page.evaluate((value) => showScreen(value), screen);
        states.push(await auditState(page, role + '/' + screen, 'screen', width, role === 'user' && screen !== 'ai-coach'));
      }
    }
    await page.evaluate(() => enterApp('user'));
    const dialogIds = await page.evaluate(() => Array.prototype.slice.call(document.querySelectorAll('dialog')).map((dialog) => dialog.id));
    for (const id of dialogIds) {
      await page.evaluate((value) => {
        Array.prototype.slice.call(document.querySelectorAll('dialog[open]')).forEach((dialog) => dialog.close());
        const target = document.getElementById(value);
        if (target) target.showModal();
      }, id);
      states.push(await auditState(page, 'sheet/' + id, 'sheet', width, false));
    }
  }
  const violations = states.filter((state) => state.pageOverflow || state.shellOverflow || state.scopeOverflow || state.clippedCards.length || state.shortPrimary.length || state.coachMissing);
  const textViolations = states.filter((state) => state.tinyTextCount > 0);
  const nestedViolations = states.filter((state) => state.nestedFrameCount > 0);
  const sheets = states.filter((state) => state.sheet);
  const distinctSheetGeometry = Array.from(new Set(sheets.map((state) => state.sheet.width + 'px L' + state.sheet.leftMargin + ' R' + state.sheet.rightMargin)));
  const distinctScreenPaddings = Array.from(new Set(states.filter((state) => state.kind === 'screen').map((state) => state.screenPadding)));
  const report = {
    viewports: WIDTHS,
    states: states.length,
    thresholds: { textMin: TEXT_MIN, buttonMin: BUTTON_MIN, buttonPrimaryMin: BUTTON_PRIMARY_MIN },
    overflowOrClipping: violations.map((state) => ({ label: state.label, page: state.pageOverflow, shell: state.shellOverflow, scope: state.scopeOverflow, clipped: state.clippedCards, shortPrimary: state.shortPrimary, coachMissing: state.coachMissing })),
    textViolations: textViolations.map((state) => ({ label: state.label, count: state.tinyTextCount, samples: state.tinyText.slice(0, 40) })),
    nestedFrames: nestedViolations.map((state) => ({ label: state.label, count: state.nestedFrameCount, samples: state.nestedFrames.slice(0, 30) })),
    distinctSheetGeometry: distinctSheetGeometry,
    distinctScreenPaddings: distinctScreenPaddings,
    darkSurfaces: Array.from(new Set(states.flatMap(function (state) { return (state.darkSurfaces || []).map(function (item) { return item.sel + ' ' + item.bg + ' ' + item.w + 'x' + item.h; }); }))),
    consoleErrors: consoleErrors,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'audit.json'), JSON.stringify({ report: report, states: states }, null, 2), 'utf8');
  console.log(JSON.stringify(report, null, 2));
  console.log('--- rapport detaille : ' + path.join(OUT_DIR, 'audit.json'));
  await browser.close();
  if (violations.length || textViolations.length || nestedViolations.length || consoleErrors.length) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });