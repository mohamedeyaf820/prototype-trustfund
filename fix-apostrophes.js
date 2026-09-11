const fs = require('fs');
let src = fs.readFileSync('C:/Users/moham/OneDrive/Documents/Trustfund/app.js', 'utf8');

// Remplacer toutes les apostrophes françaises de contraction (lettre + ' + lettre)
// par la version échappée : lettre + \' + lettre
// La regex remplace en gardant les deux lettres capturées et en ajoutant \'
const re = /([a-zA-Z\u00C0-\u00FF])'([a-zA-Z\u00C0-\u00FF])/g;

// Compter les occurrences
const matches = [...src.matchAll(re)];
console.log('Matches found:', matches.length);

// Remplacer - en JS, dans le replacement string, $ est spécial mais \ ne l'est pas
// "$1\\'$2" = capture1 + backslash + apostrophe + capture2
// Sauf que... JSON.stringify confirme :
const test = "d'Ivoire".replace(/([a-zA-Z])'([a-zA-Z])/, function(match, g1, g2) {
  return g1 + "\\'" + g2;
});
console.log('Test replace result:', JSON.stringify(test)); // Should be "d\\'Ivoire"

// Apply to full file
const fixed = src.replace(re, function(match, g1, g2) {
  return g1 + "\\'" + g2;
});

console.log('Changes:', fixed.length - src.length, 'chars added');
fs.writeFileSync('C:/Users/moham/OneDrive/Documents/Trustfund/app.js', fixed, 'utf8');
console.log('Saved');
