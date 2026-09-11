const fs = require('fs');
let src = fs.readFileSync('C:/Users/moham/OneDrive/Documents/Trustfund/app.js', 'utf8');

let result = '';
let i = 0;
let inString = false;
let strChar = '';

while (i < src.length) {
  const c = src[i];

  if (!inString) {
    if (c === "'" || c === '"' || c === '`') {
      inString = true;
      strChar = c;
      result += c;
      i++;
    } else {
      result += c;
      i++;
    }
  } else {
    if (c === '\\') {
      // Backslash escape - copier 2 chars
      result += c + (src[i+1] || '');
      i += 2;
    } else if (c === strChar) {
      // Fin de string
      inString = false;
      strChar = '';
      result += c;
      i++;
    } else if (strChar === "'" && c === "'") {
      // Apostrophe droite à l'intérieur d'une string délimitée par '
      const prev = i > 0 ? src[i-1] : '';
      const next = i < src.length-1 ? src[i+1] : '';
      const isLetter = ch => /[a-zA-Z\u00C0-\u00FF]/.test(ch);

      if (isLetter(prev) && isLetter(next)) {
        // Apostrophe de contraction → échapper
        result += "\\'";
      } else {
        // Fin de string
        inString = false;
        strChar = '';
        result += c;
      }
      i++;
    } else {
      result += c;
      i++;
    }
  }
}

fs.writeFileSync('C:/Users/moham/OneDrive/Documents/Trustfund/app.js', result, 'utf8');
console.log('Done. Length:', result.length);
