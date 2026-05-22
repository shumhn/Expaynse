const fs = require('fs');
const lines = fs.readFileSync('app/disburse/disburse-page-content.tsx', 'utf8').split('\n');

let depth = 0;
for (let i = 3582; i < 4185; i++) {
  const line = lines[i];
  // Count self-closing divs (they don't affect depth)
  const selfClose = (line.match(/<div[^>]*\/>/g) || []).length;
  // Count opening divs (includes self-closing, so subtract)
  const opens = (line.match(/<div/g) || []).length - selfClose;
  // Count closing divs
  const closes = (line.match(/<\/div>/g) || []).length;
  
  const prevDepth = depth;
  depth += opens - closes;
  
  if (opens > 0 || closes > 0) {
    console.log(`L${i+1}: depth ${prevDepth} -> ${depth}  (opens=${opens}, closes=${closes}, selfClose=${selfClose}) ${line.trim().substring(0, 80)}`);
  }
  
  if (depth < 0) {
    console.log(`!!! NEGATIVE DEPTH at line ${i+1} !!!`);
    break;
  }
}
console.log(`Final depth: ${depth}`);
