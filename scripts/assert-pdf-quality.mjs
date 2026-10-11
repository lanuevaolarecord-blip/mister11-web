/**
 * scripts/assert-pdf-quality.mjs
 * Míster11 — Test de Calidad de PDF (PDF-Q)
 * 
 * Valida:
 * 1. Footer canónico en pdfTheme.js:
 *    - Ausencia del glifo bullet que causa el salto de espaciado 'mister11.a pp' -> 'mister11.app'
 *    - Sustitución de 'Página' con diacrítico por 'Pagina' para evitar 'Pá g ina' en Helvetica
 * 2. Resolución nativa y precedencia de 2 capas:
 *    - Prioridad estricta de fullDataUrl y boardCaptureUrl sobre thumbnails en preloadSessionImages
 *    - Inserción en PNG nativo sin compresión destructiva JPEG en diagramas y capturas
 * 3. Simulación funcional de renderizado con jsPDF verificando footer y textos limpios.
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('==============================================================================');
console.log('MÍSTER 11 — ASSERT PDF QUALITY (OLEADA 4: RESOLUCIÓN NATIVA + FOOTER LIMPIO)');
console.log('==============================================================================\n');

let passCount = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`  ✅ ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}:`, err.message);
    process.exit(1);
  }
}

// ── 1. AUDITORÍA DE FOOTER EN pdfTheme.js ─────────────────────────────────────
console.log('▶ [1/4] Auditando footer institucional en pdfTheme.js contra espaciado roto...');
const pdfThemePath = path.join(rootDir, 'src', 'utils', 'pdfTheme.js');
const pdfThemeCode = fs.readFileSync(pdfThemePath, 'utf8');

check('pdfTheme.js usa "Mister11 Platform - mister11.app" (sin bullet que rompe espaciado)', () => {
  assert.ok(pdfThemeCode.includes("doc.text('Mister11 Platform - mister11.app'"), 'Debe usar guión plano para mister11.app');
  assert.ok(!pdfThemeCode.includes("'Míster11 Platform • mister11.app'"), 'No debe contener el bullet que genera mister11.a pp');
});

check('pdfTheme.js usa "Pagina" sin tilde para evitar espaciado roto en Helvetica (Pá g ina -> Pagina)', () => {
  assert.ok(pdfThemeCode.includes('`Pagina ${cur} de ${total}`'), 'Debe usar Pagina sin tilde en drawPdfFooter');
  assert.ok(!pdfThemeCode.includes('`Página ${currentPage} de ${totalPages}`'), 'No debe contener Página que genera Pá g ina');
});

check('drawPdfFooter maneja polimorfismo de argumentos con opciones', () => {
  assert.ok(pdfThemeCode.includes("typeof pageW === 'object'"), 'Debe soportar paso de objeto en lugar de números');
});

// ── 2. AUDITORÍA DE PRECEDENCIA DE RESOLUCIÓN NATIVA EN pdfGenerator.js ───────
console.log('\n▶ [2/4] Auditando precedencia de resolución nativa (2 capas) en pdfGenerator.js...');
const pdfGenPath = path.join(rootDir, 'src', 'utils', 'pdfGenerator.js');
const pdfGenCode = fs.readFileSync(pdfGenPath, 'utf8');

check('preloadSessionImages prioriza fullDataUrl y boardCaptureUrl sobre thumbnail para diagrama principal', () => {
  const match = pdfGenCode.match(/const rawMainDiagram\s*=\s*([^;]+);/);
  assert.ok(match, 'Debe existir rawMainDiagram');
  const expr = match[1];
  const idxFull = expr.indexOf('session.fullDataUrl');
  const idxThumb = expr.indexOf('session.thumbnail');
  assert.ok(idxFull !== -1, 'fullDataUrl debe estar en la expresión');
  assert.ok(idxThumb !== -1, 'thumbnail debe estar en la expresión');
  assert.ok(idxFull < idxThumb, 'fullDataUrl debe evaluarse ANTES que thumbnail');
});

check('preloadSessionImages prioriza fullDataUrl y boardCaptureUrl sobre thumbnail en bloques', () => {
  const match = pdfGenCode.match(/let rawImg\s*=\s*([^;]+);/);
  assert.ok(match, 'Debe existir rawImg');
  const expr = match[1];
  const idxFull = expr.indexOf('b.fullDataUrl');
  const idxThumb = expr.indexOf('b.thumbnail');
  assert.ok(idxFull !== -1 && idxThumb !== -1, 'fullDataUrl y thumbnail deben estar en la expresión');
  assert.ok(idxFull < idxThumb, 'b.fullDataUrl debe evaluarse ANTES que b.thumbnail');
});

check('Inserción de diagrama principal usa PNG nativo sin compresión destructiva', () => {
  assert.ok(pdfGenCode.includes("!sessionDiagramBase64.includes('png')"), 'Debe dar precedencia a PNG si no es estrictamente JPEG');
});

check('Inserción de capturas de pizarra usa PNG nativo', () => {
  assert.ok(pdfGenCode.includes("!b64.includes('png')"), 'Capturas deben priorizar PNG');
});

check('generatePizarraPDF usa PNG nativo para diagramas tácticos', () => {
  assert.ok(pdfGenCode.includes("!imgData.includes('png')"), 'generatePizarraPDF debe priorizar PNG');
});

// ── 3. AUDITORÍA DE OTROS GENERADORES DE REPORTES ─────────────────────────────
console.log('\n▶ [3/4] Auditando reportes adicionales contra footer roto...');
const indReportPath = path.join(rootDir, 'src', 'utils', 'individualPerformancePdfReport.js');
const indCode = fs.readFileSync(indReportPath, 'utf8');

check('individualPerformancePdfReport.js usa "mister11.app" y "Pagina" sin caracteres rotos', () => {
  assert.ok(indCode.includes("mister11.app - Rendimiento Individual Verificable"), 'Debe usar guión limpio para mister11.app');
  assert.ok(indCode.includes("`Pagina ${pageNumber} de ${totalPages}`"), 'Debe usar Pagina sin tilde');
  assert.ok(!indCode.includes("• mister11.app •"), 'No debe tener bullets que rompen espaciado');
});

const anaReportPath = path.join(rootDir, 'src', 'utils', 'analysisPdfReport.js');
const anaCode = fs.readFileSync(anaReportPath, 'utf8');

check('analysisPdfReport.js usa "Pagina" sin tilde en el pie de página', () => {
  assert.ok(anaCode.includes("`Pagina ${p} de ${totalPages}`"), 'Debe usar Pagina sin tilde');
});

// ── 4. SIMULACIÓN FUNCIONAL CON jsPDF EN MEMORIA ──────────────────────────────
console.log('\n▶ [4/4] Probando simulación funcional de generación con jsPDF...');

import { jsPDF } from 'jspdf';
import { drawPdfFooter } from '../src/utils/pdfTheme.js';

check('drawPdfFooter dibuja en jsPDF y genera texto continuo sin romper "mister11.app" ni "Pagina"', () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawPdfFooter(doc, 210, 297, 1, 3);
  
  // Extraer texto generado
  const output = doc.output();
  assert.ok(output.includes('mister11.app'), 'El PDF debe contener mister11.app continuo');
  assert.ok(output.includes('Pagina 1 de 3'), 'El PDF debe contener Pagina 1 de 3');
  assert.ok(!output.includes('mister11.a pp'), 'El PDF NO debe contener "mister11.a pp"');
  assert.ok(!output.includes('Pá g ina'), 'El PDF NO debe contener "Pá g ina"');
});

check('drawPdfFooter pagina correctamente en un documento de 4 páginas (Pagina 1 de 4 ... 4 de 4)', () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  for (let i = 2; i <= 4; i++) {
    doc.addPage();
  }
  const totalPages = doc.internal.getNumberOfPages();
  assert.strictEqual(totalPages, 4, 'El documento debe tener 4 páginas');

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Probamos llamada estándar
    drawPdfFooter(doc, 210, 297, i, totalPages);
  }

  const output = doc.output();
  assert.ok(output.includes('Pagina 1 de 4'), 'Debe contener Pagina 1 de 4');
  assert.ok(output.includes('Pagina 2 de 4'), 'Debe contener Pagina 2 de 4');
  assert.ok(output.includes('Pagina 3 de 4'), 'Debe contener Pagina 3 de 4');
  assert.ok(output.includes('Pagina 4 de 4'), 'Debe contener Pagina 4 de 4');
});

check('drawPdfFooter con objeto polimórfico preserva totalPages si se provee y no colapsa a total = cur', () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.addPage();
  doc.setPage(1);
  drawPdfFooter(doc, { currentPage: 1, totalPages: 4 });
  const output = doc.output();
  assert.ok(output.includes('Pagina 1 de 4'), 'Debe soportar { currentPage: 1, totalPages: 4 } sin colapsar a 1 de 1');
});

// ── 5. AUDITORÍA DE TEXTO DEL CUERPO (OBJETIVO Y MEJORAR SIN HUECOS) ──────────
console.log('\n▶ [5/5] Probando corrección de kerning y transliteración de cuerpo ("Objetivo" y "Mejorar")...');

import { cleanPdfText } from '../src/utils/pdfTheme.js';

check('cleanPdfText elimina espacios partidos en "Obj etivo" -> "Objetivo" y "Mej orar" -> "Mejorar"', () => {
  const input = 'Obj etivo principal de la sesión: Mej orar la presión alta tras pérdida. Obj etivos secundarios.';
  const cleaned = cleanPdfText(input);
  assert.strictEqual(cleaned, 'Objetivo principal de la sesión: Mejorar la presión alta tras pérdida. Objetivos secundarios.');
  assert.ok(!cleaned.includes('Obj etivo'), 'No debe contener "Obj etivo"');
  assert.ok(!cleaned.includes('Mej orar'), 'No debe contener "Mej orar"');
});

check('jsPDF cuerpo no contiene huecos de kerning en Objetivo ni Mejorar al renderizar texto saneado', () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const textRaw = 'Obj etivo: Mej orar el repliegue defensivo.';
  const textClean = cleanPdfText(textRaw);
  doc.text(textClean, 14, 40);
  const output = doc.output();
  assert.ok(output.includes('Objetivo'), 'El PDF debe contener "Objetivo" continuo');
  assert.ok(output.includes('Mejorar'), 'El PDF debe contener "Mejorar" continuo');
  assert.ok(!output.includes('Obj etivo'), 'El PDF no debe contener "Obj etivo"');
  assert.ok(!output.includes('Mej orar'), 'El PDF no debe contener "Mej orar"');
});

// ── 6. AUDITORÍA DE MARCA CANÓNICA SIN TILDE EN HEADERS Y FOOTERS ─────────────
console.log('\n▶ [6/7] Auditando marca canónica MISTER11 / Mister11 sin tilde en generadores...');

check('addHeader en pdfGenerator.js usa marca canónica MISTER11 sin tilde', () => {
  assert.ok(pdfGenCode.includes("doc.text('MISTER11', 36, 16);"), 'Debe usar MISTER11 sin tilde con logo');
  assert.ok(pdfGenCode.includes("doc.text('MISTER11', 14, 18);"), 'Debe usar MISTER11 sin tilde sin logo');
  assert.ok(!pdfGenCode.includes("doc.text('MÍSTER11'"), 'No debe contener MÍSTER11 con tilde');
});

check('drawPdfHeader en pdfTheme.js usa marca canónica MISTER11 sin tilde', () => {
  assert.ok(pdfThemeCode.includes('MISTER11 —'), 'Debe usar MISTER11 sin tilde en el header unificado');
  assert.ok(!pdfThemeCode.includes('MÍSTER 11 —'), 'No debe contener MÍSTER 11 con tilde');
});

// ── 7. AUDITORÍA FUNCIONAL DE SESIÓN EN 4 IDIOMAS (CARRILES A, B, C) ──────────
console.log('\n▶ [7/7] Probando generación de sesión multilingüe en ES, PT, FR e ID por carriles...');

import { generateSessionPDF, tPdf } from '../src/utils/pdfGenerator.js';
import { PDFParse } from 'pdf-parse';

const sessionMockBurriana = {
  id: 'sess_burriana_20261006',
  nombre: 'Sesión Táctica Burriana B',
  date: '2026-10-06',
  time: '18:30',
  duration: 90,
  intensity: 'Alta',
  category: 'Juvenil B',
  materials: 'Conos, balones, petos',
  objectives: 'Mejorar la trancision ofensiva y la presion tras perdida (texto del míster intacto)',
  blocks: [
    {
      name: 'Rondo 4v2 de presion',
      type: 'Posesión',
      duration: 20,
      description: 'Presion coordinada tras perdida de balon sin giados.',
      clinicalCue: 'Prevención isquiosurales con desaceleración progresiva'
    }
  ],
  players: ['p1', 'p2'],
  notes: '' // Estado vacío para probar Carril A
};

const activeTeamBurriana = {
  id: 'team_burriana',
  nombre: 'BURRIANA B',
  categoria: 'Juvenil B'
};

const playersMock = [
  { id: 'p1', name: 'Héctor Gómez', number: 7, position: 'DEL' },
  { id: 'p2', name: 'Álvaro Ramos', number: 10, position: 'MCO' }
];

async function extractPdfText(doc) {
  const buf = Buffer.from(doc.output('arraybuffer'));
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  return result.text;
}

const testLocales = ['es', 'pt', 'fr', 'id'];
for (const loc of testLocales) {
  const doc = await generateSessionPDF(sessionMockBurriana, activeTeamBurriana, [], [], playersMock, [], loc);
  const text = await extractPdfText(doc);

  check(`PDF generado en [${loc.toUpperCase()}] respeta Carril A localizado`, () => {
    const expectedSheetTitle = tPdf('trainingSheet', loc);
    const expectedDateLabel = tPdf('date', loc);
    const expectedNotesLabel = tPdf('postSessionNotes', loc);
    const expectedEmptyNotes = tPdf('notesEmpty', loc);

    assert.ok(text.includes(expectedSheetTitle), `Debe contener título ${expectedSheetTitle}`);
    assert.ok(text.includes(expectedDateLabel), `Debe contener etiqueta fecha ${expectedDateLabel}`);
    assert.ok(text.includes(expectedNotesLabel), `Debe contener sección notas ${expectedNotesLabel}`);
    assert.ok(text.includes(expectedEmptyNotes), `Debe contener notas vacías traducidas: ${expectedEmptyNotes}`);
    assert.ok(!text.includes('[empty]'), 'NO debe contener [empty] en inglés');
  });

  check(`PDF generado en [${loc.toUpperCase()}] respeta Carril C intacto (texto del míster)`, () => {
    // Objetivo del míster con typos y acentos intacto
    assert.ok(text.includes('Mejorar la trancision ofensiva y la presion tras perdida'), 'El objetivo del míster debe conservarse intacto');
    // Bloque del míster intacto
    assert.ok(text.includes('Presion coordinada tras perdida de balon sin giados.'), 'La descripción del míster debe conservarse intacta');
    // Jugador con acento Héctor intacto
    assert.ok(text.includes('Héctor Gómez'), 'El nombre del jugador Héctor con é debe estar intacto');
  });

  check(`PDF generado en [${loc.toUpperCase()}] no tiene marcas rotas ("mister11.a pp", "Pá g ina", "•", "MÍSTER11")`, () => {
    assert.ok(!text.includes('mister11.a pp'), 'No debe contener mister11.a pp');
    assert.ok(!text.includes('Pá g ina'), 'No debe contener Pá g ina');
    assert.ok(!text.includes('•'), 'No debe contener bullet •');
    assert.ok(!text.includes('MÍSTER11'), 'No debe contener MÍSTER11 con tilde');
    assert.ok(!text.includes('Míster11'), 'No debe contener Míster11 con tilde');
    assert.ok(text.includes('MISTER11'), 'Debe contener la marca MISTER11');
    assert.ok(text.includes('Mister11 Platform - mister11.app'), 'Debe contener footer oficial');
  });

  if (loc === 'pt' || loc === 'fr' || loc === 'id') {
    check(`PDF generado en [${loc.toUpperCase()}] muestra chip de fallback clínico visible en Carril B`, () => {
      const chipExpected = tPdf('clinicalChip', loc);
      assert.ok(text.includes(chipExpected), `Debe incluir el chip visible ${chipExpected}`);
      assert.ok(/Prevenci[óo]n\s+isquiosurales/.test(text), 'Debe conservar el contenido clínico original');
    });
  }
}

console.log(`\n==============================================================================`);
console.log(`TODAS LAS PRUEBAS DE CALIDAD PDF (PDF-Q) PASARON EXITOSAMENTE (${passCount}/${passCount})`);
console.log(`==============================================================================\n`);
