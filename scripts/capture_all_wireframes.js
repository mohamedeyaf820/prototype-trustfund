/**
 * TrustFund — Capture maîtresse des 71 écrans pour les wireframes.
 *
 * Produit deux jeux d'images brutes consommés par les constructeurs PDF :
 *   tmp/pdfs/wireframe_source/screen-NN.png      (écrans 01 → 45)
 *   tmp/pdfs/wireframe_extra_raw/screen-NN.png   (écrans 46 → 71)
 *
 * La numérotation correspond à SCREENS dans scripts/build_wireframe_pdf.py.
 * À relancer après toute modification de index.html / styles.css / app.js.
 *
 * Usage :
 *   node scripts/capture_all_wireframes.js              (tous les écrans)
 *   TRUST_CAPTURE_START=1 TRUST_CAPTURE_END=45 node scripts/capture_all_wireframes.js
 *   TRUST_CAPTURE_ONLY=6,7,8,61,62 node scripts/capture_all_wireframes.js
 */
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'tmp', 'pdfs', 'wireframe_source');
const EXTRA_DIR = path.join(ROOT, 'tmp', 'pdfs', 'wireframe_extra_raw');
const CHROME = 'C:\\Users\\moham\\.cache\\puppeteer\\chrome\\win64-127.0.6533.88\\chrome-win64\\chrome.exe';

/* Les captures sont produites à la largeur d'un grand téléphone pour que le
   rendu reste net une fois réduit dans les planches A2 / A3. */
const CAPTURE_WIDTH = Number(process.env.TRUST_CAPTURE_WIDTH || 1654);
const CAPTURE_HEIGHT = Number(process.env.TRUST_CAPTURE_HEIGHT || 1170);
const CAPTURE_SCALE = Number(process.env.TRUST_CAPTURE_SCALE || 2);

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/* ────────────────────────────────────────────────────────────────────────
   Définition des 71 écrans.
   Chaque entrée décrit l'état à reproduire avant la capture.
   ──────────────────────────────────────────────────────────────────────── */
const SCENARIOS = [
  /* ── Authentification (01 → 08) ── */
  { n: 1,  auth: 'splash' },
  { n: 2,  auth: 'welcome' },
  { n: 3,  auth: 'login' },
  { n: 4,  auth: 'login', variant: 'demoOpen' },
  { n: 5,  auth: 'signup', variant: 'signupStep1' },
  { n: 6,  auth: 'signup', variant: 'signupStep2' },
  { n: 7,  auth: 'signup', variant: 'signupStep2Provider' },
  { n: 8,  auth: 'verify', variant: 'verifyDeferred' },

  /* ── Espace utilisateur (09 → 25) ── */
  { n: 9,  app: 'user', screen: 'home' },
  { n: 10, app: 'user', screen: 'goals' },
  { n: 11, app: 'user', screen: 'goal-detail' },
  { n: 12, app: 'user', screen: 'goals', dialog: 'goalSheet', goalStep: 1 },
  { n: 13, app: 'user', screen: 'goals', dialog: 'goalSheet', goalStep: 2 },
  { n: 14, app: 'user', screen: 'catalog' },
  { n: 15, app: 'user', screen: 'catalog', variant: 'productDetail' },
  { n: 16, app: 'user', screen: 'goal-detail', dialog: 'paymentSheet' },
  { n: 17, app: 'user', screen: 'activity', dialog: 'contributionSheet' },
  { n: 18, app: 'user', screen: 'goal-detail', dialog: 'withdrawSheet' },
  { n: 19, app: 'user', screen: 'activity' },
  { n: 20, app: 'user', screen: 'notifications' },
  { n: 21, app: 'user', screen: 'finalization' },
  { n: 22, app: 'user', screen: 'ai-coach' },
  { n: 23, app: 'user', screen: 'ai-insights' },
  { n: 24, app: 'user', screen: 'profile' },
  { n: 25, app: 'user', screen: 'support' },

  /* ── Espace fournisseur (26 → 35) ── */
  { n: 26, app: 'provider', screen: 'provider' },
  { n: 27, app: 'provider', screen: 'provider-offers' },
  { n: 28, app: 'provider', screen: 'provider-offers', dialog: 'offerSheet', offerStep: 1 },
  { n: 29, app: 'provider', screen: 'provider-offers', dialog: 'offerSheet', offerStep: 3 },
  { n: 30, app: 'provider', screen: 'provider-offers', dialog: 'offerSheet', offerStep: 4 },
  { n: 31, app: 'provider', screen: 'provider-orders' },
  { n: 32, app: 'provider', screen: 'provider-claims' },
  { n: 33, app: 'provider', screen: 'provider-claims', dialog: 'providerReplySheet' },
  { n: 34, app: 'provider', screen: 'provider', dialog: 'providerBusinessSheet' },
  { n: 35, app: 'provider', screen: 'profile' },

  /* ── Espace administrateur (36 → 45) ── */
  { n: 36, app: 'admin', screen: 'admin', web: true },
  { n: 37, app: 'admin', screen: 'admin-ai', web: true },
  { n: 38, app: 'admin', screen: 'admin-users', web: true },
  { n: 39, app: 'admin', screen: 'admin-suppliers', web: true },
  { n: 40, app: 'admin', screen: 'admin-goals', web: true },
  { n: 41, app: 'admin', screen: 'admin-orders', web: true },
  { n: 42, app: 'admin', screen: 'admin-support', web: true },
  { n: 43, app: 'admin', screen: 'admin-reports', web: true },
  { n: 44, app: 'admin', screen: 'admin-settings', web: true },
  { n: 45, app: 'user', screen: 'catalog', variant: 'contactProvider' },

  /* ── Feuilles modales et variantes (46 → 71) ── */
  { n: 46, app: 'user', screen: 'home', dialog: 'kycSheet' },
  { n: 47, app: 'user', screen: 'home', dialog: 'allocateSavingsSheet' },
  { n: 48, app: 'user', screen: 'home', dialog: 'trustSheet' },
  { n: 49, auth: 'welcome', dialog: 'termsSheet' },
  { n: 50, auth: 'welcome', dialog: 'privacySheet' },
  { n: 51, app: 'user', screen: 'support', dialog: 'ticketSheet' },
  { n: 52, auth: 'login', dialog: 'passwordResetSheet', variant: 'resetChannel' },
  { n: 53, app: 'user', screen: 'profile', dialog: 'profileEditSheet' },
  { n: 54, app: 'user', screen: 'goal-detail', dialog: 'goalActionsSheet' },
  { n: 55, app: 'provider', screen: 'provider-orders', dialog: 'orderDetailSheet' },
  { n: 56, app: 'admin', screen: 'admin-support', dialog: 'adminReplySheet', web: true },
  { n: 57, app: 'admin', screen: 'admin', dialog: 'proofDecisionSheet', web: true },
  { n: 58, app: 'admin', screen: 'profile', dialog: 'adminProfileSheet', web: true },
  { n: 59, app: 'admin', screen: 'profile', dialog: 'adminAccessSheet', web: true },
  { n: 60, app: 'user', screen: 'finalization', dialog: 'receptionSheet' },
  { n: 61, auth: 'login', variant: 'accountCreated' },
  { n: 62, auth: 'login', variant: 'credentialsEntered' },
  { n: 63, auth: 'login', variant: 'resetChannel' },
  { n: 64, auth: 'login', variant: 'resetCode' },
  { n: 65, auth: 'login', variant: 'resetPassword' },
  { n: 66, auth: 'login', variant: 'resetComplete' },
  { n: 67, app: 'user', screen: 'catalog', variant: 'contactTrustFund' },
  { n: 68, app: 'admin', screen: 'admin-support', variant: 'adminAvailabilityRequest', web: true },
  { n: 69, app: 'provider', screen: 'notifications', variant: 'providerAvailabilityRequest' },
  { n: 70, app: 'admin', screen: 'admin-support', variant: 'adminAvailabilityReply', web: true },
  { n: 71, app: 'user', screen: 'notifications', variant: 'userAvailabilityResult' },
];

/* ────────────────────────────────────────────────────────────────────────
   Préparation d'un écran avant capture.
   ──────────────────────────────────────────────────────────────────────── */
async function prepare(page, s) {
  await page.evaluate((item) => {
    document.querySelectorAll('dialog[open]').forEach((d) => d.close());

    /* Mode authentification */
    if (item.auth) {
      showAuth(item.auth);
      if (item.variant === 'demoOpen') {
        const d = document.getElementById('demoAccounts');
        if (d) { d.classList.add('open'); d.hidden = false; }
        document.getElementById('demoToggle')?.setAttribute('aria-expanded', 'true');
      }
      if (item.variant === 'signupStep1') {
        state.signupRole = 'user';
        setSignupRole('user');
        setSignupStep(1);
      }
      if (item.variant === 'signupStep2') {
        setSignupStep(2);
      }
      if (item.variant === 'signupStep2Provider') {
        setSignupRole('provider');
        setSignupStep(2);
      }
      if (item.variant === 'verifyDeferred') {
        const el = document.getElementById('verifyPhone');
        if (el) el.textContent = '+221 77 000 00 01';
        state.verifyMode = 'financial';
      }
    }

    /* Mode application */
    if (item.app) {
      enterApp(item.app);
      showScreen(item.screen);
    }

    /* Feuille modale */
    if (item.dialog) {
      openSheet(item.dialog);
      const d = document.getElementById(item.dialog);
      if (d) d.scrollTop = 0;
    }

    if (item.goalStep) setGoalStep(item.goalStep);
    if (item.offerStep && typeof setOfferStep === 'function') setOfferStep(item.offerStep);

    /* Récupération de mot de passe */
    if (item.variant && item.variant.startsWith('reset')) {
      if (item.variant !== 'resetComplete') {
        openPasswordResetFlow();
        const c = document.querySelector('[data-phone-country="resetPhone"]');
        if (c) c.value = 'SN';
        const p = document.getElementById('resetPhone');
        if (p) { p.value = '77 000 00 01'; validatePhoneInput(p, false); }
      }
      if (item.variant === 'resetCode') {
        const d = document.getElementById('resetDestination');
        if (d) d.textContent = '+221 77 ••• •• 01';
        setPasswordResetStep(2);
      }
      if (item.variant === 'resetPassword') setPasswordResetStep(3);
      if (item.variant === 'resetComplete') {
        const c = document.querySelector('[data-phone-country="loginPhone"]');
        if (c) c.value = 'SN';
        const p = document.getElementById('loginPhone');
        if (p) { p.value = '77 000 00 01'; validatePhoneInput(p, false); }
        setLoginFeedback('Mot de passe modifié. Connectez-vous avec votre nouveau mot de passe.', 'success');
      }
    }

    /* Connexion : compte créé / identifiants saisis */
    if (item.variant === 'accountCreated' || item.variant === 'credentialsEntered') {
      const c = document.querySelector('[data-phone-country="loginPhone"]');
      if (c) c.value = 'SN';
      const p = document.getElementById('loginPhone');
      if (p) { p.value = '771234567'; validatePhoneInput(p); }
      const pw = document.getElementById('loginPassword');
      if (pw) pw.value = item.variant === 'credentialsEntered' ? 'TrustNouveau#26' : '';
      setLoginFeedback(
        'Compte créé. Votre numéro sera confirmé lors de votre première opération financière.',
        'success'
      );
      document.getElementById('demoToggle')?.setAttribute('aria-expanded', 'false');
      document.getElementById('demoAccounts')?.classList.remove('open');
    }

    /* Fiche produit */
    if (item.variant === 'productDetail') openSheet('productDetailSheet');

    /* Contacter un fournisseur */
    if (item.variant === 'contactProvider') {
      const v = document.getElementById('contactVendorAvatar'); if (v) v.textContent = 'T';
      const nn = document.getElementById('contactVendorName'); if (nn) nn.textContent = 'Tekki Digital · Dakar';
      const r = document.getElementById('contactProductRef'); if (r) r.value = 'Ordinateur portable 14"';
      const m = document.getElementById('contactMessage'); if (m) m.value = 'Bonjour, je souhaite vérifier la disponibilité.';
      document.getElementById('contactSuccessBanner')?.classList.add('hidden');
      openSheet('contactProviderSheet');
    }

    /* Contacter TrustFund */
    if (item.variant === 'contactTrustFund') {
      const v = document.getElementById('contactVendorAvatar'); if (v) v.textContent = 'TF';
      const nn = document.getElementById('contactVendorName'); if (nn) nn.textContent = 'Équipe TrustFund';
      const r = document.getElementById('contactProductRef'); if (r) r.value = 'Lenovo IdeaPad';
      const m = document.getElementById('contactMessage');
      if (m) m.value = 'Je souhaite savoir si ce produit est toujours disponible. Merci de vérifier auprès du partenaire et de me répondre dans l’application.';
      openSheet('contactProviderSheet');
    }

    /* Demandes de disponibilité */
    if (['adminAvailabilityRequest', 'providerAvailabilityRequest', 'adminAvailabilityReply', 'userAvailabilityResult'].includes(item.variant)) {
      state.availabilityRequest = {
        product: 'Lenovo IdeaPad',
        userName: 'Aïssatou Ndiaye',
        message: 'Je souhaite savoir si ce produit est disponible.',
        status: 'admin-review'
      };
      const p = document.getElementById('availabilityAdminProduct'); if (p) p.textContent = 'Lenovo IdeaPad';
      const mm = document.getElementById('availabilityAdminMessage'); if (mm) mm.textContent = 'Aïssatou Ndiaye souhaite connaître la disponibilité de ce produit.';
      document.getElementById('availabilityAdminCard')?.classList.add('active');
    }
    if (item.variant === 'providerAvailabilityRequest') {
      state.availabilityRequest.status = 'supplier-review';
      const t = document.getElementById('providerContactNotifText');
      if (t) t.textContent = 'TrustFund vous demande de confirmer la disponibilité de « Lenovo IdeaPad ».';
      document.getElementById('providerContactNotif')?.classList.add('active', 'unread');
    }
    if (item.variant === 'adminAvailabilityReply') {
      state.availabilityRequest.status = 'supplier-confirmed';
      const s = document.getElementById('availabilityAdminStatus');
      if (s) s.textContent = 'Disponibilité confirmée · réponse utilisateur requise';
      const m = document.getElementById('availabilityReplyMessage');
      if (m) m.value = 'Le produit « Lenovo IdeaPad » est disponible. Vous pouvez l’ajouter à votre objectif d’épargne.';
      openSheet('availabilityReplySheet');
    }
    if (item.variant === 'userAvailabilityResult') {
      state.availabilityRequest.status = 'user-informed';
      const st = document.querySelector('#userAvailabilityNotif strong');
      if (st) st.textContent = 'Produit disponible';
      const pp = document.querySelector('#userAvailabilityNotif p');
      if (pp) pp.textContent = 'Le produit « Lenovo IdeaPad » est disponible. Vous pouvez l’ajouter à votre objectif d’épargne.';
      document.getElementById('userAvailabilityNotif')?.classList.remove('hidden');
    }

    const main = document.getElementById('appMain');
    if (main) main.scrollTop = 0;
  }, s);
  await delay(200);
}

/* ────────────────────────────────────────────────────────────────────────
   Exécution
   ──────────────────────────────────────────────────────────────────────── */
(async () => {
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.mkdirSync(EXTRA_DIR, { recursive: true });

  const only = process.env.TRUST_CAPTURE_ONLY
    ? new Set(process.env.TRUST_CAPTURE_ONLY.split(',').map((x) => Number(x.trim())))
    : null;
  const first = Number(process.env.TRUST_CAPTURE_START || 1);
  const last = Number(process.env.TRUST_CAPTURE_END || 71);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT, deviceScaleFactor: CAPTURE_SCALE });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => typeof openSheet === 'function' && typeof enterApp === 'function');

  await page.addStyleTag({
    content: `
      *, *::before, *::after { animation: none !important; transition: none !important; }
      body { background: #f4f3ef !important; }
      .prototype-stage { min-height: 100vh !important; padding: 24px !important; }
      .phone-shell { width: 430px !important; height: 920px !important; box-shadow: 0 28px 74px rgba(0,0,0,.28) !important; }
      .phone-shell.role-admin { width: 1180px !important; border-radius: 22px !important; }
      dialog::backdrop { background: rgba(17, 19, 18, .46) !important; backdrop-filter: blur(2px); }
    `,
  });
  await page.evaluate(() => document.fonts.ready);
  await delay(1900);

  let count = 0;
  for (const s of SCENARIOS) {
    if (only) { if (!only.has(s.n)) continue; }
    else if (s.n < first || s.n > last) continue;

    await prepare(page, s);
    const dir = s.n <= 45 ? SOURCE_DIR : EXTRA_DIR;
    const filename = path.join(dir, `screen-${String(s.n).padStart(2, '0')}.png`);
    await page.screenshot({ path: filename, type: 'png', captureBeyondViewport: false });
    count += 1;
    process.stdout.write(`  ${String(s.n).padStart(2, '0')}  ${path.basename(filename)}\n`);
  }

  console.log(`\n${count} capture(s) écrite(s).`);
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
