const fs = require('fs');

const path = 'src/pages/Partidos.jsx';
let content = fs.readFileSync(path, 'utf8');

const formationsRegex = /const FORMATIONS = (\{[\s\S]*?\n\});\s*const Partidos/;
const match = content.match(formationsRegex);

if (match) {
  let formationsStr = match[1];
  
  // Transform each { pos: '...', top: '...', left: '...' }
  formationsStr = formationsStr.replace(/\{ pos: '([^']+)', top: '([^']+)', left: '([^']+)' \}/g, (match, pos, topStr, leftStr) => {
    let oldTop = parseFloat(topStr);
    let oldLeft = leftStr;
    
    let newLeft = `${100 - oldTop}%`;
    let newTop = oldLeft; // already has %
    
    return `{ pos: '${pos}', top: '${newTop}', left: '${newLeft}' }`;
  });

  content = content.replace(formationsRegex, `const FORMATIONS = ${formationsStr};\n\nconst Partidos`);
  fs.writeFileSync(path, content);
  console.log('Formations updated successfully');
} else {
  console.log('Could not find FORMATIONS');
}
