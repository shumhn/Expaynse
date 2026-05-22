const fs = require('fs');
const code = fs.readFileSync('app/disburse/disburse-page-content.tsx', 'utf8');

let line = 1;
let col = 1;
const stack = [];
let inString = false;
let stringChar = '';
let inComment = false;
let inLineComment = false;
let inJsx = false;

for (let i = 0; i < code.length; i++) {
  const c = code[i];
  const next = code[i + 1];

  if (c === '\n') {
    line++;
    col = 1;
    inLineComment = false;
    continue;
  }
  
  if (inLineComment) continue;

  if (inComment) {
    if (c === '*' && next === '/') {
      inComment = false;
      i++;
    }
    continue;
  }

  if (inString) {
    if (c === '\\') { i++; col++; continue; }
    if (c === stringChar) inString = false;
    col++;
    continue;
  }

  if (c === '/' && next === '/') {
    inLineComment = true;
    i++;
    continue;
  }
  if (c === '/' && next === '*') {
    inComment = true;
    i++;
    continue;
  }

  if (c === '"' || c === "'" || c === '`') {
    inString = true;
    stringChar = c;
    col++;
    continue;
  }

  if (c === '(' || c === '{' || c === '[') {
    stack.push({ char: c, line, col });
  } else if (c === ')' || c === '}' || c === ']') {
    const last = stack.pop();
    if (!last) {
      console.log(`Unmatched ${c} at line ${line}, col ${col}`);
      process.exit(1);
    }
    const match = { ')': '(', '}': '{', ']': '[' };
    if (last.char !== match[c]) {
      console.log(`Mismatched ${c} at line ${line}, col ${col} (expected to close ${last.char} from line ${last.line})`);
      process.exit(1);
    }
  }
  col++;
}

if (stack.length > 0) {
  console.log("Unclosed brackets:");
  console.log(stack.slice(-5));
} else {
  console.log("All brackets matched!");
}
