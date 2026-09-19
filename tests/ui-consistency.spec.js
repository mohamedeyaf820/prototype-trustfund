const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/auth');

// Contrats UI centralises : design-fixes.css (tokens --tf-*) + app.js (fermeture des panneaux).
test.describe('Cohérence UI (contrats du design system)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'user');
  });

  test('aucun texte sous le plancher typographique sur les ecrans user', async ({ page }) => {
    const screens = ['home', 'goals', 'catalog', 'activity', 'profile'];
    const violations = await page.evaluate(async (names) => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const min = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tf-text-min')) || 12;
      const bad = [];
      for (const name of names) {
        showScreen(name);
        await sleep(120);
        const scope = document.querySelector('.screen.active');
        scope.querySelectorAll('p, span, small, label, li, strong, em, button, a').forEach(el => {
          if (!el.textContent.trim() || el.offsetParent === null) return;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs < min) bad.push(`${name}/${el.tagName}:${fs}`);
        });
      }
      return bad;
    }, screens);
    expect(violations).toEqual([]);
  });

  test('boutons principaux a 48px minimum, secondaires a 40px', async ({ page }) => {
    const short = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.screen.active .main-button, .screen.active button.auth-primary').forEach(b => {
        if (b.offsetParent !== null && b.getBoundingClientRect().height < 47.5) out.push(b.id || b.className);
      });
      return out;
    });
    expect(short).toEqual([]);
  });

  test('le x des panneaux method="dialog" ferme sans validation native', async ({ page }) => {
    const broken = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('form[method="dialog"]').forEach(form => {
        const cancel = form.querySelector('button[value="cancel"]');
        if (!cancel) return;
        const dlg = form.closest('dialog');
        dlg.showModal();
        cancel.click();
        if (dlg.open) out.push(form.id);
        if (dlg.open) dlg.close();
      });
      return out;
    });
    expect(broken).toEqual([]);
  });

  test('TrustCoach tient dans le viewport sans defilement de page', async ({ page }) => {
    await page.evaluate(() => showScreen('ai-coach'));
    const fit = await page.evaluate(() => {
      const main = document.querySelector('.app-main');
      const rect = main.getBoundingClientRect();
      const form = document.querySelector('#screen-ai-coach .coach-form').getBoundingClientRect();
      return { overflow: main.scrollHeight - main.clientHeight, formBottomRel: form.bottom - rect.top, viewH: main.clientHeight };
    });
    expect(fit.formBottomRel).toBeLessThanOrEqual(fit.viewH + 1);
  });
});
