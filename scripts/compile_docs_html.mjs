import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function mdToHtml(md) {
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

  return html;
}

const auditDir = path.resolve(rootDir, 'docs/auditoria-modulos');
const releaseDir = path.resolve(rootDir, 'docs/release');

const files = [
  { id: 'indice', title: '00. Índice Global', path: path.join(auditDir, '00-INDICE.md') },
  { id: 'm01', title: 'M01. Acceso y Onboarding', path: path.join(auditDir, 'M01-acceso.md') },
  { id: 'm02', title: 'M02. Inicio y Dashboard', path: path.join(auditDir, 'M02-inicio-dashboard.md') },
  { id: 'm03', title: 'M03. Mi Equipo', path: path.join(auditDir, 'M03-mi-equipo.md') },
  { id: 'm04', title: 'M04. Portal del Jugador', path: path.join(auditDir, 'M04-portal-jugador.md') },
  { id: 'm05', title: 'M05. Pizarra Táctica', path: path.join(auditDir, 'M05-pizarra-tactica.md') },
  { id: 'm06', title: 'M06. Partidos y Captura', path: path.join(auditDir, 'M06-partidos-captura.md') },
  { id: 'm07', title: 'M07. Sesiones y Planificación', path: path.join(auditDir, 'M07-sesiones-planificacion.md') },
  { id: 'm08', title: 'M08. Tests e Informes', path: path.join(auditDir, 'M08-tests-informes.md') },
  { id: 'm09', title: 'M09. IA y Asistente', path: path.join(auditDir, 'M09-ia-asistente.md') },
  { id: 'm10', title: 'M10. Club y Ajustes', path: path.join(auditDir, 'M10-club-ajustes.md') },
  { id: 'm11', title: 'M11. Exportaciones y Docs', path: path.join(auditDir, 'M11-exportaciones-documentos.md') },
  { id: 'm12', title: 'M12. Planes y Entitlements', path: path.join(auditDir, 'M12-planes-entitlements.md') },
  { id: 'd1', title: 'D1. Readiness Políticas Play', path: path.join(releaseDir, 'readiness-politicas.md') },
  { id: 'd2', title: 'D2. Feedback Prueba Cerrada', path: path.join(releaseDir, 'feedback-prueba-cerrada.md') },
  { id: 'd3', title: 'D3. Ficha de Producción ES/EN', path: path.join(releaseDir, 'ficha-produccion.md') }
];

let sectionsHtml = '';
let menuHtml = '';

files.forEach((f, idx) => {
  const content = fs.readFileSync(f.path, 'utf8');
  const rendered = mdToHtml(content);
  menuHtml += `<a href="#${f.id}" class="nav-item ${idx === 0 ? 'active' : ''}" onclick="showSection('${f.id}')">${f.title}</a>`;
  sectionsHtml += `<section id="${f.id}" class="doc-section ${idx === 0 ? 'active' : ''}">${rendered}</section>`;
});

const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Míster11 — Auditoría Integral y Documentación de Release (v1.1.74)</title>
  <style>
    :root {
      --primary: #1B3A2D;
      --primary-light: #2A5940;
      --accent: #D4A843;
      --bg: #F4F7F5;
      --card-bg: #FFFFFF;
      --text: #142820;
      --text-muted: #556B60;
      --border: #D1DDD6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    aside {
      width: 320px;
      background: var(--primary);
      color: #fff;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      box-shadow: 2px 0 10px rgba(0,0,0,0.15);
    }
    .brand {
      padding: 24px 20px;
      background: #142820;
      border-bottom: 2px solid var(--accent);
    }
    .brand h1 { font-size: 1.25rem; color: #fff; display: flex; align-items: center; gap: 8px; }
    .brand p { font-size: 0.8rem; color: var(--accent); margin-top: 4px; }
    nav {
      overflow-y: auto;
      padding: 16px 12px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav-item {
      padding: 10px 14px;
      color: #E2EAE5;
      text-decoration: none;
      border-radius: 8px;
      font-size: 0.88rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .nav-item:hover { background: var(--primary-light); color: #fff; }
    .nav-item.active { background: var(--accent); color: #142820; font-weight: bold; }
    main {
      flex: 1;
      overflow-y: auto;
      padding: 40px;
      background: var(--bg);
    }
    .doc-section {
      display: none;
      max-width: 1050px;
      margin: 0 auto;
      background: var(--card-bg);
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid var(--border);
    }
    .doc-section.active { display: block; }
    h1 { font-size: 1.8rem; color: var(--primary); margin-bottom: 20px; border-bottom: 2px solid var(--border); padding-bottom: 12px; }
    h2 { font-size: 1.35rem; color: var(--primary-light); margin: 30px 0 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
    h3 { font-size: 1.1rem; color: var(--text); margin: 20px 0 10px; }
    p { line-height: 1.65; margin-bottom: 14px; color: var(--text); }
    .table-container { overflow-x: auto; margin: 20px 0; border-radius: 8px; border: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th { background: #EBF1EE; color: var(--primary); padding: 10px 14px; text-align: left; border: 1px solid var(--border); font-weight: 600; }
    td { padding: 10px 14px; border: 1px solid var(--border); }
    tr:nth-child(even) { background: #F8FAF9; }
    pre { background: #142820; color: #E2EAE5; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; font-size: 0.88rem; line-height: 1.5; }
    code { background: #EBF1EE; color: var(--primary); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    pre code { background: none; color: inherit; padding: 0; }
    .alert { padding: 16px; border-radius: 8px; margin: 20px 0; line-height: 1.5; font-size: 0.92rem; }
    .alert-important { background: #FDF4E5; border-left: 4px solid var(--accent); color: #664808; }
    .alert-note { background: #EAF4EE; border-left: 4px solid var(--primary-light); color: var(--primary); }
    .alert-tip { background: #E6F3F7; border-left: 4px solid #1E7E94; color: #0C4E5E; }
    li { margin-left: 24px; margin-bottom: 8px; line-height: 1.5; }
    hr { border: none; border-top: 1px solid var(--border); margin: 30px 0; }
  </style>
</head>
<body>
  <aside>
    <div class="brand">
      <h1>⚽ MÍSTER11</h1>
      <p>Auditoría Integral y Release v1.1.74</p>
    </div>
    <nav>
      ${menuHtml}
    </nav>
  </aside>
  <main>
    ${sectionsHtml}
  </main>
  <script>
    function showSection(id) {
      document.querySelectorAll('.doc-section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      const target = document.getElementById(id);
      if (target) {
        target.classList.add('active');
        document.querySelector('main').scrollTop = 0;
      }
      const activeLink = document.querySelector('a[href="#' + id + '"]');
      if (activeLink) activeLink.classList.add('active');
    }
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      showSection(hash);
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(rootDir, 'docs/index.html'), fullHtml, 'utf8');
fs.writeFileSync(path.resolve(rootDir, '../INFORME_AUDITORIA_Y_RELEASE.html'), fullHtml, 'utf8');
console.log('✅ HTML compilation successful!');
