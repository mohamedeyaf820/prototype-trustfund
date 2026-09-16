'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const fail = [];
for (const id of ['kycReason', 'goalSheet', 'offerSheet', 'paymentSheet', 'withdrawSheet']) {
  if (!html.includes('id="' + id + '"')) fail.push('html sans #' + id);
}
for (const token of [
  'sensitiveOperations',
  "requireKyc('freePayment'",
  "requireKyc('goalPayment'",
  "requireKyc('withdraw'",
  'requireGoalVerification',
  "requireKyc('offerPublication'",
  'pendingFinancialAction'
]) {
  if (!js.includes(token)) fail.push('app.js sans ' + token);
}
if (fail.length) {
  console.error(fail.join('\n'));
  process.exit(1);
}
console.log('portes sensibles OK');
