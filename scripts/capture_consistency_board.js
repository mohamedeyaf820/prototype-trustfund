'use strict';
/**
 * TrustFund - planche de coherence des ecrans.
 *
 * Regroupe les ecrans par type (formulaire, panneau venant du bas, cartes,
 * confirmation, navigation), les capture a taille telephone et les assemble
 * cote a cote dans un PDF : les differences sautent aux yeux.
 *
 * Usage : node scripts/capture_consistency_board.js
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');
const { ROOT, resolveChromePath } = require('./chrome-path');

const OUT_DIR = path.join(ROOT, 'tmp', 'board');
const OUTPUT_DIR = path.join(ROOT, 'output', 'pdf');
const OUTPUT_PDF = path.join(OUTPUT_DIR, 'TrustFund_planche_coherence.pdf');
const WIDTH = Number(process.env.TRUST_BOARD_WIDTH || 375);
const HEIGHT = Number(process.env.TRUST_BOARD_HEIGHT || 812);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* Un etat = auth (ecran de connexion) ou role + ecran + panneau. */
const GROUPS = [
  { title: 'Ecrans avec formulaire', note: 'Une action principale, memes champs, memes espacements.', items: [
    { label: 'Connexion', setup: { auth: 'login' } },
    { label: 'Creer un compte', setup: { auth: 'signup' } },
    { label: 'Nouvel objectif', setup: { role: 'user', sheet: 'goalSheet' } },
    { label: 'Paiement', setup: { role: 'user', sheet: 'paymentSheet' } },
    { label: 'Retrait de fonds', setup: { role: 'user', sheet: 'withdrawSheet' } },
    { label: 'Nouveau produit', setup: { role: 'provider', sheet: 'offerSheet' } },
  ] },
  { title: 'Ecrans avec panneau venant du bas', note: 'Memes marges, meme largeur, meme padding, meme rayon.', items: [
    { label: 'Contacter TrustFund', setup: { role: 'user', sheet: 'contactProviderSheet', set: { contactProductRef: 'Lenovo IdeaPad' } } },
    { label: 'Politique de confidentialite', setup: { role: 'user', sheet: 'privacySheet' } },
    { label: 'Conditions d utilisation', setup: { role: 'user', sheet: 'termsSheet' } },
    { label: 'Repondre a une reclamation', setup: { role: 'provider', screen: 'provider-claims', sheet: 'providerReplySheet' } },
    { label: 'Detail d une commande', setup: { role: 'provider', screen: 'provider-orders', sheet: 'orderDetailSheet' } },
    { label: 'Confirmer la reception', setup: { role: 'user', sheet: 'receptionSheet' } },
  ] },
  { title: 'Ecrans avec cartes', note: 'Les chiffres cles tiennent dans la largeur, sans rognage.', items: [
    { label: 'Accueil', setup: { role: 'user', screen: 'home' } },
    { label: 'Mes objectifs', setup: { role: 'user', screen: 'goals' } },
    { label: 'Tableau fournisseur', setup: { role: 'provider', screen: 'provider' } },
    { label: 'Mes offres', setup: { role: 'provider', screen: 'provider-offers' } },
    { label: 'Tableau administrateur', setup: { role: 'admin', screen: 'admin' } },
    { label: 'Boutique', setup: { role: 'user', screen: 'catalog' } },
  ] },
  { title: 'Ecrans de confirmation', note: 'Une seule action principale, message court.', items: [
    { label: 'Finalisation', setup: { role: 'user', screen: 'finalization' } },
    { label: 'Verification d identite', setup: { role: 'user', sheet: 'kycSheet' } },
    { label: 'Compte requis pour agir', setup: { role: 'user', guest: true, sheet: 'guestGateSheet' } },
    { label: 'Mot de passe oublie', setup: { auth: 'login', sheet: 'passwordResetSheet' } },
    { label: 'Comprendre TrustFund', setup: { role: 'user', sheet: 'trustSheet' } },
    { label: 'Analyse IA', setup: { role: 'user', screen: 'ai-insights' } },
  ] },
  { title: 'Ecrans de navigation', note: 'En-tete, retour et actions places au meme endroit.', items: [
    { label: 'Profil', setup: { role: 'user', screen: 'profile' } },
    { label: 'Notifications', setup: { role: 'user', screen: 'notifications' } },
    { label: 'Commandes fournisseur', setup: { role: 'provider', screen: 'provider-orders' } },
    { label: 'Comptes utilisateurs', setup: { role: 'admin', screen: 'admin-users' } },
    { label: 'Aide et support', setup: { role: 'user', screen: 'support' } },
    { label: 'TrustCoach', setup: { role: 'user', screen: 'ai-coach' } },
  ] },
];

const htmlEscape = function (value) {
  return String(value).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
};

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: resolveChromePath(),
    args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => typeof enterApp === 'function' && typeof openSheet === 'function');
  await page.evaluate(() => document.fonts.ready);
  await delay(1600);
  let index = 0;
  for (const group of GROUPS) {
    for (const item of group.items) {
      index += 1;
      const file = path.join(OUT_DIR, 'board-' + String(index).padStart(2, '0') + '.png');
      await page.evaluate((config) => {
        Array.prototype.slice.call(document.querySelectorAll('dialog[open]')).forEach(function (dialog) { dialog.close(); });
        if (config.auth) {
          showAuth(config.auth);
        } else if (config.role) {
          enterApp(config.role, config.guest ? { guest: true } : {});
          if (config.screen) showScreen(config.screen);
        }
        if (config.sheet) openSheet(config.sheet);
        if (config.set) Object.keys(config.set).forEach(function (key) { const field = document.getElementById(key); if (field) field.value = config.set[key]; });
      }, item.setup);
      await delay(200);
      await page.screenshot({ path: file });
      item.file = pathToFileURL(file).href;
    }
  }
  const sections = GROUPS.map(function (group) {
    const figures = group.items.map(function (item) {
      return '<figure><img src="' + item.file + '" alt=""><figcaption>' + htmlEscape(item.label) + '</figcaption></figure>';
    }).join('');
    return '<section><h2>' + htmlEscape(group.title) + '</h2><p class="note">' + htmlEscape(group.note) + '</p><div class="grid">' + figures + '</div></section>';
  }).join('');
  const html = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>'
    + 'body{font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;margin:0;padding:20px}'
    + 'h1{font-size:19px;margin:0 0 4px}p.lead{font-size:12px;color:#555;margin:0 0 18px}'
    + 'h2{font-size:14px;margin:22px 0 2px;padding-bottom:5px;border-bottom:1px solid #ddd}'
    + 'p.note{font-size:11px;color:#666;margin:0 0 8px}'
    + '.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}'
    + 'figure{margin:0;border:1px solid #ddd;border-radius:9px;overflow:hidden}'
    + 'figure img{display:block;width:100%;height:auto}'
    + 'figcaption{font-size:10px;padding:5px 7px;background:#f5f5f3;border-top:1px solid #ddd}'
    + 'section{break-inside:avoid}'
    + '</style></head><body>'
    + '<h1>TrustFund - planche de coherence des ecrans</h1>'
    + '<p class="lead">Ecrans regroupes par type et places cote a cote : boutons, marges, panneaux, cartes et tailles de texte doivent se repondre d un ecran a l autre.</p>'
    + sections + '</body></html>';
  await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({ path: OUTPUT_PDF, format: 'A4', landscape: true, printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' } });
  console.log('planche generee : ' + OUTPUT_PDF);
  await browser.close();
})().catch(function (error) { console.error(error); process.exitCode = 1; });