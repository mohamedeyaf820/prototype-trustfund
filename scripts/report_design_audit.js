'use strict';
/**
 * TrustFund - rapport lisible de l audit du design system.
 *
 * Usage : node scripts/report_design_audit.js
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(path.resolve(__dirname, '..'), 'tmp', 'audit-design-system', 'audit.json');
if (!fs.existsSync(FILE)) {
  console.error('Rapport introuvable. Lancez node scripts/audit_design_system.js');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const states = data.states;
const report = data.report;
const tally = (items) => {
  const map = new Map();
  items.forEach((item) => {
    const entry = map.get(item.sel) || { count: 0, info: item };
    entry.count += 1;
    map.set(item.sel, entry);
  });
  return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
};

console.log('etats=' + states.length + ' fenetres=' + report.viewports.join(',') + ' seuils=' + JSON.stringify(report.thresholds) + ' erreursConsole=' + report.consoleErrors.length);
console.log('\n== CADRE GENERAL ==');
report.distinctScreenPaddings.forEach((value) => console.log('  padding ecran : ' + value));
console.log('\n== PANNEAUX BAS ==');
report.distinctSheetGeometry.forEach((value) => console.log('  geometrie : ' + value));
report.overflowOrClipping.filter((item) => item.scope).forEach((item) => console.log('  DEBORDEMENT INTERNE : ' + item.label));
console.log('\n== DEBORDEMENTS / ROQUAGE ==');
report.overflowOrClipping.forEach((item) => {
  console.log('  ' + item.label + ' page=' + item.page + ' shell=' + item.shell + ' scope=' + item.scope + ' rogne=' + item.clipped.length + ' coach=' + item.coachMissing);
  item.clipped.slice(0, 4).forEach((c) => console.log('      ' + c.sel + ' L' + c.left + ' R' + c.right));
});
console.log('\n== TEXTES SOUS ' + report.thresholds.textMin + 'px : ' + report.textViolations.length + ' etats ==');
tally(report.textViolations.flatMap((state) => state.samples)).slice(0, 40).forEach(([sel, entry]) => console.log('  ' + entry.count + 'x ' + sel + ' [' + entry.info.size + 'px] ' + entry.info.text));
console.log('\n== CADRES IMBRIQUES : ' + report.nestedFrames.length + ' etats ==');
tally(report.nestedFrames.flatMap((state) => state.samples)).slice(0, 30).forEach(([sel, entry]) => console.log('  ' + entry.count + 'x ' + sel + ' profondeur ' + entry.info.depth));
console.log('\n== BOUTONS ==');
const byHeight = new Map();
states.forEach((state) => (state.buttons || []).forEach((row) => {
  const entry = byHeight.get(row.h) || { count: 0, sample: row };
  entry.count += 1;
  byHeight.set(row.h, entry);
}));
Array.from(byHeight.entries()).sort((a, b) => a[0] - b[0]).forEach(([height, entry]) => console.log('  ' + height + 'px : ' + entry.count + ' controles (ex. ' + entry.sample.sel + ' | ' + entry.sample.text + ')'));
const primaries = states.flatMap((state) => (state.buttons || []).filter((row) => new RegExp(report.thresholds.buttonPrimaryMin === 48 ? 'main-button|auth-primary|login-submit' : 'main-button').test(row.cls || '')));
const heights = Array.from(new Set(primaries.map((row) => row.h))).sort((a, b) => a - b);
console.log('  hauteurs des boutons principaux : ' + heights.join(', '));