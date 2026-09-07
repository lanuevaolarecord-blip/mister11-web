const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!p.includes('node_modules') && !p.includes('.git') && !p.includes('dist')) {
        res = res.concat(walk(p));
      }
    } else if (f.endsWith('.jsx')) {
      res.push(p);
    }
  }
  return res;
}

const files = walk('src');

const checks = [
  { name: 'Buttons', regex: /<button[^>]*>[^<]*(?:Guardar|Cancelar|Eliminar|Editar|Añadir|Cerrar|Confirmar|Volver|Exportar|Buscar|Filtrar|Copiar|Compartir|Iniciar|Descargar|Ver|Crear)[^<]*<\/button>/i },
  { name: 'Headings', regex: /<h[1-6][^>]*>[^<]*(?:Estructura|Rutinas|Cuerpo Técnico|Código|Días|Planificación|Detalles|Perfil|Historial|Información)[^<]*<\/h[1-6]>/i },
  { name: 'Placeholders', regex: /placeholder=["'](?:Buscar|Escribe|Seleccionar|Ej\.|Ingresa)[^"']*["']/i },
  { name: 'Aria labels', regex: /aria-label=["'](?:Cerrar|Eliminar|Editar|Buscar|Abrir|Cambiar|Volver)[^"']*["']/i }
];

console.log('--- EXHAUSTIVE UI AUDIT ---');
let total = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('//') && !line.includes('<')) return;
    for (const check of checks) {
      if (check.regex.test(line) && !line.includes('t(')) {
        console.log(`[${check.name}] ${file}:${idx + 1}: ${line.trim()}`);
        total++;
        break;
      }
    }
  });
}
console.log(`TOTAL FOUND: ${total}`);
