const fs = require('fs');
const content = fs.readFileSync('app/disburse/disburse-page-content.tsx', 'utf8');

let depth = 0;
let parens = 0;
let curlies = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < content.length; i++) {
  const c = content[i];
  if (c === '\n') {
    // skip
  }
}
// Actually let's just use babel to parse it and get a better error!
