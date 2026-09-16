const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

const ROOT = REPO_ROOT;
const OUT_DIR = path.join(ROOT, 'tmp', 'pdfs', 'wireframe_web_raw');
const CHROME = resolveChromePath();

const providerScenarios = [
  { number: 1, role: 'provider', screen: 'provider' },
  { number: 2, role: 'provider', screen: 'provider-offers' },
  { number: 3, role: 'provider', screen: 'provider-offers', dialog: 'offerSheet', offerStep: 1 },
  { number: 4, role: 'provider', screen: 'provider-offers', dialog: 'offerSheet', offerStep: 2 },
  { number: 5, role: 'provider', screen: 'provider-offers', dialog: 'offerSheet', offerStep: 3 },
  { number: 6, role: 'provider', screen: 'provider-offers', dialog: 'offerSheet', offerStep: 4 },
  { number: 7, role: 'provider', screen: 'provider-orders' },
  { number: 8, role: 'provider', screen: 'provider-orders', dialog: 'orderDetailSheet' },
  { number: 9, role: 'provider', screen: 'provider-claims' },
  { number: 10, role: 'provider', screen: 'provider-claims', dialog: 'providerReplySheet' },
  { number: 11, role: 'provider', screen: 'profile', dialog: 'providerBusinessSheet' },
  { number: 12, role: 'provider', screen: 'notifications', variant: 'providerAvailability' },
  { number: 13, role: 'provider', screen: 'profile' },
  { number: 14, role: 'provider', screen: 'profile', dialog: 'securitySheet' },
];

const adminScenarios = [
  { number: 1, role: 'admin', screen: 'admin' },
  { number: 2, role: 'admin', screen: 'admin-ai' },
  { number: 3, role: 'admin', screen: 'admin-users' },
  { number: 4, role: 'admin', screen: 'admin-users', dialog: 'accountActionSheet', variant: 'accountAction' },
  { number: 5, role: 'admin', screen: 'admin-suppliers' },
  { number: 6, role: 'admin', screen: 'admin-suppliers', dialog: 'supplierDecisionSheet', variant: 'supplierDecision' },
  { number: 7, role: 'admin', screen: 'admin-goals' },
  { number: 8, role: 'admin', screen: 'admin-orders' },
  { number: 9, role: 'admin', screen: 'admin-support' },
  { number: 10, role: 'admin', screen: 'admin-support', variant: 'adminAvailability' },
  { number: 11, role: 'admin', screen: 'admin-support', dialog: 'availabilityReplySheet', variant: 'availabilityReply' },
  { number: 12, role: 'admin', screen: 'admin-support', dialog: 'adminTicketSheet' },
  { number: 13, role: 'admin', screen: 'admin-reports' },
  { number: 14, role: 'admin', screen: 'admin-settings' },
  { number: 15, role: 'admin', screen: 'admin-audit' },
  { number: 16, role: 'admin', screen: 'profile' },
  { number: 17, role: 'admin', screen: 'profile', dialog: 'adminProfileSheet' },
  { number: 18, role: 'admin', screen: 'profile', dialog: 'adminAccessSheet' },
  { number: 19, role: 'admin', screen: 'admin-ai', dialog: 'proofDecisionSheet', variant: 'proofDecision' },
  { number: 20, role: 'admin', screen: 'notifications' },
];

async function prepareScenario(page, scenario) {
  await page.evaluate((item) => {
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    enterApp(item.role);
    showScreen(item.screen);

    if (item.offerStep) {
      document.getElementById('offerName').value = 'Réfrigérateur solaire 200 L';
      document.getElementById('offerDescription').value = 'Équipement solaire robuste, adapté aux commerces et aux zones à alimentation irrégulière.';
      document.getElementById('offerPrice').value = '580000';
      document.getElementById('offerStock').value = '4';
      document.getElementById('offerWarranty').value = '12 mois';
      document.getElementById('offerConditions').value = 'Livraison sous 48 heures à Dakar et retrait possible au dépôt.';
      state.offerImages = ['photo-face.jpg', 'photo-cote.jpg', 'photo-details.jpg'];
      setOfferStep(item.offerStep);
      document.getElementById('offerReviewName').textContent = 'Réfrigérateur solaire 200 L';
      document.getElementById('offerReviewMeta').textContent = '580 000 FCFA fournisseur · 585 800 FCFA utilisateur · 4 en stock · 3 photos';
    }

    if (item.variant === 'providerAvailability') {
      state.availabilityRequest = { product: 'Lenovo IdeaPad', status: 'supplier-review' };
      document.getElementById('providerContactNotifText').textContent = 'TrustFund vous demande de confirmer la disponibilité de « Lenovo IdeaPad ».';
      document.getElementById('providerContactNotif').classList.add('active', 'unread');
    }

    if (item.variant === 'accountAction') {
      document.getElementById('accountActionName').textContent = 'Aïssatou Ndiaye';
      document.getElementById('accountActionDetails').value = 'Une vérification complémentaire est nécessaire sur la pièce d’identité avant toute nouvelle opération.';
    }

    if (item.variant === 'supplierDecision') {
      const request = document.querySelector('input[name="supplierDecision"][value="request"]');
      request.checked = true;
      document.getElementById('supplierDecisionDetails').classList.remove('hidden');
      document.querySelector('#supplierDecisionDetails input[value="NINEA"]').checked = true;
      document.getElementById('supplierDecisionMessage').value = 'Le numéro NINEA fourni est illisible. Merci de remplacer ce document par une copie complète et nette.';
      document.getElementById('supplierDecisionSubmit').textContent = 'Envoyer la demande';
    }

    if (['adminAvailability', 'availabilityReply'].includes(item.variant)) {
      state.availabilityRequest = {
        product: 'Lenovo IdeaPad',
        userName: 'Aïssatou Ndiaye',
        status: item.variant === 'availabilityReply' ? 'supplier-confirmed' : 'admin-review'
      };
      document.getElementById('availabilityAdminProduct').textContent = 'Lenovo IdeaPad';
      document.getElementById('availabilityAdminMessage').textContent = 'Aïssatou Ndiaye souhaite connaître la disponibilité de ce produit.';
      document.getElementById('availabilityAdminCard').classList.add('active');
      document.getElementById('availabilityAdminStatus').textContent = item.variant === 'availabilityReply'
        ? 'Disponibilité confirmée · réponse utilisateur requise'
        : 'À transmettre au fournisseur';
      if (item.variant === 'availabilityReply') {
        document.getElementById('availabilityReplyMessage').value = 'Le produit « Lenovo IdeaPad » est disponible. Vous pouvez l’ajouter à votre objectif d’épargne.';
      }
    }

    if (item.variant === 'proofDecision') {
      document.getElementById('proofDecisionMessage').value = 'La preuve est illisible. Merci de transmettre une capture complète avec le montant et la référence visibles.';
    }

    if (item.dialog) openSheet(item.dialog);
    const main = document.getElementById('appMain');
    if (main) main.scrollTop = 0;
    const dialog = item.dialog ? document.getElementById(item.dialog) : null;
    if (dialog) dialog.scrollTop = 0;
  }, scenario);
  await new Promise(resolve => setTimeout(resolve, 220));
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 960, deviceScaleFactor: 1.25 });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => typeof enterApp === 'function' && typeof setOfferStep === 'function');
  await page.addStyleTag({ content: `
    *, *::before, *::after { animation:none !important; transition:none !important; }
    html { filter:grayscale(1) !important; }
    body { background:#e8e8e8 !important; }
    .page-atmosphere, .stage-caption { display:none !important; }
    .prototype-stage { min-height:960px !important; padding:20px !important; }
    .phone-shell.role-provider, .phone-shell.role-admin {
      width:1420px !important;
      height:900px !important;
      border-radius:18px !important;
      box-shadow:0 26px 70px rgba(0,0,0,.22) !important;
    }
    .sheet { bottom:40px !important; max-height:850px !important; }
    dialog::backdrop { background:rgba(0,0,0,.52) !important; backdrop-filter:blur(2px); }
  ` });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(resolve => setTimeout(resolve, 1900));

  for (const [prefix, scenarios] of [['provider', providerScenarios], ['admin', adminScenarios]]) {
    for (const scenario of scenarios) {
      await prepareScenario(page, scenario);
      const shell = await page.$('#phoneShell');
      const filename = path.join(OUT_DIR, `${prefix}-web-${String(scenario.number).padStart(2, '0')}.png`);
      await shell.screenshot({ path: filename, type: 'png' });
      console.log(filename);
    }
  }

  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
