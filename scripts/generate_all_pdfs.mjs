import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(rootDir, '..');

function mdToHtml(md, title) {
  let html = md
    .replace(/> \[!IMPORTANT\]\n> (.*)/g, '<div class="alert alert-important"><strong>IMPORTANTE:</strong> $1</div>')
    .replace(/> \[!NOTE\]\n> (.*)/g, '<div class="alert alert-note"><strong>NOTA:</strong> $1</div>')
    .replace(/> \[!TIP\]\n> (.*)/g, '<div class="alert alert-tip"><strong>CONSEJO:</strong> $1</div>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^---$/gim, '<hr/>');

  // Tables
  html = html.replace(/\|(.+)\|\n\|[-:| ]+\|\n((?:\|.*\|\n?)*)/g, (match, header, body) => {
    const ths = header.split('|').filter(c => c.trim()).map(c => '<th>' + c.trim() + '</th>').join('');
    const rows = body.trim().split('\n').map(row => {
      const tds = row.split('|').filter(c => c !== undefined && c !== '').map(c => '<td>' + c.trim() + '</td>').join('');
      return '<tr>' + tds + '</tr>';
    }).join('');
    return '<div class="table-container"><table><thead><tr>' + ths + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  });

  // Code blocks
  html = html.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^\• (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');

  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<div') || p.trim().startsWith('<pre') || p.trim().startsWith('<hr') || p.trim().startsWith('<table') || p.trim().startsWith('<li>')) return p;
    return '<p>' + p.trim().replace(/\n/g, '<br/>') + '</p>';
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 18mm 15mm;
    }
    :root {
      --primary: #1B3A2D;
      --primary-light: #2A5940;
      --accent: #D4A843;
      --text: #142820;
      --border: #D1DDD6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: var(--text);
      font-size: 9.5pt;
      line-height: 1.55;
      background: #fff;
    }
    h1 {
      font-size: 16pt;
      color: var(--primary);
      margin-bottom: 12pt;
      padding-bottom: 6pt;
      border-bottom: 2pt solid var(--primary);
      page-break-after: avoid;
    }
    h2 {
      font-size: 12.5pt;
      color: var(--primary-light);
      margin-top: 16pt;
      margin-bottom: 8pt;
      padding-bottom: 4pt;
      border-bottom: 1pt solid var(--border);
      page-break-after: avoid;
    }
    h3 {
      font-size: 10.5pt;
      color: var(--text);
      margin-top: 12pt;
      margin-bottom: 6pt;
      page-break-after: avoid;
    }
    p {
      margin-bottom: 8pt;
      text-align: justify;
    }
    .table-container {
      margin: 10pt 0;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      line-height: 1.35;
    }
    th {
      background: #EBF1EE;
      color: var(--primary);
      padding: 6pt 8pt;
      text-align: left;
      border: 0.5pt solid var(--border);
      font-weight: bold;
    }
    td {
      padding: 5pt 8pt;
      border: 0.5pt solid var(--border);
      vertical-align: top;
    }
    tr:nth-child(even) {
      background: #F8FAF9;
    }
    pre {
      background: #142820;
      color: #E2EAE5;
      padding: 8pt 10pt;
      border-radius: 4pt;
      font-size: 7.5pt;
      line-height: 1.4;
      margin: 8pt 0;
      page-break-inside: avoid;
      white-space: pre-wrap;
      word-break: break-word;
    }
    code {
      background: #EBF1EE;
      color: var(--primary);
      padding: 1pt 3pt;
      border-radius: 2pt;
      font-family: Consolas, monospace;
      font-size: 8.5pt;
    }
    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
    .alert {
      padding: 8pt 10pt;
      border-radius: 4pt;
      margin: 10pt 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }
    .alert-important {
      background: #FDF4E5;
      border-left: 3pt solid var(--accent);
      color: #664808;
    }
    .alert-note {
      background: #EAF4EE;
      border-left: 3pt solid var(--primary-light);
      color: var(--primary);
    }
    .alert-tip {
      background: #E6F3F7;
      border-left: 3pt solid #1E7E94;
      color: #0C4E5E;
    }
    li {
      margin-left: 16pt;
      margin-bottom: 4pt;
    }
    hr {
      border: none;
      border-top: 0.5pt solid var(--border);
      margin: 14pt 0;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

const auditDir = path.resolve(rootDir, 'docs/auditoria-modulos');
const releaseDir = path.resolve(rootDir, 'docs/release');
const outputPdfDir = path.resolve(rootDir, 'docs/pdf');
const parentPdfDir = path.resolve(parentDir, 'docs/pdf');

[outputPdfDir, parentPdfDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const DOCS_LIST = [
  { file: '00-INDICE', title: '00. Índice Maestro de Auditoría', folder: auditDir },
  { file: 'M01-acceso', title: 'M01. Acceso y Onboarding', folder: auditDir },
  { file: 'M02-inicio-dashboard', title: 'M02. Inicio y Dashboard', folder: auditDir },
  { file: 'M03-mi-equipo', title: 'M03. Mi Equipo', folder: auditDir },
  { file: 'M04-portal-jugador', title: 'M04. Portal del Jugador', folder: auditDir },
  { file: 'M05-pizarra-tactica', title: 'M05. Pizarra Táctica', folder: auditDir },
  { file: 'M06-partidos-captura', title: 'M06. Partidos y Captura', folder: auditDir },
  { file: 'M07-sesiones-planificacion', title: 'M07. Sesiones y Planificación', folder: auditDir },
  { file: 'M08-tests-informes', title: 'M08. Tests e Informes', folder: auditDir },
  { file: 'M09-ia-asistente', title: 'M09. IA y Asistente', folder: auditDir },
  { file: 'M10-club-ajustes', title: 'M10. Club y Ajustes', folder: auditDir },
  { file: 'M11-exportaciones-documentos', title: 'M11. Exportaciones y Documentos', folder: auditDir },
  { file: 'M12-planes-entitlements', title: 'M12. Planes y Entitlements', folder: auditDir },
  { file: 'readiness-politicas', title: 'D1. Readiness de Políticas Google Play', folder: releaseDir },
  { file: 'feedback-prueba-cerrada', title: 'D2. Feedback de la Prueba Cerrada', folder: releaseDir },
  { file: 'ficha-produccion', title: 'D3. Ficha de Producción Oficial Play Store', folder: releaseDir }
];

async function main() {
  console.log('==============================================================================');
  console.log('MÍSTER 11 — GENERADOR AUTOMÁTICO DE PDFs VECTORIALES PROFESIONALES');
  console.log('==============================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let masterCombinedHtml = '';

  for (const item of DOCS_LIST) {
    const mdPath = path.join(item.folder, `${item.file}.md`);
    if (!fs.existsSync(mdPath)) {
      console.warn(`⚠️ Archivo no encontrado: ${mdPath}`);
      continue;
    }

    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const htmlContent = mdToHtml(mdContent, item.title);

    // Guardar HTML auxiliar y renderizar PDF
    await page.setContent(htmlContent, { waitUntil: 'load' });

    const pdfName = `${item.file}.pdf`;
    const targetPath1 = path.join(item.folder, pdfName);
    const targetPath2 = path.join(outputPdfDir, pdfName);
    const targetPath3 = path.join(parentPdfDir, pdfName);
    const targetPath4 = path.join(parentDir, pdfName);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '15mm', bottom: '18mm', left: '15mm', right: '15mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size: 7.5pt; color: #666; width: 100%; text-align: right; padding: 0 15mm; font-family: sans-serif;">
        Míster11 — ${item.title} (v1.1.74)
      </div>`,
      footerTemplate: `<div style="font-size: 7.5pt; color: #666; width: 100%; display: flex; justify-content: space-between; padding: 0 15mm; font-family: sans-serif;">
        <span>Documento Oficial de Auditoría y Certificación</span>
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>`
    });

    fs.writeFileSync(targetPath1, pdfBuffer);
    fs.writeFileSync(targetPath2, pdfBuffer);
    fs.writeFileSync(targetPath3, pdfBuffer);
    fs.writeFileSync(targetPath4, pdfBuffer);

    console.log(`✅ [PDF] Generado: ${pdfName} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

    masterCombinedHtml += `<div style="page-break-after: always;">${htmlContent.replace(/<!DOCTYPE html>[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*?<\/html>/, '')}</div>`;
  }

  // Generar Dossier Maestro Consolidado
  console.log('\n▶ Generando Dossier Maestro Completo (All-in-One PDF)...');
  const masterFullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Míster11 — Dossier Integral de Auditoría y Release</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 15mm 18mm 15mm; }
    :root { --primary: #1B3A2D; --primary-light: #2A5940; --accent: #D4A843; --text: #142820; --border: #D1DDD6; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: var(--text); font-size: 9.5pt; line-height: 1.55; }
    h1 { font-size: 16pt; color: var(--primary); margin-bottom: 12pt; padding-bottom: 6pt; border-bottom: 2pt solid var(--primary); page-break-after: avoid; }
    h2 { font-size: 12.5pt; color: var(--primary-light); margin-top: 16pt; margin-bottom: 8pt; padding-bottom: 4pt; border-bottom: 1pt solid var(--border); page-break-after: avoid; }
    h3 { font-size: 10.5pt; color: var(--text); margin-top: 12pt; margin-bottom: 6pt; page-break-after: avoid; }
    p { margin-bottom: 8pt; text-align: justify; }
    .table-container { margin: 10pt 0; page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; font-size: 8pt; line-height: 1.35; }
    th { background: #EBF1EE; color: var(--primary); padding: 6pt 8pt; text-align: left; border: 0.5pt solid var(--border); font-weight: bold; }
    td { padding: 5pt 8pt; border: 0.5pt solid var(--border); vertical-align: top; }
    tr:nth-child(even) { background: #F8FAF9; }
    pre { background: #142820; color: #E2EAE5; padding: 8pt 10pt; border-radius: 4pt; font-size: 7.5pt; line-height: 1.4; margin: 8pt 0; page-break-inside: avoid; white-space: pre-wrap; word-break: break-word; }
    code { background: #EBF1EE; color: var(--primary); padding: 1pt 3pt; border-radius: 2pt; font-family: Consolas, monospace; font-size: 8.5pt; }
    pre code { background: none; color: inherit; padding: 0; }
    .alert { padding: 8pt 10pt; border-radius: 4pt; margin: 10pt 0; font-size: 8.5pt; page-break-inside: avoid; }
    .alert-important { background: #FDF4E5; border-left: 3pt solid var(--accent); color: #664808; }
    .alert-note { background: #EAF4EE; border-left: 3pt solid var(--primary-light); color: var(--primary); }
    .alert-tip { background: #E6F3F7; border-left: 3pt solid #1E7E94; color: #0C4E5E; }
    li { margin-left: 16pt; margin-bottom: 4pt; }
    hr { border: none; border-top: 0.5pt solid var(--border); margin: 14pt 0; }
  </style>
</head>
<body>
  ${masterCombinedHtml}
</body>
</html>`;

  await page.setContent(masterFullHtml, { waitUntil: 'load' });
  const masterBuffer = await page.pdf({
    format: 'A4',
    margin: { top: '15mm', bottom: '18mm', left: '15mm', right: '15mm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size: 7.5pt; color: #666; width: 100%; text-align: right; padding: 0 15mm; font-family: sans-serif;">
      Míster11 — Dossier Maestro de Auditoría y Release (v1.1.74)
    </div>`,
    footerTemplate: `<div style="font-size: 7.5pt; color: #666; width: 100%; display: flex; justify-content: space-between; padding: 0 15mm; font-family: sans-serif;">
      <span>Míster11 Pro · Documento Oficial Completo</span>
      <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
    </div>`
  });

  const masterPath1 = path.join(outputPdfDir, 'INFORME_MAESTRO_AUDITORIA_Y_RELEASE.pdf');
  const masterPath2 = path.join(parentDir, 'INFORME_MAESTRO_AUDITORIA_Y_RELEASE.pdf');
  fs.writeFileSync(masterPath1, masterBuffer);
  fs.writeFileSync(masterPath2, masterBuffer);

  console.log(`🎉 [MASTER PDF] Dossier Completo Generado: INFORME_MAESTRO_AUDITORIA_Y_RELEASE.pdf (${(masterBuffer.length / 1024).toFixed(1)} KB)`);

  await browser.close();
  console.log('\n==============================================================================');
  console.log('🎉 TODOS LOS DOCUMENTOS EN PDF GENERADOS EXITOSAMENTE');
  console.log('==============================================================================');
}

main().catch(err => {
  console.error('Error generando PDFs:', err);
  process.exit(1);
});
