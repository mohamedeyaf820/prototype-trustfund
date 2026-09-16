const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const state = {
  screen: 'home',
  role: 'user',
  loginRole: 'user',
  signupRole: 'user',
  signupStep: 1,
  isGuest: false,
  kycVerified: false,
  pendingFinancialAction: null,
  verifyMode: 'signup',
  verifyRole: 'user',
  goalStep: 1,
  goalCount: 3,
  paymentMethod: 'Wave',
  selectedProduct: {
    name: 'Lenovo IdeaPad',
    amount: 425000,
    vendor: 'Tekki Digital · Dakar',
    image: 'assets/product-laptop.webp',
    description: 'Ordinateur 15 pouces, 8 Go RAM et 512 Go SSD, adapté aux études et au travail.',
    specs: ['Écran 15 pouces', '8 Go de mémoire', 'SSD 512 Go', 'Garantie 12 mois']
  },
  changeProductMode: false,
  validated: 372000,
  formationValidated: 75000,
  freeSavings: 125000,
  totalSaved: 757000,
  target: 600000,
  pending: 3,
  serviceFeeRate: 1,
  offerStep: 1,
  offerImage: '',
  offerImages: [],
  pendingProofCard: null,
  pendingSupplierCard: null,
  pendingAccountCard: null,
  pendingAccount: null,
  createdAccount: null,
  passwordResetStep: 1,
  passwordResetChannel: 'sms',
  passwordResetAccount: null,
  availabilityRequest: null,
  usedReferences: new Set(['OM-48291', 'WV-90114'])
};

const roleMeta = {
  user: { screen: 'home', initials: 'AN', label: 'Utilisateur', name: 'Aïssatou<br>Ndiaye.', completion: 85 },
  admin: { screen: 'admin', initials: 'MB', label: 'Administrateur', name: 'Marième<br>Ba.', completion: 100 },
  provider: { screen: 'provider', initials: 'BE', label: 'Fournisseur', name: 'Babacar<br>Entreprise.', completion: 92 }
};

const demoAccounts = {
  user: { phone: '770000001', password: 'TrustUser#26', name: 'Aïssatou Ndiaye', profile: { firstName: 'Aïssatou', lastName: 'Ndiaye' } },
  provider: { phone: '770000002', password: 'TrustPro#26', name: 'Babacar Entreprise' },
  admin: { phone: '770000003', password: 'TrustAdmin#26', name: 'Marième Ba' }
};

const phoneCountries = {
  SN: { name: 'Sénégal', code: '221', length: 9, groups: [2, 3, 2, 2], example: '77 123 45 67', pattern: /^(70|75|76|77|78)\d{7}$/ },
  GM: { name: 'Gambie', code: '220', length: 7, groups: [3, 4], example: '301 2345' },
  ML: { name: 'Mali', code: '223', length: 8, groups: [2, 2, 2, 2], example: '76 12 34 56' },
  GN: { name: 'Guinée', code: '224', length: 9, groups: [3, 3, 3], example: '621 234 567' },
  CI: { name: 'Côte d\'Ivoire', code: '225', length: 10, groups: [2, 2, 2, 2, 2], example: '07 12 34 56 78' },
  FR: { name: 'France', code: '33', length: 9, groups: [1, 2, 2, 2, 2], example: '6 12 34 56 78' }
};

function digitsOnly(value, limit = Infinity) {
  return String(value || '').replace(/\D/g, '').slice(0, limit);
}

function groupDigits(value, groups) {
  const digits = digitsOnly(value);
  const parts = [];
  let cursor = 0;
  groups.forEach(size => {
    if (cursor < digits.length) parts.push(digits.slice(cursor, cursor + size));
    cursor += size;
  });
  return parts.join(' ');
}

function phoneControl(input) {
  const countrySelect = document.querySelector(`[data-phone-country="${input.id}"]`);
  const country = phoneCountries[countrySelect?.value || 'SN'];
  return { countrySelect, country };
}

function validatePhoneInput(input, showState = true) {
  const { country } = phoneControl(input);
  const digits = digitsOnly(input.value, country.length);
  input.value = groupDigits(digits, country.groups);
  input.maxLength = country.length + country.groups.length - 1;
  input.placeholder = country.example;
  let message = '';
  if (digits && digits.length !== country.length) message = `${country.length} chiffres sont attendus.`;
  if (digits.length === country.length && /^(\d)\1+$/.test(digits)) message = 'Ce numéro ne semble pas valide.';
  if (!message && digits.length === country.length && country.pattern && !country.pattern.test(digits)) message = 'Utilisez un préfixe mobile sénégalais valide (70, 75, 76, 77 ou 78).';
  input.setCustomValidity(message);
  const help = input.getAttribute('aria-describedby') ? document.getElementById(input.getAttribute('aria-describedby')) : null;
  if (help) {
    help.textContent = message || (input.id === 'signupPhone' ? `${country.name} · ex. ${country.example}` : `Format : ${country.example}`);
    help.classList.toggle('invalid', Boolean(message) && showState);
    help.classList.toggle('valid', !message && digits.length === country.length && showState);
  }
  input.closest('.phone-field')?.classList.toggle('field-invalid', Boolean(message) && showState);
  input.closest('.phone-field')?.classList.toggle('field-valid', !message && digits.length === country.length && showState);
  return !message && digits.length === country.length;
}

function initializePhoneFields() {
  $$('[data-phone-input]').forEach(input => {
    const { countrySelect } = phoneControl(input);
    const update = () => validatePhoneInput(input);
    input.addEventListener('input', update);
    input.addEventListener('blur', update);
    countrySelect?.addEventListener('change', () => {
      input.value = '';
      validatePhoneInput(input, false);
      input.focus();
    });
    validatePhoneInput(input, false);
  });
}

function fullPhone(input) {
  const { country } = phoneControl(input);
  return `+${country.code} ${groupDigits(digitsOnly(input.value), country.groups)}`;
}

function passwordChecks(value) {
  return {
    length: value.length >= 12,
    case: /[a-z]/.test(value) && /[A-Z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9\s]/.test(value),
    space: !/\s/.test(value)
  };
}

function validateSignupPassword() {
  const field = $('#signupPassword');
  const confirmation = $('#signupPasswordConfirm');
  const checks = passwordChecks(field.value);
  const common = /^(password|motdepasse|azerty|qwerty|123456)/i.test(field.value);
  const strong = Object.values(checks).every(Boolean) && !common;
  field.setCustomValidity(field.value && !strong ? 'Utilisez 12 caractères avec majuscule, minuscule, chiffre et caractère spécial, sans espace.' : '');
  $$('[data-password-rule]').forEach(rule => rule.classList.toggle('met', checks[rule.dataset.passwordRule]));
  const score = Object.values(checks).filter(Boolean).length;
  $$('.strength-meter i').forEach((bar, index) => bar.classList.toggle('on', index < Math.min(4, Math.floor(score * 4 / 5))));
  $('#strengthLabel').textContent = !field.value ? 'Sécurité du mot de passe' : strong ? 'Mot de passe robuste' : score >= 4 ? 'Encore un effort' : score >= 3 ? 'Moyen' : 'Faible';
  const match = !confirmation.value || confirmation.value === field.value;
  confirmation.setCustomValidity(match ? '' : 'Les deux mots de passe ne correspondent pas.');
  const help = $('#passwordMatchHelp');
  help.textContent = match ? (confirmation.value ? 'Les mots de passe correspondent.' : 'Les deux mots de passe doivent être identiques.') : 'Les deux mots de passe ne correspondent pas.';
  help.classList.toggle('valid', Boolean(confirmation.value) && match);
  help.classList.toggle('invalid', !match);
  return strong && match;
}

initializePhoneFields();

function validateIdentityNumber() {
  const type = $('#kycDocumentType').value;
  const input = $('#kycDocumentNumber');
  const help = $('#kycNumberHelp');
  let valid = false;
  if (type === 'cni') {
    input.value = digitsOnly(input.value, 13);
    input.inputMode = 'numeric';
    input.maxLength = 13;
    input.placeholder = '13 chiffres';
    valid = /^\d{13}$/.test(input.value) && !/^(\d)\1+$/.test(input.value);
    help.textContent = input.value && !valid ? 'La CNI sénégalaise doit contenir exactement 13 chiffres.' : 'CNI : saisissez les 13 chiffres, sans espace.';
  } else {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    input.inputMode = 'text';
    input.maxLength = 12;
    input.placeholder = '6 à 12 lettres ou chiffres';
    valid = /^[A-Z0-9]{6,12}$/.test(input.value) && !/^(.)\1+$/.test(input.value);
    help.textContent = input.value && !valid ? 'Le passeport doit contenir 6 à 12 lettres ou chiffres.' : 'Passeport : 6 à 12 lettres ou chiffres, sans espace.';
  }
  const shouldShow = Boolean(input.value);
  input.setCustomValidity(!input.value ? '' : valid ? '' : 'Numéro de pièce incorrect.');
  help.classList.toggle('valid', shouldShow && valid);
  help.classList.toggle('invalid', shouldShow && !valid);
  return valid;
}

function validateDocumentFile(input) {
  const file = input.files?.[0];
  if (!file) {
    input.setCustomValidity(input.required ? 'Ajoutez ce document.' : '');
    return false;
  }
  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  let message = '';
  if (!allowed.includes(file.type)) message = 'Format refusé. Utilisez JPG, PNG ou PDF.';
  if (file.size > 5 * 1024 * 1024) message = 'Le fichier dépasse la limite de 5 Mo.';
  input.setCustomValidity(message);
  return !message;
}

$('#kycDocumentType').addEventListener('change', () => {
  $('#kycDocumentNumber').value = '';
  validateIdentityNumber();
  $('#kycDocumentNumber').focus();
});
$('#kycDocumentNumber').addEventListener('input', validateIdentityNumber);
$('#kycDocumentNumber').addEventListener('blur', validateIdentityNumber);

$('#providerNinea').addEventListener('input', event => {
  const input = event.target;
  input.value = digitsOnly(input.value, 9);
  const valid = /^\d{9}$/.test(input.value) && !/^(\d)\1+$/.test(input.value);
  input.setCustomValidity(!input.value || valid ? '' : 'Le NINEA doit contenir exactement 9 chiffres.');
  const help = $('#nineaHelp');
  help.textContent = !input.value || valid ? '9 chiffres, sans espace.' : 'Le NINEA doit contenir exactement 9 chiffres.';
  help.classList.toggle('valid', valid);
  help.classList.toggle('invalid', Boolean(input.value) && !valid);
});

$('#providerRccm').addEventListener('input', event => {
  const input = event.target;
  input.value = input.value.toUpperCase().replace(/[^A-Z0-9/-]/g, '').slice(0, 30);
  const valid = /^[A-Z0-9][A-Z0-9/-]{4,29}$/.test(input.value);
  input.setCustomValidity(!input.value || valid ? '' : 'Saisissez un numéro RCCM de 5 à 30 caractères.');
  $('#rccmHelp').classList.toggle('valid', valid);
  $('#rccmHelp').classList.toggle('invalid', Boolean(input.value) && !valid);
});

function updateProviderDocumentProgress() {
  const inputs = $$('[data-provider-document]');
  const ready = inputs.filter(input => input.files.length && !input.validationMessage).length;
  $('#providerDocumentProgress').textContent = `${ready} sur ${inputs.length} ajoutée${ready > 1 ? 's' : ''}`;
}

$$('[data-provider-document]').forEach(input => input.addEventListener('change', event => {
  const fileInput = event.target;
  const card = fileInput.closest('.provider-document');
  const file = fileInput.files?.[0];
  const valid = validateDocumentFile(fileInput);
  card.classList.toggle('file-ready', valid);
  card.classList.toggle('file-error', Boolean(file) && !valid);
  if (file) {
    $('strong', card).textContent = valid ? file.name : 'Fichier non accepté';
    $('small', card).textContent = valid ? 'Pièce ajoutée · cliquer pour remplacer' : fileInput.validationMessage;
  }
  updateProviderDocumentProgress();
}));

function money(value) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value)).replace(/\u202f/g, ' ');
}

function platformFee(basePrice) {
  return Math.round((Number(basePrice) || 0) * state.serviceFeeRate / 100);
}

function customerPrice(basePrice) {
  return (Number(basePrice) || 0) + platformFee(basePrice);
}

function updateCatalogPrices() {
  $$('[data-customer-price]').forEach(price => {
    const base = Number(price.dataset.customerPrice) || 0;
    price.textContent = `${money(customerPrice(base))} FCFA`;
    const note = price.parentElement?.querySelector('small');
    if (note) note.textContent = `${money(base)} + ${state.serviceFeeRate}% TrustFund`;
  });
  const reportRate = $('#feeRateReport');
  if (reportRate) reportRate.textContent = `${state.serviceFeeRate}%`;
}

function showAuth(name) {
  state.isGuest = false;
  $('#appSession').classList.add('hidden');
  $('#authFlow').classList.remove('hidden');
  $('#phoneShell').classList.remove('role-user', 'role-provider', 'role-admin');
  $$('.auth-screen').forEach(screen => screen.classList.toggle('active', screen.id === `auth-${name}`));
  const active = $(`#auth-${name}`);
  if (active) active.scrollTop = 0;
}

function enterApp(role, profile = {}) {
  state.isGuest = Boolean(profile.guest && role === 'user');
  $('#toastZone').innerHTML = '';
  $('#authFlow').classList.add('hidden');
  $('#appSession').classList.remove('hidden');
  if (profile.firstName && role === 'user') {
    roleMeta.user.name = `${profile.firstName}<br>${profile.lastName || ''}.`;
    roleMeta.user.initials = `${profile.firstName[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase();
    const homeName = $('.home-greeting h1');
    if (homeName) homeName.textContent = profile.firstName;
    $('.profile-hero h1').innerHTML = `${profile.firstName}<br>${profile.lastName || ''}.`;
    $('.profile-avatar').textContent = roleMeta.user.initials;
  }
  setRole(role, true);
}

function showScreen(name) {
  const target = $(`#screen-${name}`);
  if (!target) return;
  state.screen = name;
  $$('.screen').forEach(screen => screen.classList.toggle('active', screen === target));
  $$('.bottom-nav button[data-view-target]').forEach(button => button.classList.toggle('active', button.dataset.viewTarget === name));
  const fab = $('#trustCoachFab');
  if (fab) fab.classList.toggle('hidden', name === 'ai-coach');
  const headerCoach = $('.header-coach-link');
  if (headerCoach) headerCoach.classList.toggle('hidden', name === 'ai-coach');
  $('#appMain').scrollTo({ top: 0, behavior: 'smooth' });
}

function openSheet(id) {
  const sheet = document.getElementById(id);
  if (sheet && !sheet.open) sheet.showModal();
}

function closeSheet(id) {
  const sheet = document.getElementById(id);
  if (sheet?.open) sheet.close();
}

function toast(title, message, kind = 'success') {
  const item = document.createElement('div');
  item.className = 'toast';
  item.innerHTML = '<span></span><div><strong></strong><small></small></div><button aria-label="Fermer">×</button>';
  $('span', item).textContent = kind === 'error' ? '!' : '✓';
  $('strong', item).textContent = title;
  $('small', item).textContent = message;
  $('#toastZone').appendChild(item);
  const remove = () => {
    if (!item.isConnected) return;
    item.classList.add('leaving');
    setTimeout(() => item.remove(), 260);
  };
  $('button', item).addEventListener('click', remove);
  setTimeout(remove, 4300);
}

function setRole(role, silent = false) {
  state.role = role;
  const meta = roleMeta[role];
  $('#phoneShell').classList.remove('role-user', 'role-provider', 'role-admin');
  $('#phoneShell').classList.add(`role-${role}`);
  $('#phoneShell').classList.toggle('guest-mode', state.isGuest && role === 'user');
  $('#avatarInitials').textContent = meta.initials;
  const homeAvatar = $('#homeAvatarInitials');
  if (homeAvatar) homeAvatar.textContent = meta.initials;
  $('.brand-button').dataset.viewTarget = state.isGuest ? 'catalog' : meta.screen;
  $$('.role-card').forEach(card => card.classList.toggle('active', card.dataset.role === role));
  $$('.nav-set').forEach(nav => nav.classList.toggle('active', nav.dataset.navRole === role));
  $('#profileAvatar').textContent = meta.initials;
  $('#profileRole').textContent = `Compte ${meta.label.toLowerCase()}`;
  $('#profileName').innerHTML = meta.name;
  $('#profileCompletion').textContent = `Profil complété à ${meta.completion}%`;
  $('#profileProgress').style.width = `${meta.completion}%`;
  $('.user-profile-only').classList.toggle('hidden', role !== 'user');
  $('.admin-profile-only').classList.toggle('hidden', role !== 'admin');
  $('.provider-profile-only').classList.toggle('hidden', role !== 'provider');
  showScreen(state.isGuest ? 'catalog' : meta.screen);
  if (!silent) toast(`Espace ${meta.label}`, 'Le prototype affiche maintenant les fonctions de ce rôle.');
}

function setSignupRole(role) {
  state.signupRole = role;
  $$('.signup-role').forEach(card => card.classList.toggle('active', card.dataset.signupRole === role));
  $('#providerFields').classList.toggle('visible', role === 'provider');
  $('#adminFields').classList.toggle('visible', role === 'admin');
  $('#adminInvite').required = role === 'admin';
}

function setSignupStep(step) {
  state.signupStep = step;
  $$('.signup-step').forEach(panel => panel.classList.toggle('active', Number(panel.dataset.signupStep) === step));
  $$('.signup-progress i').forEach((bar, index) => bar.classList.toggle('active', index < step));
  $('#signupNext').classList.toggle('hidden', step >= 3);
  $('#signupSubmit').classList.toggle('hidden', step < 3);
  const subtitles = {
    1: 'Commencez par choisir le type de compte.',
    2: 'Seulement les informations nécessaires pour ouvrir votre accès.',
    3: 'Dernière étape : sécurisez votre accès.'
  };
  $('#signupSubtitle').textContent = subtitles[step];
  $('#auth-signup').scrollTo({ top: 0, behavior: 'smooth' });
}

function visibleStepIsValid(step) {
  const panel = $(`.signup-step[data-signup-step="${step}"]`);
  const fields = $$('input[required], select[required]', panel).filter(field => field.closest('.conditional-fields')?.classList.contains('visible') !== false || !field.closest('.conditional-fields'));
  const invalid = fields.find(field => !field.checkValidity());
  if (invalid) {
    invalid.reportValidity();
    invalid.focus();
    return false;
  }
  return true;
}

function updateProgress() {
  const percent = Math.min(100, Math.round((state.validated / state.target) * 100));
  const remaining = Math.max(0, state.target - state.validated);
  ['homePercent', 'detailPercent'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = percent; });
  $('#homeValidated').textContent = money(state.validated);
  $('#homeProgressBar').style.width = `${percent}%`;
  $$('.progress-orbit').forEach(ring => ring.style.setProperty('--value', percent));
  $('#goalsValidated').textContent = money(state.validated);
  $('#goalsRemaining').textContent = money(remaining);
  $('#detailValidated').textContent = `${money(state.validated)} FCFA`;
  $('#detailRemaining').textContent = `${money(remaining)} FCFA à cotiser`;
  $('.mobile-goal-card.featured .goal-percent').textContent = `${percent}%`;
  $('.mobile-goal-card.featured .goal-track i').style.width = `${percent}%`;
}

function updateFreeSavingsUI() {
  const formatted = `${money(state.freeSavings)} FCFA`;
  $('#freeSavingsBalance').innerHTML = `${money(state.freeSavings)} <small>FCFA</small>`;
  $('#allocateAvailableBalance').textContent = formatted;
  $('#allocateAmount').max = state.freeSavings;
  if (Number($('#allocateAmount').value) > state.freeSavings) {
    $('#allocateAmount').value = Math.max(0, state.freeSavings);
  }
}

function updateFormationProgress() {
  const target = 250000;
  const percent = Math.min(100, Math.round((state.formationValidated / target) * 100));
  const remaining = Math.max(0, target - state.formationValidated);
  $('#formationHomeProgress').textContent = `${money(state.formationValidated)} sur ${money(target)} FCFA`;
  $('#formationHomePercent').textContent = `${percent}%`;
  $('#formationGoalPercent').textContent = `${percent}%`;
  $('#formationGoalBar').style.width = `${percent}%`;
  $('#formationGoalValidated').textContent = money(state.formationValidated);
  $('#formationGoalRemaining').textContent = money(remaining);
}

function addAllocationActivity(goal, amount) {
  const reference = `TF-ALLOC-${String(Date.now()).slice(-4)}`;
  const card = document.createElement('article');
  card.className = 'activity-card accepted';
  card.innerHTML = '<div class="activity-date"><strong>24</strong><span>JUIL</span></div><div><span class="state-label">✓ Affectée</span><strong></strong><p></p><small></small></div><button>›</button>';
  $('div:nth-child(2) strong', card).textContent = `${money(amount)} FCFA`;
  $('div:nth-child(2) p', card).textContent = `Épargne disponible · ${reference}`;
  $('div:nth-child(2) small', card).textContent = goal;
  $('#activityStack').prepend(card);
}

function calculatePlan() {
  const amount = Math.max(0, Number($('#goalAmount').value) || 0);
  const date = new Date(`${$('#goalDate').value}T12:00:00`);
  const baseline = new Date('2026-07-21T12:00:00');
  const days = Math.max(1, Math.ceil((date - baseline) / 86400000));
  const frequency = $('#goalFrequency').value;
  const periods = frequency === 'weekly' ? Math.max(1, Math.ceil(days / 7)) : Math.max(1, Math.ceil(days / 30.44));
  const contribution = Math.ceil(amount / periods / 1000) * 1000;
  const comfortableContribution = Math.ceil((contribution * 0.76) / 1000) * 1000;
  $('#calculatedContribution').textContent = `${money(contribution)} FCFA`;
  $('.plan-result small').textContent = frequency === 'weekly' ? 'par semaine' : 'par mois';
  $('#summaryGoalName').textContent = $('#goalName').value.trim() || 'Votre projet';
  $('#summaryAmount').textContent = `${money(amount)} FCFA`;
  $('#summaryDate').textContent = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  $('#aiPlanAmount').textContent = `${money(comfortableContribution)} FCFA ${frequency === 'weekly' ? 'par semaine' : 'par mois'}`;
  $('#aiPlanReason').textContent = `Décaler l\'échéance de 2 mois réduirait l\'effort de ${money(contribution - comfortableContribution)} FCFA et le risque d\'abandon estimé.`;
  return contribution;
}

function setGoalStep(step) {
  state.goalStep = step;
  $$('.goal-step').forEach(panel => panel.classList.toggle('active', Number(panel.dataset.step) === step));
  $('#goalBack').classList.toggle('hidden', step === 1);
  $('#goalNext').classList.toggle('hidden', step === 2);
  $('#goalCreate').classList.toggle('hidden', step === 1);
  if (step === 2) calculatePlan();
}

function addPendingActivity(data) {
  const card = document.createElement('article');
  card.className = 'activity-card pending';
  card.innerHTML = '<div class="activity-date"><strong>21</strong><span>JUIL</span></div><div><span class="state-label">⌛ En attente</span><strong></strong><p></p><small></small></div><button>›</button>';
  $('div:nth-child(2) strong', card).textContent = `${money(data.amount)} FCFA`;
  $('div:nth-child(2) p', card).textContent = `${data.channel} · ${data.reference}`;
  $('div:nth-child(2) small', card).textContent = data.goal;
  $('#activityStack').prepend(card);

  const queueItem = document.createElement('article');
  queueItem.className = 'validation-card';
  queueItem.dataset.id = `TF-${9060 + state.pending}`;
  queueItem.dataset.amount = data.amount;
  queueItem.dataset.goal = data.goal;
  queueItem.innerHTML = '<div class="proof-card om">OM<span>nouvelle</span></div><div class="validation-copy"><span></span><strong>Aïssatou Ndiaye</strong><p></p><b></b><small></small></div><div class="validation-buttons"><button class="reject-button">Signaler</button><button class="validate-button">Valider</button></div>';
  $('.validation-copy > span', queueItem).textContent = `${queueItem.dataset.id} · à l\'instant`;
  $('.validation-copy p', queueItem).textContent = data.goal;
  $('.validation-copy b', queueItem).textContent = `${money(data.amount)} FCFA`;
  $('.validation-copy small', queueItem).textContent = `Réf. ${data.reference}`;
  $('#validationQueue').prepend(queueItem);
  state.pending += 1;
  $('#pendingMetric').textContent = state.pending;
}

function resolveValidation(card, accepted, rejectionReason = 'Preuve à corriger') {
  if (!card || card.classList.contains('resolved')) return;
  const amount = Number(card.dataset.amount);
  const isAissatou = $('.validation-copy > strong', card)?.textContent === 'Aïssatou Ndiaye';
  card.classList.add('resolved');
  state.pending = Math.max(0, state.pending - 1);
  $('#pendingMetric').textContent = state.pending;
  if (accepted) {
    if (isAissatou) {
      const goal = card.dataset.goal || $('.validation-copy p', card)?.textContent || 'Ordinateur portable';
      if (goal.startsWith('Épargne disponible')) {
        state.freeSavings += amount;
        updateFreeSavingsUI();
      } else if (goal === 'Frais de formation') {
        state.formationValidated = Math.min(250000, state.formationValidated + amount);
        updateFormationProgress();
      } else {
        state.validated = Math.min(state.target, state.validated + amount);
        updateProgress();
      }
      state.totalSaved += amount;
      $('#totalSaved').textContent = `${money(state.totalSaved)} FCFA`;
    }
    toast('Cotisation validée', `${money(amount)} FCFA ajoutés à la progression. Décision journalisée.`);
  } else {
    toast('Cotisation non validée', `Motif : ${rejectionReason}. Une correction peut être envoyée.`, 'error');
  }
  setTimeout(() => card.remove(), 650);
}

$$('[data-auth-target]').forEach(button => button.addEventListener('click', () => {
  const target = button.dataset.authTarget;
  if (target === 'signup') {
    setSignupRole('user');
    setSignupStep(1);
  }
  showAuth(target);
}));

$$('[data-explore-app]').forEach(button => button.addEventListener('click', () => {
  enterApp('user', { guest: true });
  toast('Mode découverte', 'Explorez la boutique et TrustCoach sans compte. La vérification SMS n’interviendra qu’avant une opération sensible.');
}));

$$('[data-guest-auth-target]').forEach(button => button.addEventListener('click', () => {
  const target = button.dataset.guestAuthTarget;
  closeSheet('guestGateSheet');
  if (target === 'signup') {
    setSignupRole('user');
    setSignupStep(1);
  }
  showAuth(target);
}));

function selectLoginRole(role) {
  state.loginRole = role;
  $$('[data-login-role]').forEach(item => item.classList.toggle('active', item.dataset.loginRole === role));
  $$('.demo-account-card').forEach(card => card.classList.toggle('selected', card.dataset.demoRole === role));
  $('#loginPhone').value = '';
  $('#loginPassword').value = '';
  setLoginFeedback();
}

function fillDemoAccount(role) {
  const account = demoAccounts[role];
  selectLoginRole(role);
  $('[data-phone-country="loginPhone"]').value = 'SN';
  $('#loginPhone').value = account.phone.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  validatePhoneInput($('#loginPhone'));
  $('#loginPassword').value = account.password;
  $('#loginPassword').type = 'password';
  $('[data-password-target="loginPassword"]').textContent = 'Voir';
  setLoginFeedback();
}

function normalizePhone(value) {
  return digitsOnly(value);
}

function setLoginFeedback(message = '', kind = 'error') {
  const feedback = $('#loginFeedback');
  feedback.textContent = message;
  feedback.classList.remove('visible', 'success', 'error');
  if (!message) return;
  feedback.classList.add('visible', kind === 'success' ? 'success' : 'error');
}

$$('[data-login-role]').forEach(button => button.addEventListener('click', () => selectLoginRole(button.dataset.loginRole)));

$$('[data-signup-role]').forEach(button => button.addEventListener('click', () => setSignupRole(button.dataset.signupRole)));

$$('.toggle-password').forEach(button => button.addEventListener('click', () => {
  const field = document.getElementById(button.dataset.passwordTarget);
  const visible = field.type === 'text';
  field.type = visible ? 'password' : 'text';
  button.textContent = visible ? 'Voir' : 'Masquer';
}));

$('#loginForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const phone = normalizePhone($('#loginPhone').value);
  const password = $('#loginPassword').value;
  const loginCountry = $('[data-phone-country="loginPhone"]').value;
  const created = state.createdAccount;
  const createdMatch = created && created.country === loginCountry && created.phone === phone && created.password === password
    ? [created.role, created]
    : null;
  const demoMatch = loginCountry === 'SN'
    ? Object.entries(demoAccounts).find(([, acc]) => acc.phone === phone && acc.password === password)
    : null;
  const matched = createdMatch || demoMatch;
  if (!matched) {
    setLoginFeedback('Identifiants incorrects. Vérifiez votre numéro et votre mot de passe.');
    return;
  }
  setLoginFeedback();
  const [role, account] = matched;
  if (role === 'admin') {
    state.verifyMode = 'login';
    state.verifyRole = 'admin';
    $('#verifyPhone').textContent = '+221 77 000 00 03';
    $$('.otp-fields input').forEach(input => { input.value = ''; });
    showAuth('verify');
    $('.otp-fields input').focus();
    toast('Double vérification', 'Un code de sécurité administrateur est requis.');
    return;
  }
  enterApp(role, account.profile || {});
  toast('Connexion réussie', `Bienvenue ${account.name}.`);
});

$('#demoToggle').addEventListener('click', event => {
  const open = event.currentTarget.getAttribute('aria-expanded') !== 'true';
  event.currentTarget.setAttribute('aria-expanded', String(open));
  $('#demoAccounts').classList.toggle('open', open);
});

$$('[data-demo-role]').forEach(button => button.addEventListener('click', () => {
  fillDemoAccount(button.dataset.demoRole);
}));

$('#signupNext').addEventListener('click', () => {
  if (state.signupStep === 1) {
    setSignupStep(2);
    return;
  }
  if (state.signupStep === 2 && visibleStepIsValid(2)) setSignupStep(3);
});

$('#signupBack').addEventListener('click', () => {
  if (state.signupStep === 1) showAuth('welcome');
  else setSignupStep(state.signupStep - 1);
});

$('#signupPassword').addEventListener('input', validateSignupPassword);
$('#signupPasswordConfirm').addEventListener('input', validateSignupPassword);

$('#signupForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!visibleStepIsValid(3)) return;
  validateSignupPassword();
  if ($('#signupPassword').value !== $('#signupPasswordConfirm').value) {
    toast('Mots de passe différents', 'Saisissez exactement le même mot de passe dans les deux champs.', 'error');
    $('#signupPasswordConfirm').focus();
    return;
  }
  if (state.signupRole === 'admin' && !$('#adminInvite').value.trim()) {
    $('#adminInvite').focus();
    return;
  }
  const account = {
    role: state.signupRole,
    country: $('[data-phone-country="signupPhone"]').value,
    phone: normalizePhone($('#signupPhone').value),
    email: $('#signupEmail').value.trim().toLowerCase(),
    password: $('#signupPassword').value,
    name: `${$('#signupFirstName').value.trim()} ${$('#signupLastName').value.trim()}`.trim(),
    profile: {
      firstName: $('#signupFirstName').value.trim(),
      lastName: $('#signupLastName').value.trim()
    },
    kycVerified: false
  };
  /* La vérification forte est différée jusqu'à une opération sensible.
     Après inscription, l'utilisateur revient néanmoins à la connexion. */
  if (state.signupRole === 'admin') {
    state.pendingAccount = account;
    state.verifyMode = 'signup';
    state.verifyRole = account.role;
    $('#verifyPhone').textContent = fullPhone($('#signupPhone'));
    showAuth('verify');
    $('.otp-fields input').focus();
    return;
  }
  state.createdAccount = account;
  showAuth('login');
  $('[data-phone-country="loginPhone"]').value = account.country;
  $('#loginPhone').value = groupDigits(account.phone, phoneCountries[account.country].groups);
  validatePhoneInput($('#loginPhone'), false);
  $('#loginPassword').value = '';
  setLoginFeedback('Compte créé. Connectez-vous avec votre numéro et votre mot de passe.', 'success');
  $('#loginPassword').focus();
});

$$('.otp-fields input').forEach((input, index, inputs) => {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 1);
    if (input.value && inputs[index + 1]) inputs[index + 1].focus();
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Backspace' && !input.value && inputs[index - 1]) inputs[index - 1].focus();
  });
});

$('#verifyForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;

  /* Connexion admin : on entre directement après le code. */
  if (state.verifyMode === 'login') {
    const account = demoAccounts[state.verifyRole];
    enterApp(state.verifyRole, account.profile || {});
    toast('Connexion sécurisée', `Bienvenue ${account.name}.`);
    return;
  }

  const account = state.pendingAccount;
  if (!account) {
    showAuth('signup');
    setSignupStep(1);
    toast('Inscription à reprendre', 'Les informations du compte ne sont plus disponibles.', 'error');
    return;
  }
  account.phoneVerified = true;
  state.createdAccount = account;
  state.pendingAccount = null;
  enterApp(account.role, account.profile);
  toast('Téléphone vérifié', 'Votre numéro est confirmé. Bienvenue sur TrustFund.');
});

$('#resendCode').addEventListener('click', () => toast('Code renvoyé', 'Un nouveau code de vérification vient d\'être envoyé.'));

$$('.logout-button').forEach(button => button.addEventListener('click', () => {
  selectLoginRole('user');
  $('#demoToggle').setAttribute('aria-expanded', 'false');
  $('#demoAccounts').classList.remove('open');
  showAuth('welcome');
  toast('Session fermée', 'Vous avez été déconnecté en toute sécurité.');
}));

$$('[data-view-target]').forEach(button => button.addEventListener('click', () => showScreen(button.dataset.viewTarget)));

$$('[data-open]').forEach(button => button.addEventListener('click', event => {
  const target = button.dataset.open;
  if (target === 'passwordResetSheet') {
    event.preventDefault();
    openPasswordResetFlow();
    return;
  }
  if (state.isGuest && ['goalSheet', 'paymentSheet', 'allocateSavingsSheet', 'withdrawSheet', 'profileEditSheet', 'ticketSheet'].includes(target)) {
    event.preventDefault();
    const descriptions = {
      goalSheet: 'Connectez-vous pour créer et sauvegarder votre objectif d’épargne.',
      paymentSheet: 'Connectez-vous avant de déposer de l’argent.',
      allocateSavingsSheet: 'Connectez-vous pour affecter votre épargne à un objectif.',
      withdrawSheet: 'Connectez-vous pour demander un retrait.',
      profileEditSheet: 'Connectez-vous pour modifier vos informations personnelles.',
      ticketSheet: 'Connectez-vous pour créer et suivre une réclamation.'
    };
    $('#guestGateMessage').textContent = descriptions[target];
    openSheet('guestGateSheet');
    return;
  }
  if (target === 'goalSheet' && state.goalCount >= 3) {
    event.preventDefault();
    toast('Limite de 3 objectifs atteinte', 'Terminez, supprimez ou remplacez un objectif avant d\'en créer un autre.', 'error');
    return;
  }
  if (target === 'goalSheet' && !state.isGuest) {
    event.preventDefault();
    requireGoalVerification(() => openSheet('goalSheet'));
    return;
  }
  if (target === 'offerSheet' && state.role === 'provider') {
    event.preventDefault();
    const h2 = $('#offerSheet h2');
    if (h2) h2.textContent = 'Nouveau produit';
    setOfferStep(1);
    requireKyc('offerPublication', () => openSheet('offerSheet'));
    return;
  }
  openSheet(target);
}));

/* Registre des opérations sensibles : la vérification renforcée (OTP + pièce
   d'identité contrôlée) n'est exigée qu'au moment nécessaire, jamais à
   l'inscription ni en mode découverte. */
const sensitiveOperations = {
  freePayment: { label: 'dépôt d’argent', needsVerification: true },
  goalPayment: { label: 'dépôt sur un objectif', needsVerification: true },
  withdraw: { label: 'retrait de fonds', needsVerification: true },
  goalCreation: { label: 'création d’un objectif d’épargne', needsVerification: true },
  offerPublication: { label: 'publication d’une offre fournisseur', needsVerification: true }
};

/* Porte d'entrée des opérations sensibles : un compte vérifié est requis
   avant toute manipulation d'argent ou d'identité. */
function requireKyc(operationKey, nextAction) {
  const operation = sensitiveOperations[operationKey] || { label: 'opération sensible', needsVerification: true };
  if (state.isGuest) {
    $('#guestGateMessage').textContent = 'Connectez-vous avant d’effectuer une opération financière. La vérification renforcée ne sera demandée qu’au moment nécessaire.';
    openSheet('guestGateSheet');
    return;
  }
  if (!operation.needsVerification || state.kycVerified) {
    nextAction();
    return;
  }
  state.pendingFinancialAction = nextAction;
  $('#kycReason').textContent = operation.label === 'opération sensible'
    ? 'Nous demandons ces informations maintenant, car vous allez effectuer une opération sensible.'
    : `Nous demandons ces informations maintenant, car vous allez effectuer : ${operation.label}.`;
  openSheet('kycSheet');
}

function requireGoalVerification(nextAction) {
  requireKyc('goalCreation', nextAction);
}

$$('[data-free-payment]').forEach(button => button.addEventListener('click', () => requireKyc('freePayment', () => {
  $('#paymentGoal').selectedIndex = 0;
  openSheet('paymentSheet');
})));
$$('[data-goal-payment]').forEach(button => button.addEventListener('click', () => requireKyc('goalPayment', () => {
  $('#paymentGoal').value = button.dataset.goalPayment;
  openSheet('paymentSheet');
})));
$$('[data-withdraw]').forEach(button => button.addEventListener('click', () => requireKyc('withdraw', () => {
  $('#withdrawSource').value = button.dataset.withdraw || 'Épargne disponible';
  openSheet('withdrawSheet');
})));
$$('[data-close]').forEach(button => button.addEventListener('click', () => closeSheet(button.dataset.close)));
$('#resetDemo').addEventListener('click', () => window.location.reload());

$('#kycForm').addEventListener('submit', event => {
  event.preventDefault();
  validateIdentityNumber();
  $$('#kycFront, #kycBack').forEach(validateDocumentFile);
  if (!event.currentTarget.reportValidity()) return;
  state.kycVerified = true;
  closeSheet('kycSheet');
  const summary = $('.security-summary .verified-line');
  if (summary) summary.innerHTML = '<span>✓</span><div><strong>Identité confirmée</strong><small>CNI et téléphone vérifiés</small></div>';
  toast('Identité vérifiée', 'Vous pouvez maintenant continuer votre opération.');
  const nextAction = state.pendingFinancialAction;
  state.pendingFinancialAction = null;
  if (nextAction) nextAction();
});

$$('#kycFront, #kycBack').forEach(input => input.addEventListener('change', event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const upload = event.target.closest('.identity-upload');
  const valid = validateDocumentFile(event.target);
  upload.classList.toggle('file-ready', valid);
  upload.classList.toggle('file-error', !valid);
  $('strong', upload).textContent = valid ? file.name : 'Fichier non accepté';
  $('small', upload).textContent = valid ? 'Document ajouté · cliquer pour remplacer' : event.target.validationMessage;
}));

$('#withdrawForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const amount = Number($('#withdrawAmount').value);
  const source = $('#withdrawSource').value;
  const available = source === 'Épargne disponible' ? state.freeSavings : state.validated;
  if (amount > available) {
    toast('Montant indisponible', `Le solde disponible est de ${money(available)} FCFA.`, 'error');
    return;
  }
  closeSheet('withdrawSheet');
  toast('Demande envoyée', `Le retrait de ${money(amount)} FCFA sera vérifié avant validation.`);
  showScreen('activity');
});

$$('.sheet').forEach(sheet => sheet.addEventListener('click', event => {
  if (event.target === sheet) sheet.close();
}));

$$('.role-card').forEach(card => card.addEventListener('click', () => setRole(card.dataset.role)));

$('#goalNext').addEventListener('click', () => {
  if (!$('#goalName').value.trim()) {
    $('#goalName').focus();
    toast('Nom requis', 'Donnez un nom à votre projet pour calculer son plan.', 'error');
    return;
  }
  setGoalStep(2);
});

$('#goalBack').addEventListener('click', () => setGoalStep(1));

$('#goalForm').addEventListener('submit', event => {
  event.preventDefault();
  const name = $('#goalName').value.trim();
  state.goalCount += 1;
  closeSheet('goalSheet');
  toast('Objectif créé', `${name} possède maintenant son plan de cotisation.`);
  event.currentTarget.reset();
  $('#goalAmount').value = 600000;
  $('#goalDate').value = '2027-01-15';
  setGoalStep(1);
  showScreen('goals');
});

function fillProductDetails(button) {
  const card = button.closest('.mobile-product');
  const vendor = $('.product-copy > p', card).textContent;
  const specs = (card.dataset.specs || '').split('|').filter(Boolean);
  state.selectedProduct = {
    name: button.dataset.product,
    amount: Number(button.dataset.amount),
    vendor,
    image: card.dataset.image,
    description: card.dataset.description || 'Toutes les informations seront confirmées avant la commande.',
    specs
  };
  $('#productDetailName').textContent = state.selectedProduct.name;
  $('#productDetailVendor').textContent = vendor;
  const fee = platformFee(state.selectedProduct.amount);
  const total = customerPrice(state.selectedProduct.amount);
  $('#productDetailPrice').textContent = `${money(total)} FCFA`;
  $('#productSupplierPrice').textContent = `${money(state.selectedProduct.amount)} FCFA`;
  $('#productPlatformFee').textContent = `${money(fee)} FCFA`;
  $('#productCustomerTotal').textContent = `${money(total)} FCFA`;
  $('#productFeeRate').textContent = `${state.serviceFeeRate}%`;
  $('#productDetailDescription').textContent = state.selectedProduct.description;
  $('#productDetailImage').src = state.selectedProduct.image;
  $('#productDetailImage').alt = state.selectedProduct.name;
  $('#productDetailSpecs').innerHTML = specs.map(spec => `<span><i>✓</i>${spec}</span>`).join('');
  $('#selectProduct').textContent = state.changeProductMode ? 'Remplacer mon produit' : 'Choisir pour mon objectif';
}

$$('.choose-product').forEach(button => button.addEventListener('click', () => {
  fillProductDetails(button);
  openSheet('productDetailSheet');
}));

$('[data-change-product]').addEventListener('click', () => {
  state.changeProductMode = true;
  showScreen('catalog');
  toast('Choisissez un nouveau produit', 'Ouvrez sa fiche puis confirmez le remplacement.');
});

$('#selectProduct').addEventListener('click', () => {
  if (!state.selectedProduct) return;
  if (state.isGuest) {
    closeSheet('productDetailSheet');
    $('#guestGateMessage').textContent = 'Connectez-vous pour associer ce produit à un objectif. Vous pouvez continuer à parcourir la boutique sans compte.';
    openSheet('guestGateSheet');
    return;
  }
  closeSheet('productDetailSheet');
  if (state.changeProductMode || state.goalCount >= 3) {
    state.changeProductMode = false;
    $('.detail-title h1').innerHTML = `${state.selectedProduct.name.replace(/\s+/g, '<br>')}.`;
    $('#goalName').value = state.selectedProduct.name;
    $('#goalAmount').value = customerPrice(state.selectedProduct.amount);
    toast('Produit remplacé', `${state.selectedProduct.name} est maintenant lié à votre objectif.`);
    showScreen('goal-detail');
    return;
  }
  $('#goalName').value = state.selectedProduct.name;
  $('#goalAmount').value = customerPrice(state.selectedProduct.amount);
  setGoalStep(2);
  requireGoalVerification(() => openSheet('goalSheet'));
});

$('#contactProvider').addEventListener('click', () => {
  const product = $('#productDetailName')?.textContent || 'ce produit';
  $('#contactVendorAvatar').textContent = 'TF';
  $('#contactVendorName').textContent = 'Équipe TrustFund';
  $('#contactProductRef').value = product;
  $('#contactMessage').value = `Bonjour,\n\nJe souhaite savoir si le produit « ${product} » est toujours disponible.\n\nMerci de vérifier cette information auprès du partenaire et de me répondre dans l’application.`;
  $('#contactSuccessBanner').classList.add('hidden');
  $('#contactSendBtn').disabled = false;
  $('#contactSendBtn').textContent = 'Envoyer à TrustFund';
  openSheet('contactProviderSheet');
});

$('#contactProviderForm').addEventListener('submit', e => {
  e.preventDefault();
  $('#contactSendBtn').disabled = true;
  $('#contactSendBtn').textContent = 'Demande envoyée';
  $('#contactSuccessBanner').classList.remove('hidden');
  const product = $('#contactProductRef').value;
  const senderName = roleMeta.user.name.replace('<br>', ' ').replace('.', '').trim();
  state.availabilityRequest = {
    product,
    message: $('#contactMessage').value.trim(),
    userName: senderName,
    status: 'admin-review'
  };
  $('#availabilityAdminProduct').textContent = product;
  $('#availabilityAdminMessage').textContent = `${senderName} souhaite connaître la disponibilité de ce produit.`;
  $('#availabilityAdminStatus').textContent = 'À transmettre au fournisseur';
  $('#availabilityAdminCard').classList.add('active');
  $('#adminAskProvider').disabled = false;
  $('#adminAskProvider').textContent = 'Demander au fournisseur';
  $('#adminReplyUserAvailability').classList.add('hidden');
  toast('Demande reçue par TrustFund', 'L’administration vérifie la disponibilité auprès du fournisseur. Aucun contact direct n’est transmis.');
});

$('#adminAskProvider').addEventListener('click', () => {
  const request = state.availabilityRequest || {
    product: $('#availabilityAdminProduct').textContent,
    userName: 'Un utilisateur',
    message: '',
    status: 'admin-review'
  };
  state.availabilityRequest = request;
  request.status = 'supplier-review';
  $('#availabilityAdminStatus').textContent = 'Demande envoyée au fournisseur · réponse attendue';
  $('#adminAskProvider').disabled = true;
  $('#adminAskProvider').textContent = 'Demande transmise';
  $('#providerContactNotifText').textContent = `TrustFund vous demande de confirmer la disponibilité de « ${request.product} ».`;
  $('#providerContactNotifTime').textContent = 'À l’instant';
  $('#providerContactNotif').classList.add('active', 'unread');
  $$('.notification-trigger i').forEach(badge => {
    const count = Number.parseInt(badge.textContent || '0', 10) + 1;
    badge.textContent = count;
    badge.style.removeProperty('display');
  });
  toast('Demande transmise', 'Le fournisseur a reçu une demande de vérification envoyée par TrustFund.');
});

$('#providerAvailabilityConfirm').addEventListener('click', event => {
  if (!state.availabilityRequest) return;
  state.availabilityRequest.status = 'supplier-confirmed';
  event.currentTarget.disabled = true;
  event.currentTarget.textContent = 'Disponibilité confirmée';
  $('#availabilityAdminStatus').textContent = 'Disponibilité confirmée · réponse utilisateur requise';
  $('#adminReplyUserAvailability').classList.remove('hidden');
  toast('Confirmation envoyée à TrustFund', 'L’administration peut maintenant répondre à l’utilisateur.');
});

$('#adminReplyUserAvailability').addEventListener('click', () => {
  const request = state.availabilityRequest;
  if (!request) return;
  const message = $('#availabilityReplySheet textarea');
  message.value = `Le produit « ${request.product} » est disponible. Vous pouvez l’ajouter à votre objectif d’épargne.`;
  openSheet('availabilityReplySheet');
});

$('#availabilityReplyForm').addEventListener('submit', event => {
  event.preventDefault();
  const request = state.availabilityRequest;
  if (!request || !event.currentTarget.reportValidity()) return;
  const decision = $('#availabilityReplySheet select').value;
  const reply = $('#availabilityReplySheet textarea').value.trim();
  request.status = 'user-informed';
  request.decision = decision;
  request.reply = reply;
  $('#userAvailabilityNotif strong').textContent = decision === 'available' ? 'Produit disponible' : 'Mise à jour de disponibilité';
  $('#userAvailabilityNotif p').textContent = reply;
  $('#userAvailabilityNotif').classList.remove('hidden');
  $('#availabilityAdminStatus').textContent = 'Utilisateur informé par TrustFund';
  $('#adminReplyUserAvailability').disabled = true;
  $('#adminReplyUserAvailability').textContent = 'Réponse envoyée';
  closeSheet('availabilityReplySheet');
  toast('Utilisateur informé', 'La réponse TrustFund a été ajoutée à ses notifications.');
});

['goalAmount', 'goalDate', 'goalFrequency'].forEach(id => document.getElementById(id).addEventListener('input', () => {
  if (state.goalStep === 2) calculatePlan();
}));

function updatePaymentSummary() {
  const amount = Math.max(0, Number($('#paymentAmount').value) || 0);
  $('#paymentSummaryAmount').textContent = `${money(amount)} FCFA`;
}

$$('[data-payment-method]').forEach(button => button.addEventListener('click', () => {
  state.paymentMethod = button.dataset.paymentMethod;
  $$('[data-payment-method]').forEach(item => item.classList.toggle('active', item === button));
}));

$$('.amount-choices [data-amount]').forEach(button => button.addEventListener('click', () => {
  $('#paymentAmount').value = button.dataset.amount;
  $$('.amount-choices [data-amount]').forEach(item => item.classList.toggle('active', item === button));
  updatePaymentSummary();
}));

$('#paymentAmount').addEventListener('input', updatePaymentSummary);

$('#showProofForm').addEventListener('click', () => {
  closeSheet('paymentSheet');
  openSheet('contributionSheet');
});

$$('[data-allocate-amount]').forEach(button => button.addEventListener('click', () => {
  const amount = button.dataset.allocateAmount === 'all' ? state.freeSavings : Number(button.dataset.allocateAmount);
  $('#allocateAmount').value = amount;
  $$('[data-allocate-amount]').forEach(item => item.classList.toggle('active', item === button));
}));

$('#allocateSavingsForm').addEventListener('submit', event => {
  event.preventDefault();
  const amount = Number($('#allocateAmount').value);
  const goal = $('#allocateGoal').value;
  if (!amount || amount < 1000) {
    toast('Montant incorrect', 'Saisissez au moins 1 000 FCFA.', 'error');
    return;
  }
  if (amount > state.freeSavings) {
    toast('Solde insuffisant', `Vous disposez de ${money(state.freeSavings)} FCFA dans votre épargne disponible.`, 'error');
    return;
  }
  const goalRemaining = goal === 'Ordinateur portable' ? state.target - state.validated : 250000 - state.formationValidated;
  if (amount > goalRemaining) {
    toast('Montant trop élevé', `Cet objectif ne nécessite plus que ${money(goalRemaining)} FCFA.`, 'error');
    return;
  }
  state.freeSavings -= amount;
  if (goal === 'Ordinateur portable') {
    state.validated = Math.min(state.target, state.validated + amount);
    updateProgress();
  } else {
    state.formationValidated = Math.min(250000, state.formationValidated + amount);
    updateFormationProgress();
  }
  updateFreeSavingsUI();
  addAllocationActivity(goal, amount);
  closeSheet('allocateSavingsSheet');
  $('#allocateAmount').value = Math.min(25000, state.freeSavings);
  toast('Épargne affectée', `${money(amount)} FCFA ont été affectés à « ${goal} ».`);
  showScreen('home');
});

$('#paymentForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const amount = Number($('#paymentAmount').value);
  const goal = $('#paymentGoal').value;
  const remainingForGoal = goal === 'Ordinateur portable' ? state.target - state.validated : goal === 'Frais de formation' ? 250000 - state.formationValidated : Infinity;
  if (amount > remainingForGoal) {
    toast('Montant trop élevé', `Cet objectif ne nécessite plus que ${money(remainingForGoal)} FCFA. Placez le reste dans votre épargne disponible.`, 'error');
    return;
  }
  const reference = `${state.paymentMethod === 'Wave' ? 'WV' : 'OM'}-${String(Date.now()).slice(-6)}`;
  const card = document.createElement('article');
  card.className = 'activity-card accepted';
  card.innerHTML = '<div class="activity-date"><strong>24</strong><span>JUIL</span></div><div><span class="state-label">✓ Payée</span><strong></strong><p></p><small></small></div><button>›</button>';
  $('div:nth-child(2) strong', card).textContent = `${money(amount)} FCFA`;
  $('div:nth-child(2) p', card).textContent = `${state.paymentMethod} · ${reference}`;
  $('div:nth-child(2) small', card).textContent = `${goal} · preuve automatique`;
  $('#activityStack').prepend(card);
  if (goal.startsWith('Épargne disponible')) {
    state.freeSavings += amount;
    updateFreeSavingsUI();
  } else if (goal === 'Ordinateur portable') {
    state.validated = Math.min(state.target, state.validated + amount);
    updateProgress();
  } else if (goal === 'Frais de formation') {
    state.formationValidated = Math.min(250000, state.formationValidated + amount);
    updateFormationProgress();
  }
  state.totalSaved += amount;
  const total = $('#totalSaved');
  if (total) total.textContent = `${money(state.totalSaved)} FCFA`;
  closeSheet('paymentSheet');
  $('#paymentConsent').checked = false;
  toast('Paiement confirmé', `${money(amount)} FCFA payés par ${state.paymentMethod}. Référence ${reference}.`);
  showScreen('activity');
});

$('#contributionForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = {
    goal: $('#contributionGoal').value,
    amount: Number($('#contributionAmount').value),
    channel: $('#contributionChannel').value,
    reference: $('#contributionRef').value.trim()
  };
  if (!data.reference) {
    $('#contributionRef').focus();
    return;
  }
  const normalizedReference = data.reference.toUpperCase();
  if (state.usedReferences.has(normalizedReference)) {
    toast('Référence déjà utilisée', 'Vérifiez la référence ou contactez le support si vous pensez qu\'il s\'agit d\'une erreur.', 'error');
    $('#contributionRef').focus();
    return;
  }
  if (!$('#proofFile').files.length) {
    toast('Preuve requise', 'Ajoutez une capture ou un reçu avant de soumettre la déclaration.', 'error');
    return;
  }
  state.usedReferences.add(normalizedReference);
  addPendingActivity(data);
  closeSheet('contributionSheet');
  event.currentTarget.reset();
  $('#contributionAmount').value = 38000;
  toast('Déclaration reçue', 'Elle reste en attente : votre progression n\'a pas encore changé.');
  showScreen('activity');
});

$('#proofFile').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  const card = event.target.closest('.upload-card');
  $('strong', card).textContent = file.name;
  $('small', card).textContent = 'Preuve prête à être envoyée';
});

function filterProducts() {
  const query = $('#catalogSearch').value.trim().toLowerCase();
  const active = $('.filter-chip.active')?.dataset.filter || 'all';
  $$('.mobile-product').forEach(product => {
    const categoryMatch = active === 'all' || product.dataset.category === active;
    const textMatch = !query || product.dataset.search.includes(query) || product.textContent.toLowerCase().includes(query);
    product.classList.toggle('hidden', !(categoryMatch && textMatch));
  });
}

$('#catalogSearch').addEventListener('input', filterProducts);
$$('.filter-chip').forEach(chip => chip.addEventListener('click', () => {
  $$('.filter-chip').forEach(item => item.classList.remove('active'));
  chip.classList.add('active');
  filterProducts();
}));

$$('.status-guide button').forEach(button => button.addEventListener('click', () => {
  $$('.status-guide > *').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  const wanted = button.dataset.status;
  $$('.activity-card').forEach(card => { card.style.display = card.classList.contains(wanted) ? 'grid' : 'none'; });
}));
$('.status-guide span').addEventListener('click', () => {
  $$('.status-guide > *').forEach(item => item.classList.remove('active'));
  $('.status-guide span').classList.add('active');
  $$('.activity-card').forEach(card => { card.style.display = 'grid'; });
});

$('#validationQueue').addEventListener('click', event => {
  const card = event.target.closest('.validation-card');
  if (event.target.closest('.validate-button')) resolveValidation(card, true);
  if (event.target.closest('.reject-button')) {
    state.pendingProofCard = card;
    $('#proofDecisionReference').textContent = `Preuve ${card.dataset.id}`;
    $('#proofDecisionMessage').value = '';
    openSheet('proofDecisionSheet');
  }
});

$('#proofDecisionReason').addEventListener('change', event => {
  $('#proofDecisionMessage').value = `La preuve transmise présente le problème suivant : ${event.target.value.toLowerCase()}. Merci d\'envoyer un document complet et lisible avec la référence et le montant visibles.`;
});

$('#proofDecisionForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity() || !state.pendingProofCard) return;
  const reason = $('#proofDecisionReason').value;
  closeSheet('proofDecisionSheet');
  const card = state.pendingProofCard;
  state.pendingProofCard = null;
  resolveValidation(card, false, reason);
  toast('Correction demandée', `${reason}. L\'utilisateur a reçu les éléments précis à renvoyer.`, 'error');
});

$('#ticketForm').addEventListener('submit', event => {
  event.preventDefault();
  const category = $('select', event.currentTarget).value;
  const message = $('textarea', event.currentTarget).value.trim();
  const ticket = document.createElement('button');
  ticket.className = 'ticket-row';
  ticket.dataset.open = 'ticketDetailSheet';
  ticket.innerHTML = '<span class="ticket-state pending">Reçue</span><strong>#REC-2051</strong><p></p><small>Créée à l\'instant</small>';
  $('strong', ticket).textContent = `#REC-2051 · ${category}`;
  $('p', ticket).textContent = message;
  ticket.addEventListener('click', () => openSheet('ticketDetailSheet'));
  $('#userTicketList').prepend(ticket);
  closeSheet('ticketSheet');
  event.currentTarget.reset();
  toast('Réclamation TF-2051 créée', 'Vous pourrez suivre chaque réponse depuis votre profil.');
});

$$('.confirm-order').forEach(button => button.addEventListener('click', () => {
  button.textContent = 'Disponibilité confirmée ✓';
  button.classList.add('confirmed');
  button.disabled = true;
  toast('Disponibilité confirmée', 'TrustFund a reçu votre confirmation et informera l’utilisateur.');
}));

$('.mark-all-read').addEventListener('click', () => {
  $$('.notification-card').forEach(card => card.classList.remove('unread'));
  $('.notification-trigger i').textContent = '0';
  toast('Notifications lues', 'Tous les messages ont été marqués comme lus.');
});

function setPasswordResetChannel(channel) {
  state.passwordResetChannel = channel;
  $$('[data-reset-channel]').forEach(button => button.classList.toggle('active', button.dataset.resetChannel === channel));
  $('#resetSmsField').classList.toggle('hidden', channel !== 'sms');
  $('#resetEmailField').classList.toggle('hidden', channel !== 'email');
  $('#resetPhone').required = channel === 'sms';
  $('#resetEmail').required = channel === 'email';
}

function setPasswordResetStep(step) {
  state.passwordResetStep = step;
  $$('.reset-step').forEach(section => section.classList.toggle('active', Number(section.dataset.resetStep) === step));
  $$('.reset-progress i').forEach((item, index) => item.classList.toggle('active', index < step));
  $('#resetBack').classList.toggle('hidden', step === 1);
  const labels = {
    1: ['Étape 1 sur 3', 'Choisissez comment recevoir votre code de sécurité.', 'Recevoir le code'],
    2: ['Étape 2 sur 3', 'Saisissez le code à 6 chiffres reçu.', 'Vérifier le code'],
    3: ['Étape 3 sur 3', 'Créez un nouveau mot de passe sécurisé.', 'Enregistrer le mot de passe']
  };
  $('#resetStepLabel').textContent = labels[step][0];
  $('#resetStepHelp').textContent = labels[step][1];
  $('#resetNext').textContent = labels[step][2];
  $('#resetPasswordFeedback').textContent = '';
  $('#resetPasswordFeedback').classList.remove('visible', 'success', 'error');
  $('#passwordResetSheet').scrollTop = 0;
}

function maskResetDestination(channel) {
  if (channel === 'email') {
    const [local = '', domain = ''] = $('#resetEmail').value.trim().split('@');
    return `${local.slice(0, 2)}${'•'.repeat(Math.max(2, local.length - 2))}@${domain}`;
  }
  const { country } = phoneControl($('#resetPhone'));
  const phone = digitsOnly($('#resetPhone').value);
  return `+${country.code} ${phone.slice(0, 2)} ••• •• ${phone.slice(-2)}`;
}

function findPasswordResetAccount() {
  if (state.passwordResetChannel === 'email') {
    const email = $('#resetEmail').value.trim().toLowerCase();
    if (state.createdAccount?.email === email) {
      return { role: state.createdAccount.role, account: state.createdAccount, country: state.createdAccount.country };
    }
    return null;
  }
  const country = $('[data-phone-country="resetPhone"]').value;
  const phone = normalizePhone($('#resetPhone').value);
  if (state.createdAccount?.country === country && state.createdAccount.phone === phone) {
    return { role: state.createdAccount.role, account: state.createdAccount, country };
  }
  if (country !== 'SN') return null;
  const match = Object.entries(demoAccounts).find(([, account]) => account.phone === phone);
  return match ? { role: match[0], account: match[1], country: 'SN' } : null;
}

function openPasswordResetFlow() {
  $('#passwordResetForm').reset();
  $$('.reset-otp-fields input').forEach(input => { input.value = ''; });
  $('#resetNewPassword').value = '';
  $('#resetConfirmPassword').value = '';
  state.passwordResetAccount = null;
  setPasswordResetChannel('sms');
  setPasswordResetStep(1);
  const account = state.createdAccount?.role === state.role ? state.createdAccount : demoAccounts[state.role];
  if ($('.app-shell.active') && account?.phone) {
    $('[data-phone-country="resetPhone"]').value = account.country || 'SN';
    $('#resetPhone').value = account.phone;
    validatePhoneInput($('#resetPhone'), false);
  }
  openSheet('passwordResetSheet');
}

$$('[data-reset-channel]').forEach(button => button.addEventListener('click', () => setPasswordResetChannel(button.dataset.resetChannel)));

$$('.reset-otp-fields input').forEach((input, index, inputs) => {
  input.addEventListener('input', () => {
    input.value = digitsOnly(input.value, 1);
    if (input.value && inputs[index + 1]) inputs[index + 1].focus();
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Backspace' && !input.value && inputs[index - 1]) inputs[index - 1].focus();
  });
  input.addEventListener('paste', event => {
    const code = digitsOnly(event.clipboardData.getData('text'), 6);
    if (code.length !== 6) return;
    event.preventDefault();
    inputs.forEach((field, fieldIndex) => { field.value = code[fieldIndex]; });
    inputs[5].focus();
  });
});

$('#resetBack').addEventListener('click', () => setPasswordResetStep(Math.max(1, state.passwordResetStep - 1)));
$('#resetResend').addEventListener('click', () => toast('Code renvoyé', `Un nouveau code a été envoyé par ${state.passwordResetChannel === 'sms' ? 'SMS' : 'e-mail'}.`));

$('#passwordResetForm').addEventListener('submit', event => {
  event.preventDefault();
  if (state.passwordResetStep === 1) {
    if (state.passwordResetChannel === 'sms') {
      if (!validatePhoneInput($('#resetPhone')) || !$('#resetPhone').reportValidity()) return;
    } else if (!$('#resetEmail').reportValidity()) return;
    state.passwordResetAccount = findPasswordResetAccount();
    $('#resetDestination').textContent = maskResetDestination(state.passwordResetChannel);
    setPasswordResetStep(2);
    $('.reset-otp-fields input').focus();
    toast('Code envoyé', `Un code temporaire valable 10 minutes a été envoyé par ${state.passwordResetChannel === 'sms' ? 'SMS' : 'e-mail'}.`);
    return;
  }
  if (state.passwordResetStep === 2) {
    const code = $$('.reset-otp-fields input').map(input => input.value).join('');
    if (code.length !== 6) {
      toast('Code incomplet', 'Saisissez les 6 chiffres reçus.', 'error');
      $('.reset-otp-fields input:placeholder-shown')?.focus();
      return;
    }
    setPasswordResetStep(3);
    $('#resetNewPassword').focus();
    return;
  }
  const password = $('#resetNewPassword').value;
  const confirmation = $('#resetConfirmPassword').value;
  const checks = passwordChecks(password);
  const strong = Object.values(checks).every(Boolean) && !/^(password|motdepasse|azerty|qwerty|123456)/i.test(password);
  const feedback = $('#resetPasswordFeedback');
  if (!strong) {
    feedback.textContent = 'Utilisez 12 caractères avec majuscule, minuscule, chiffre et caractère spécial, sans espace.';
    feedback.classList.add('visible', 'error');
    $('#resetNewPassword').focus();
    return;
  }
  if (password !== confirmation) {
    feedback.textContent = 'Les deux nouveaux mots de passe ne correspondent pas.';
    feedback.classList.add('visible', 'error');
    $('#resetConfirmPassword').focus();
    return;
  }
  const resetAccount = state.passwordResetAccount;
  if (resetAccount) {
    resetAccount.account.password = password;
    const demoCard = $(`.demo-account-card[data-demo-role="${resetAccount.role}"] code`);
    if (demoCard) demoCard.textContent = `${groupDigits(resetAccount.account.phone, phoneCountries.SN.groups)} · ${password}`;
  }
  closeSheet('passwordResetSheet');
  showAuth('login');
  if (resetAccount) {
    $('[data-phone-country="loginPhone"]').value = resetAccount.country;
    $('#loginPhone').value = resetAccount.account.phone;
    validatePhoneInput($('#loginPhone'), false);
  }
  $('#loginPassword').value = '';
  setLoginFeedback('Mot de passe modifié. Connectez-vous avec votre nouveau mot de passe.', 'success');
  $('#loginPassword').focus();
  toast('Mot de passe modifié', 'Votre nouveau mot de passe est actif. Reconnectez-vous pour continuer.');
});

$('#profileEditForm').addEventListener('submit', event => {
  event.preventDefault();
  const firstName = $('#editFirstName').value.trim();
  const lastName = $('#editLastName').value.trim();
  if (state.role === 'user') {
    roleMeta.user.name = `${firstName}<br>${lastName}.`;
    $('#profileName').innerHTML = roleMeta.user.name;
    const homeName = $('.home-greeting h1');
    if (homeName) homeName.textContent = firstName;
  }
  closeSheet('profileEditSheet');
  toast('Profil mis à jour', 'Vos informations autorisées ont été enregistrées et journalisées.');
});

$('#notificationPrefsForm').addEventListener('submit', event => {
  event.preventDefault();
  closeSheet('notificationPrefsSheet');
  toast('Préférences enregistrées', 'Vos prochains rappels respecteront ces canaux.');
});

$('.security-change-password').addEventListener('click', () => {
  closeSheet('securitySheet');
  openPasswordResetFlow();
});

$$('[data-goal-action]').forEach(button => button.addEventListener('click', () => {
  const action = button.dataset.goalAction;
  if (action === 'edit') {
    closeSheet('goalActionsSheet');
    $('#goalName').value = 'Ordinateur portable';
    $('#goalAmount').value = 600000;
    $('#goalDate').value = '2027-01-15';
    setGoalStep(1);
    requireGoalVerification(() => openSheet('goalSheet'));
    return;
  }
  if (action === 'suspend') {
    $('#goalStatusPill').innerHTML = '<i></i> Suspendu';
    $('#goalStatusPill').classList.add('warning');
    closeSheet('goalActionsSheet');
    toast('Objectif suspendu', 'Le plan est inactif, mais les 372 000 FCFA déjà validés restent conservés.');
    return;
  }
  if (!button.dataset.confirmed) {
    button.dataset.confirmed = 'true';
    $('strong', button).textContent = 'Confirmer l\'annulation';
    $('small', button).textContent = 'Appuyez encore une fois pour confirmer';
    return;
  }
  $('#goalStatusPill').innerHTML = '<i></i> Annulé';
  $('#goalStatusPill').classList.add('warning');
  closeSheet('goalActionsSheet');
  toast('Objectif annulé', 'L\'historique et les montants validés restent consultables.', 'error');
}));

$('#createOrder').addEventListener('click', () => {
  if (!$('#finalizeConsent').checked) {
    toast('Confirmation requise', 'Vérifiez puis acceptez le prix et les conditions du fournisseur.', 'error');
    return;
  }
  $('#createOrder').classList.add('hidden');
  $('#orderTracking').classList.remove('hidden');
  toast('Commande #TF-1214 créée', 'Le fournisseur a été notifié pour confirmer la préparation.');
});

$('#receptionForm').addEventListener('submit', event => {
  event.preventDefault();
  closeSheet('receptionSheet');
  if ($('#receptionStatus').value === 'no') {
    openSheet('ticketSheet');
    toast('Réception non conforme', 'Décrivez le problème pour ouvrir une réclamation.', 'error');
    return;
  }
  $('#orderTracking strong').textContent = 'Objectif clôturé ✓';
  $('#orderTracking p').textContent = 'Réception confirmée et évaluation enregistrée.';
  toast('Félicitations !', 'Votre objectif est clôturé et le fournisseur a reçu votre évaluation.');
});

$('#offerImage').addEventListener('change', event => {
  const files = [...(event.target.files || [])].slice(0, 4);
  if (!files.length) return;
  if (event.target.files.length > 4) toast('Quatre photos maximum', 'Seules les quatre premières images ont été conservées.', 'error');
  Promise.all(files.map(file => new Promise(resolve => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result || '')));
    reader.readAsDataURL(file);
  }))).then(images => {
    state.offerImages = images;
    state.offerImage = images[0] || '';
    $('#offerImagePreview').innerHTML = '<img alt="Photo principale de la nouvelle offre">';
    $('img', $('#offerImagePreview')).src = state.offerImage;
    $$('#offerImageGallery [data-photo-slot]').forEach((slot, index) => {
      slot.classList.toggle('filled', Boolean(images[index]));
      slot.innerHTML = images[index] ? `<img src="${images[index]}" alt="Vue ${index + 1} du produit"><small>${index === 0 ? 'Principale' : `Vue ${index + 1}`}</small>` : `${index + 1}<small>${index === 0 ? 'Principale' : index === 3 ? 'Optionnelle' : 'Autre vue'}</small>`;
    });
    $('#offerPhotoHelp').textContent = `${images.length} photo${images.length > 1 ? 's' : ''} ajoutée${images.length > 1 ? 's' : ''} · ${images.length < 2 ? 'ajoutez encore une photo' : 'galerie prête'}`;
  });
});

function updateOfferFeePreview() {
  const base = Number($('#offerPrice').value) || 0;
  $('#offerSupplierPrice').textContent = `${money(base)} FCFA`;
  $('#offerFeeAmount').textContent = `${money(platformFee(base))} FCFA`;
  $('#offerCustomerPrice').textContent = `${money(customerPrice(base))} FCFA`;
}

$('#offerPrice').addEventListener('input', updateOfferFeePreview);

// BUG-03 — Slots de la galerie photos cliquables → déclenche l\'input file
$('#offerImageGallery').addEventListener('click', e => {
  if (e.target.closest('[data-photo-slot]')) $('#offerImage').click();
});

function setOfferStep(step) {
  state.offerStep = Math.max(1, Math.min(4, step));
  $$('.offer-step').forEach(panel => panel.classList.toggle('active', Number(panel.dataset.offerStep) === state.offerStep));
  $$('.wizard-progress i').forEach((bar, index) => bar.classList.toggle('active', index < state.offerStep));
  $('#offerBack').classList.toggle('hidden', state.offerStep === 1);
  $('#offerNext').classList.toggle('hidden', state.offerStep === 4);
  $('#offerSubmit').classList.toggle('hidden', state.offerStep !== 4);
  $('#offerStepLabel').textContent = `Étape ${state.offerStep} sur 4`;
  $('#offerStepHelp').textContent = ['Commencez par l\'essentiel.', 'Décrivez ce que vous proposez.', 'Indiquez le prix et la disponibilité.', 'Vérifiez avant de publier.'][state.offerStep - 1];
  if (state.offerStep === 4) {
    $('#offerReviewName').textContent = $('#offerName').value.trim() || 'Nouveau produit';
    const basePrice = Number($('#offerPrice').value) || 0;
    $('#offerReviewMeta').textContent = `${money(basePrice)} fournisseur · ${money(customerPrice(basePrice))} client · ${Number($('#offerStock').value) || 0} en stock · ${state.offerImages.length} photos`;
  }
  $('#offerSheet').scrollTo({ top: 0, behavior: 'smooth' });
}

function offerStepIsValid(step) {
  if (step === 1 && state.offerImages.length < 2) {
    toast('Ajoutez deux photos', 'Une vue principale et une seconde vue sont nécessaires pour présenter le produit.', 'error');
    $('#offerImage').focus();
    return false;
  }
  const panel = $(`.offer-step[data-offer-step="${step}"]`);
  const invalid = $$('input[required], select[required], textarea[required]', panel).find(field => !field.checkValidity());
  if (!invalid) return true;
  invalid.reportValidity();
  invalid.focus();
  return false;
}

$('#offerNext').addEventListener('click', () => {
  if (offerStepIsValid(state.offerStep)) setOfferStep(state.offerStep + 1);
});

$('#offerBack').addEventListener('click', () => setOfferStep(state.offerStep - 1));

$('#offerForm').addEventListener('submit', event => {
  event.preventDefault();
  if (state.offerStep < 4) {
    if (offerStepIsValid(state.offerStep)) setOfferStep(state.offerStep + 1);
    return;
  }
  const name = $('#offerName').value.trim();
  const price = Number($('#offerPrice').value);
  const stock = Number($('#offerStock').value);
  const card = document.createElement('article');
  card.className = 'management-card offer-management-card';
  card.dataset.search = name.toLowerCase();
  card.innerHTML = '<div class="management-thumb"><img alt=""></div><div><span class="entity-state warning">En attente</span><strong></strong><p></p></div><div class="offer-card-actions"><button class="offer-toggle" data-state="active">Suspendre</button><button class="offer-edit">Modifier</button><button class="offer-delete">Supprimer</button></div>';
  $('.management-thumb img', card).src = state.offerImage || 'assets/product-solar-kit.webp';
  $('strong', card).textContent = name;
  $('p', card).textContent = `${money(price)} fournisseur · ${money(customerPrice(price))} client · ${stock} en stock · ${state.offerImages.length} photos`;
  $('#providerOfferList').prepend(card);
  closeSheet('offerSheet');
  event.currentTarget.reset();
  state.offerImage = '';
  state.offerImages = [];
  $('#offerImagePreview').innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM8 14l3-3 5 5M15 9h.01"/></svg>';
  $$('#offerImageGallery [data-photo-slot]').forEach((slot, index) => { slot.className = ''; slot.innerHTML = `${index + 1}<small>${index === 0 ? 'Principale' : index === 3 ? 'Optionnelle' : 'Autre vue'}</small>`; });
  $('#offerPhotoHelp').textContent = 'Ajoutez au moins 2 photos pour aider l\'utilisateur à vérifier le produit.';
  updateOfferFeePreview();
  setOfferStep(1);
  toast('Offre enregistrée', 'Elle reste en attente de contrôle avant publication.');
});

$('#providerOfferList').addEventListener('click', event => {
  const card = event.target.closest('.management-card');
  if (!card) return;

  // Suspendre / Réactiver
  const toggleBtn = event.target.closest('.offer-toggle');
  if (toggleBtn) {
    const suspended = toggleBtn.dataset.state === 'suspended';
    toggleBtn.dataset.state = suspended ? 'active' : 'suspended';
    toggleBtn.textContent = suspended ? 'Suspendre' : 'Réactiver';
    const badge = $('.entity-state', card);
    badge.textContent = suspended ? 'Publiée' : 'Suspendue';
    badge.className = `entity-state ${suspended ? 'active' : 'suspended'}`;
    toast(suspended ? 'Offre réactivée' : 'Offre suspendue', suspended ? 'Elle redevient visible dans le catalogue.' : 'Elle n\'est plus sélectionnable par les utilisateurs.');
    return;
  }

  // Modifier — pré-remplir le formulaire
  const editBtn = event.target.closest('.offer-edit');
  if (editBtn) {
    const name  = $('strong', card)?.textContent?.trim() || '';
    const pText = $('p', card)?.textContent || '';
    const priceMatch = pText.match(/([\d\s]+)\s*FCFA/);
    const stockMatch = pText.match(/(\d+)\s*en\s*stock/);
    const imgSrc = $('img', card)?.src || '';

    $('#offerName').value  = name;
    if (priceMatch) { $('#offerPrice').value = priceMatch[1].replace(/\s/g, ''); updateOfferFeePreview(); }
    if (stockMatch) $('#offerStock').value = stockMatch[1];

    // Injecter l\'image existante pour passer la validation (min 2)
    state.offerImages = imgSrc ? [imgSrc, imgSrc] : [];
    state.offerImage  = imgSrc;
    if (imgSrc) {
      $('#offerImagePreview').innerHTML = `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:8px" alt="">`;
      $('#offerPhotoHelp').textContent = '2 photos chargées. Vous pouvez en ajouter d\'autres.';
    }

    const h2 = $('#offerSheet h2');
    if (h2) h2.textContent = 'Modifier l\'offre';
    setOfferStep(1);
    requireKyc('offerPublication', () => openSheet('offerSheet'));
    return;
  }

  // Supprimer
  const deleteBtn = event.target.closest('.offer-delete');
  if (deleteBtn) {
    const name = $('strong', card)?.textContent || 'cette offre';
    if (confirm(`Supprimer « ${name} » ? Cette action est irréversible dans le prototype.`)) {
      card.remove();
      toast('Offre supprimée', `« ${name} » a été retirée du catalogue.`);
    }
  }
});

function bindSearch(inputSelector, itemSelector) {
  $(inputSelector).addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase();
    $$(itemSelector).forEach(item => item.classList.toggle('hidden', query && !(item.dataset.search || item.textContent.toLowerCase()).includes(query)));
  });
}
bindSearch('#providerOfferSearch', '#providerOfferList .management-card');
bindSearch('#adminUserSearch', '#adminUserList .management-card');

$$('[data-order-filter]').forEach(button => button.addEventListener('click', () => {
  $$('[data-order-filter]').forEach(item => item.classList.toggle('active', item === button));
  const wanted = button.dataset.orderFilter;
  $$('[data-order-status]').forEach(card => card.classList.toggle('hidden', wanted !== 'all' && card.dataset.orderStatus !== wanted));
}));

// BUG-02 — Clic sur une carte commande → sheet de détail
document.querySelector('.workflow-list') && document.querySelector('.workflow-list').addEventListener('click', event => {
  if (event.target.closest('button')) return; // ignorer les boutons d\'action
  const card = event.target.closest('.workflow-card');
  if (!card) return;

  const ref    = card.querySelector('.workflow-top span')?.textContent || '#TF-????';
  const name   = card.querySelector('h2')?.textContent || 'Produit';
  const meta   = card.querySelector('p')?.textContent || '';
  const parts  = meta.split(' · ');
  const client = parts[0] || 'Client';
  const city   = parts.slice(1).join(' · ') || '';
  const deliv  = card.querySelector('small')?.textContent || '—';
  const stepsOn = card.querySelectorAll('.mini-steps i.on').length;

  $('#orderDetailRef').textContent    = ref;
  $('#orderDetailName').textContent   = name;
  $('#orderDetailAvatar').textContent = client.trim().charAt(0).toUpperCase();
  $('#orderDetailClient').textContent = client;
  $('#orderDetailCity').textContent   = city;
  $('#orderDetailDelivery').textContent = deliv;

  // Mettre à jour les étapes visuelles
  ['orderStep2', 'orderStep3', 'orderStep4'].forEach((id, i) => {
    const done = stepsOn > i + 1;
    document.getElementById(id + 'Icon').textContent = done ? '✓' : '◎';
    document.getElementById(id).classList.toggle('done', done);
  });

  // Copier le bouton d\'avancement dans le sheet
  const advBtn = card.querySelector('.order-advance, .inline-actions button:last-child');
  const sheetBtn = $('#orderDetailAdvance');
  if (advBtn && sheetBtn) {
    sheetBtn.textContent = advBtn.textContent;
    sheetBtn.onclick = () => { advBtn.click(); closeSheet('orderDetailSheet'); };
  } else if (sheetBtn) {
    sheetBtn.textContent = 'Déjà à jour';
    sheetBtn.onclick = null;
  }

  openSheet('orderDetailSheet');
});

$$('.order-advance').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.workflow-card');
  const label = button.dataset.next;
  const badge = $('.workflow-top b', card);
  badge.textContent = label;
  badge.classList.add('green');
  const nextStep = $('.mini-steps i:not(.on)', card);
  if (nextStep) nextStep.classList.add('on');
  button.textContent = label === 'Préparation' ? 'Marquer comme expédiée' : 'Confirmer la livraison';
  button.dataset.next = label === 'Préparation' ? 'Expédiée' : 'Livrée';
  toast(`Commande ${label.toLowerCase()}`, 'L\'utilisateur et l\'administrateur ont été notifiés.');
}));

$$('.order-unavailable').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.workflow-card');
  $('.workflow-top b', card).textContent = 'Indisponible';
  $('.workflow-top b', card).classList.add('red');
  toast('Indisponibilité signalée', 'Une alternative sera proposée à l\'utilisateur.', 'error');
}));

$$('.account-status').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.management-card');
  const badge = $('.entity-state', card);
  state.pendingAccountCard = card;
  $('#accountActionName').textContent = button.dataset.account || $('strong', card).textContent;
  $('#accountActionType').value = badge.classList.contains('suspended') ? 'reactivate' : 'suspend';
  $('#accountActionDetails').value = '';
  $('#suspensionFields').classList.toggle('hidden', $('#accountActionType').value === 'reactivate');
  $('#accountActionDetails').required = $('#accountActionType').value !== 'reactivate';
  openSheet('accountActionSheet');
}));

$('#accountActionType').addEventListener('change', event => {
  const active = event.target.value !== 'reactivate';
  $('#suspensionFields').classList.toggle('hidden', !active);
  $('#accountActionDetails').required = active;
  $('#accountNotificationPreview').textContent = active ? 'Votre compte sera temporairement suspendu. La raison, la durée et les étapes de régularisation seront indiquées dans cette notification.' : 'Votre compte sera réactivé. Vous retrouverez l\'accès aux fonctionnalités qui étaient temporairement limitées.';
});

$('#accountActionForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity() || !state.pendingAccountCard) return;
  const card = state.pendingAccountCard;
  const type = $('#accountActionType').value;
  const badge = $('.entity-state', card);
  const button = $('.account-status', card);
  const reactivated = type === 'reactivate';
  badge.textContent = reactivated ? 'Actif' : type === 'restrict' ? 'Restreint' : 'Suspendu';
  badge.className = `entity-state ${reactivated ? 'active' : 'suspended'}`;
  button.textContent = reactivated ? 'Gérer' : 'Réexaminer';
  closeSheet('accountActionSheet');
  state.pendingAccountCard = null;
  toast(reactivated ? 'Compte réactivé' : 'Décision enregistrée', reactivated ? 'L\'utilisateur a retrouvé son accès.' : 'Le motif, la durée, l\'auteur et la notification ont été journalisés.');
});

function openSupplierDecision(button, defaultDecision = 'approve') {
  const card = button.closest('.review-card');
  state.pendingSupplierCard = card;
  $('#supplierDecisionName').textContent = button.dataset.supplier || card.dataset.supplier || 'Fournisseur';
  const option = $(`input[name="supplierDecision"][value="${defaultDecision}"]`);
  option.checked = true;
  updateSupplierDecisionForm();
  openSheet('supplierDecisionSheet');
}

function updateSupplierDecisionForm() {
  const decision = $('input[name="supplierDecision"]:checked').value;
  const details = $('#supplierDecisionDetails');
  details.classList.toggle('hidden', decision === 'approve');
  $('#supplierDecisionMessage').required = decision !== 'approve';
  $('#supplierDecisionSubmit').textContent = decision === 'approve' ? 'Valider le fournisseur' : decision === 'request' ? 'Envoyer la demande' : 'Confirmer le refus';
}

$$('input[name="supplierDecision"]').forEach(input => input.addEventListener('change', updateSupplierDecisionForm));
$$('.supplier-review').forEach(button => button.addEventListener('click', () => openSupplierDecision(button, 'approve')));

$$('.request-document').forEach(button => button.addEventListener('click', () => {
  openSupplierDecision(button, 'request');
}));

$('#supplierDecisionForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity() || !state.pendingSupplierCard) return;
  const decision = $('input[name="supplierDecision"]:checked').value;
  const card = state.pendingSupplierCard;
  const supplier = $('#supplierDecisionName').textContent;
  if (decision === 'approve') {
    card.innerHTML = '<div class="verified-line"><span>✓</span><div><strong>Fournisseur validé</strong><small>La boutique peut maintenant publier ses offres.</small></div></div>';
    toast('Fournisseur validé', `${supplier} a été notifié. La décision est journalisée.`);
  } else {
    const documents = $$('.document-choice-grid input:checked').map(input => input.value);
    const badge = $('.review-top b', card);
    if (badge) badge.textContent = decision === 'request' ? 'Complément demandé' : 'Dossier refusé';
    let followup = $('.supplier-decision-result', card);
    if (!followup) { followup = document.createElement('div'); followup.className = 'supplier-decision-result'; card.appendChild(followup); }
    followup.innerHTML = `<span>${decision === 'request' ? '↻' : '×'}</span><p><strong>${decision === 'request' ? 'Correction attendue' : 'Refus motivé'}</strong><small>${documents.length ? documents.join(', ') : $('#supplierDecisionReason').value} · délai ${$('#supplierDecisionDeadline').value}</small></p>`;
    toast(decision === 'request' ? 'Complément demandé' : 'Dossier refusé', `Le motif précis et les documents concernés ont été envoyés à ${supplier}.`, decision === 'reject' ? 'error' : 'success');
  }
  closeSheet('supplierDecisionSheet');
  state.pendingSupplierCard = null;
});

$('#providerReplyForm').addEventListener('submit', event => {
  event.preventDefault();
  closeSheet('providerReplySheet');
  toast('Réponse envoyée', 'L\'utilisateur et le support TrustFund ont été notifiés.');
});

$('#adminReplyForm').addEventListener('submit', event => {
  event.preventDefault();
  closeSheet('adminReplySheet');
  toast('Décision enregistrée', 'La réponse, le statut et l\'horodatage sont conservés.');
});

$$('[data-ticket-filter]').forEach(button => button.addEventListener('click', () => {
  $$('[data-ticket-filter]').forEach(item => item.classList.toggle('active', item === button));
  const wanted = button.dataset.ticketFilter;
  $$('[data-ticket-status]').forEach(card => card.classList.toggle('hidden', wanted !== 'all' && card.dataset.ticketStatus !== wanted));
}));

$$('.admin-ticket-open').forEach(button => button.addEventListener('click', () => {
  $('#adminTicketReference').textContent = button.dataset.ticket || '#REC-2048';
  openSheet('adminTicketSheet');
}));

$('#adminTicketForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  closeSheet('adminTicketSheet');
  toast('Suivi enregistré', 'La réponse, le responsable, le statut, la priorité et les notifications sont tracés.');
});

$('#adminProfileForm').addEventListener('submit', event => {
  event.preventDefault();
  closeSheet('adminProfileSheet');
  toast('Profil administrateur mis à jour', 'Les coordonnées professionnelles ont été enregistrées.');
});

$('#providerBusinessForm').addEventListener('submit', event => {
  event.preventDefault();
  $('#providerNinea').dispatchEvent(new Event('input'));
  $('#providerRccm').dispatchEvent(new Event('input'));
  $$('[data-provider-document]').forEach(validateDocumentFile);
  if (!event.currentTarget.reportValidity()) {
    toast('Dossier incomplet', 'Ajoutez les quatre justificatifs et corrigez les champs signalés.', 'error');
    return;
  }
  closeSheet('providerBusinessSheet');
  toast('Dossier envoyé', 'Les quatre pièces sont en cours de contrôle. Vous serez averti si une pièce doit être remplacée.');
});

$$('.claim-escalate').forEach(button => button.addEventListener('click', () => {
  button.textContent = 'Escaladée ✓';
  button.disabled = true;
  toast('Réclamation escaladée', 'Le niveau de priorité et le motif ont été journalisés.');
}));

$('#adminSettingsForm').addEventListener('submit', event => {
  event.preventDefault();
  state.serviceFeeRate = Math.max(0, Math.min(10, Number($('#serviceFee').value) || 0));
  updateCatalogPrices();
  updateFeeCalculator();
  updateOfferFeePreview();
  toast('Paramètres enregistrés', `Frais ${state.serviceFeeRate}% appliqués aux nouveaux prix · tolérance ${$('#lateTolerance').value} jours. Anciennes valeurs conservées dans l\'audit.`);
});

function updateFeeCalculator() {
  const base = Number($('#feeExampleBase').value) || 0;
  $('#feeExampleSupplier').textContent = `${money(base)} FCFA`;
  $('#feeExampleFee').textContent = `${money(platformFee(base))} FCFA`;
  $('#feeExampleTotal').textContent = `${money(customerPrice(base))} FCFA`;
}

$('#serviceFee').addEventListener('input', () => {
  const previewRate = Number($('#serviceFee').value);
  const previous = state.serviceFeeRate;
  state.serviceFeeRate = Number.isFinite(previewRate) ? previewRate : 0;
  updateFeeCalculator();
  state.serviceFeeRate = previous;
});
$('#feeExampleBase').addEventListener('input', updateFeeCalculator);

$$('.report-period button').forEach(button => button.addEventListener('click', () => {
  $$('.report-period button').forEach(item => item.classList.toggle('active', item === button));
  toast('Période mise à jour', `Les indicateurs affichent maintenant : ${button.textContent.toLowerCase()}.`);
}));

$$('.export-report').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.export === 'pdf') {
    toast('Rapport PDF prêt', 'Le prototype simule la génération du rapport visuel avec chiffres, graphiques et frais.');
    return;
  }
  const csv = 'indicateur,valeur\nCotisations validées,8420000\nTaux de validation,91%\nObjectifs atteints,17\nRéclamations,3.8%\n';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = 'trustfund-rapport-pilote.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  toast('Rapport préparé', 'L\'export CSV respecte les données autorisées du prototype.');
}));

$('#applyAiPlan').addEventListener('click', event => {
  const currentDate = new Date(`${$('#goalDate').value}T12:00:00`);
  currentDate.setMonth(currentDate.getMonth() + 2);
  $('#goalDate').value = currentDate.toISOString().slice(0, 10);
  calculatePlan();
  event.currentTarget.textContent = 'Recommandation appliquée ✓';
  event.currentTarget.closest('.ai-plan-option').classList.add('applied');
  toast('Plan adapté', 'La date cible a été ajustée. Vous gardez la possibilité de revenir en arrière.');
});

$('.apply-ai-filter').addEventListener('click', event => {
  $('#catalogSearch').value = '';
  $$('.filter-chip').forEach(chip => chip.classList.toggle('active', chip.dataset.filter === 'all'));
  $$('.mobile-product').forEach(product => {
    const recommended = product.dataset.category === 'tech' || product.dataset.category === 'education';
    product.classList.toggle('hidden', !recommended);
    product.classList.toggle('ai-picked', recommended);
  });
  event.currentTarget.textContent = 'Sélection IA affichée ✓';
  toast('Sélection personnalisée', 'Les offres correspondent à votre budget et à vos objectifs actuels.');
});

function addCoachMessage(message, actor = 'ai') {
  const article = document.createElement('article');
  article.className = `coach-message ${actor}`;
  if (actor === 'ai') {
    const icon = document.createElement('span');
    icon.textContent = '✦';
    article.appendChild(icon);
  }
  const bubble = document.createElement('div');
  const paragraph = document.createElement('p');
  paragraph.textContent = message;
  bubble.appendChild(paragraph);
  article.appendChild(bubble);
  $('#coachChat').appendChild(article);
  $('#coachChat').scrollTop = $('#coachChat').scrollHeight;
}

function answerCoach(question) {
  const normalized = question.toLowerCase();
  const budgetMatch = normalized.match(/(\d[\d\s.]*)\s*(fcfa|franc)?/);
  if (normalized.includes('budget') && budgetMatch) {
    const budget = Number(budgetMatch[1].replace(/[\s.]/g, '')) || 25000;
    const remaining = Math.max(0, state.target - state.validated);
    const months = Math.max(1, Math.ceil(remaining / budget));
    return `Avec ${money(budget)} FCFA par mois, il vous reste environ ${months} mois pour l\'ordinateur. Je conseille de garder 20 000 FCFA dans l\'épargne disponible et de confirmer ce nouveau rythme avant de modifier votre objectif.`;
  }
  if (normalized.includes('prioris')) return 'Je prioriserais l\'ordinateur : il est déjà à 62 % et proche de son prochain palier. Gardez la formation à 15 000 FCFA par mois et finalisez d\'abord la machine à coudre, déjà atteinte. Vous pouvez accepter ou ignorer ce conseil.';
  if (normalized.includes('alléger') || normalized.includes('cotisation')) return 'Je vous propose de décaler la date cible de deux mois. La cotisation estimée passerait d\'environ 38 000 à 29 000 FCFA par mois, avec un risque d\'abandon plus faible.';
  if (normalized.includes('rappel') || normalized.includes('quand')) return 'Votre meilleur créneau observé est le vendredi entre 18 h et 20 h. Je peux préparer un rappel SMS à ce moment, trois jours avant l\'échéance.';
  if (normalized.includes('produit') || normalized.includes('offre')) return `Deux offres correspondent à votre profil : le Lenovo IdeaPad à ${money(customerPrice(425000))} FCFA, dont ${money(platformFee(425000))} FCFA de frais TrustFund, et la formation design à ${money(customerPrice(250000))} FCFA. Les montants totaux sont affichés avant votre décision.`;
  if (normalized.includes('risque') || normalized.includes('abandon')) return 'Votre risque estimé est faible, à 18 %. Les facteurs favorables sont quatre mois réguliers et trois échéances respectées sur quatre.';
  return 'Je peux vous aider à ajuster le montant, la date, le rappel ou à trouver une offre adaptée. Dites-moi ce qui est le plus difficile en ce moment.';
}

$('#coachForm').addEventListener('submit', event => {
  event.preventDefault();
  const question = $('#coachInput').value.trim();
  if (!question) return;
  addCoachMessage(question, 'user');
  $('#coachInput').value = '';
  setTimeout(() => addCoachMessage(answerCoach(question)), 350);
});

$$('[data-coach-prompt]').forEach(button => button.addEventListener('click', () => {
  $('#coachInput').value = button.dataset.coachPrompt;
  $('#coachForm').requestSubmit();
}));

$$('.anomaly-clear').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.anomaly-card');
  card.classList.add('resolved');
  $('.anomaly-top span', card).textContent = 'Conforme';
  button.closest('.inline-actions').remove();
  toast('Alerte classée', 'La décision humaine a été ajoutée au journal d\'audit.');
}));

$$('.anomaly-investigate').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.anomaly-card');
  $('.anomaly-top span', card).textContent = 'En investigation';
  button.textContent = 'Dossier ouvert ✓';
  button.disabled = true;
  toast('Investigation ouverte', 'La cotisation reste en attente. Aucune décision automatique n\'a été prise.');
}));

setGoalStep(1);
setSignupRole('user');
setSignupStep(1);
updateProgress();
updateCatalogPrices();
updateFeeCalculator();
updateOfferFeePreview();

setTimeout(() => {
  if ($('#auth-splash').classList.contains('active')) showAuth('welcome');
}, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 350 : 1900);
