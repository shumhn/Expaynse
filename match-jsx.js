const fs = require('fs');
const content = fs.readFileSync('app/disburse/disburse-page-content.tsx', 'utf8');

const tags = [];
const regex = /<\/?([a-zA-Z0-9_]+)(>| [^>]*>)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const isClosing = match[0].startsWith('</');
  const isSelfClosing = match[0].endsWith('/>') || match[0].endsWith('/> ');
  const tagName = match[1];

  if (!isClosing && !isSelfClosing) {
    if (tagName !== 'br' && tagName !== 'hr' && tagName !== 'img' && tagName !== 'input') {
      tags.push({ tag: tagName, index: match.index });
    }
  } else if (isClosing) {
    const last = tags.pop();
    if (!last || last.tag !== tagName) {
      console.log(`Mismatched JSX tag: found </${tagName}> but expected </${last ? last.tag : 'NONE'}> at index ${match.index}`);
      process.exit(1);
    }
  }
}
if (tags.length > 0) {
  console.log("Unclosed JSX tags:");
  console.log(tags.slice(-5));
} else {
  console.log("All JSX tags matched!");
}
