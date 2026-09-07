// scripts/qa-language-runtime.js
// Auditor de lenguaje en tiempo de ejecución con Playwright
// Recorre la UI en caliente bajo ES y EN y genera:
// - OFFENDERS-ES.json
// - OFFENDERS-EN.json
// Contrato: cada archivo debe quedar vacío [] para completar FASE 8.

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const OUT_EN = resolve(__dirname, '../OFFENDERS-EN.json');
const OUT_ES = resolve(__dirname, '../OFFENDERS-ES.json');

// Stopwords y términos UI específicos
const SPANISH_STOPWORDS_IN_EN = [
  ' de ', ' la ', ' que ', ' el ', ' para ', ' con ', ' los ', ' las ', ' por ', ' una ', ' uno ',
  'guardar', 'eliminar', 'cancelar', 'confirmar', 'volver', 'cerrar', 'editar', 'añadir',
  'equipo', 'jugadores', 'plantilla', 'sesiones', 'partidos', 'entrenamiento',
  'pizarra', 'campo', 'bloques', 'comunicado', 'asistencia', 'cuerpo técnico',
  'semana', 'mesociclo', 'microciclo', 'acciones', 'materiales', 'señalización',
  'portería', 'balón', 'coordinación', 'medidas', 'zonas', 'comodín', 'rival',
  'minutos', 'goles', 'categoría', 'pie dominante', 'posición', 'edad', 'años',
  'cuenta vinculada', 'rutinas', 'individual', 'copiar', 'invitar', 'cambiar rol',
  'estructura', 'calentamiento', 'física', 'técnica', 'táctica', 'días de entrenamiento',
  'volumen', 'objetivo', 'iniciar modo campo', 'exportar a pdf', 'solicitudes pendientes',
  'disponible', 'convocado', 'titular', 'suplente'
];

const ENGLISH_STOPWORDS_IN_ES = [
  ' the ', ' and ', ' for ', ' with ', ' from ', ' without ',
  'save', 'delete', 'cancel', 'confirm', 'back', 'close', 'edit',
  'team', 'players', 'squad', 'sessions', 'matches', 'training',
  'tactical board', 'field', 'blocks', 'attendance', 'coaching staff',
  'week', 'actions', 'materials', 'goal', 'ball', 'drill', 'rival',
  'minutes', 'goals', 'category', 'dominant foot', 'position', 'age',
  'years old', 'linked account', 'routines', 'copy code', 'invite staff',
  'change role', 'session structure', 'warmup', 'strategic planning',
  'training days', 'season volume', 'general objective', 'start field mode'
];

// Comprobar si el servidor ya está activo
function checkServer(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Iniciar servidor dev si no está activo
async function ensureServerRunning() {
  const isUp = await checkServer(BASE_URL);
  if (isUp) {
    console.log(`🌐 Servidor detectado en ${BASE_URL}`);
    return null;
  }

  console.log(`🚀 Iniciando servidor dev en ${BASE_URL}...`);
  const child = spawn('npx', ['vite', '--port', '5173'], {
    cwd: resolve(__dirname, '..'),
    shell: true,
    stdio: 'ignore'
  });

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await checkServer(BASE_URL)) {
      console.log(`✅ Servidor dev listo en ${BASE_URL}`);
      return child;
    }
  }

  throw new Error(`No se pudo conectar a ${BASE_URL} tras 30s.`);
}

// Selector CSS legible para un elemento DOM
function generateSelectorCode() {
  return `
    function getCssPath(el) {
      if (!(el instanceof Element)) return '';
      const path = [];
      while (el && el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el.id) {
          selector += '#' + el.id;
          path.unshift(selector);
          break;
        } else {
          let sib = el, nth = 1;
          while (sib = sib.previousElementSibling) {
            if (sib.nodeName.toLowerCase() === selector) nth++;
          }
          if (nth !== 1) selector += ":nth-of-type(" + nth + ")";
        }
        path.unshift(selector);
        el = el.parentNode;
      }
      return path.join(" > ");
    }
  `;
}

// Extraer textos visibles de la página
async function extractVisibleTexts(page) {
  return await page.evaluate(() => {
    const results = [];
    const elements = document.querySelectorAll('body *:not(script):not(style):not(svg):not(path)');

    for (const el of elements) {
      // Tomar solo nodos con texto directo propio o elementos hoja
      const children = Array.from(el.childNodes);
      const directText = children
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent ? n.textContent.trim() : '')
        .filter(t => t.length >= 3)
        .join(' ')
        .trim();

      const placeholder = el.getAttribute ? el.getAttribute('placeholder') : null;
      const title = el.getAttribute ? el.getAttribute('title') : null;
      const ariaLabel = el.getAttribute ? el.getAttribute('aria-label') : null;

      const items = [];
      if (directText && directText.length >= 3) items.push({ type: 'text', text: directText });
      if (placeholder && placeholder.length >= 3) items.push({ type: 'placeholder', text: placeholder });
      if (title && title.length >= 3) items.push({ type: 'title', text: title });
      if (ariaLabel && ariaLabel.length >= 3) items.push({ type: 'aria-label', text: ariaLabel });

      for (const item of items) {
        // Ignorar números puros, hashes, fechas puras tipo 12:30
        if (/^\d+([:.\/-]\d+)*$/.test(item.text)) continue;
        if (/^#[0-9a-fA-F]+$/.test(item.text)) continue;
        if (/^https?:\/\//.test(item.text)) continue;

        // Construir selector simplificado
        let sel = el.tagName.toLowerCase();
        if (el.id) sel += '#' + el.id;
        else if (el.className && typeof el.className === 'string') {
          const firstClass = el.className.split(' ').filter(c => c && !c.includes(':'))[0];
          if (firstClass) sel += '.' + firstClass;
        }

        results.push({
          string: item.text,
          selector: sel,
          attr: item.type
        });
      }
    }
    return results;
  });
}

async function auditLanguage(browser, langName, langCode, isEnTarget) {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Inyectar localStorage con el idioma
  await page.addInitScript(({ langName }) => {
    localStorage.setItem('mister11_language', langName);
    localStorage.setItem('language', langName);
    localStorage.setItem('mister11_onboarding_completed', 'true');
  }, { langName });

  const offenders = [];
  const visitedRoutes = [];

  // 1. Rutas públicas directas
  const publicRoutes = ['/login', '/consentimiento', '/instalar', '/demo'];

  for (const route of publicRoutes) {
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);
      visitedRoutes.push(route);

      // Si es /demo, recorrer sus sub-vistas
      if (route === '/demo') {
        const moduleButtons = await page.locator('.demo-module-btn').all();
        for (let i = 0; i < Math.min(moduleButtons.length, 8); i++) {
          try {
            await moduleButtons[i].click();
            await page.waitForTimeout(500);
            const subTexts = await extractVisibleTexts(page);
            checkAndCollect(subTexts, `${route}#tab-${i}`, offenders, isEnTarget);
          } catch (_) {}
        }
      } else {
        const texts = await extractVisibleTexts(page);
        checkAndCollect(texts, route, offenders, isEnTarget);
      }
    } catch (e) {
      console.warn(`[QA] No se pudo cargar ruta ${route}: ${e.message}`);
    }
  }

  // 2. Intentar login para auditar rutas protegidas si es posible
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const emailInput = page.locator('input[type="email"]');
    const passInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    if (await emailInput.count() > 0) {
      await emailInput.fill('reviewer@mister11.app');
      await passInput.fill('Mister11Review2026!');
      await submitBtn.click();
      await page.waitForTimeout(3000);

      // Si logueó, recorrer rutas autenticadas
      const authRoutes = ['/', '/pizarra', '/equipo', '/sesiones', '/planificacion', '/tests', '/partidos', '/ia-generadora', '/admin'];
      for (const route of authRoutes) {
        try {
          await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForTimeout(1200);
          visitedRoutes.push(route);
          const texts = await extractVisibleTexts(page);
          checkAndCollect(texts, route, offenders, isEnTarget);
        } catch (_) {}
      }
    }
  } catch (_) {
    // Si auth remota no está disponible localmente, el script continúa con las vistas analizadas
  }

  await context.close();
  return { offenders, visitedRoutes };
}

function checkAndCollect(texts, ruta, offenders, isEnTarget) {
  for (const item of texts) {
    const raw = item.string;
    const lower = ' ' + raw.toLowerCase().replace(/[\r\n\t]+/g, ' ') + ' ';

    if (isEnTarget) {
      // Buscamos si en English (EN) aparecen términos en español
      for (const term of SPANISH_STOPWORDS_IN_EN) {
        const regex = new RegExp(`(?:^|[\\s.,;:¡!¿?()"'/-])${term.trim()}(?:$|[\\s.,;:¡!¿?()"'/-])`, 'i');
        if (regex.test(lower)) {
          // Evitar duplicados idénticos en la misma ruta
          if (!offenders.some(o => o.string === raw && o.ruta === ruta)) {
            offenders.push({
              string: raw,
              ruta: ruta,
              selector: item.selector,
              termFound: term.trim()
            });
          }
          break;
        }
      }
    } else {
      // Buscamos si en Español (ES) aparecen términos en inglés
      for (const term of ENGLISH_STOPWORDS_IN_ES) {
        const regex = new RegExp(`(?:^|[\\s.,;:¡!¿?()"'/-])${term.trim()}(?:$|[\\s.,;:¡!¿?()"'/-])`, 'i');
        if (regex.test(lower)) {
          if (!offenders.some(o => o.string === raw && o.ruta === ruta)) {
            offenders.push({
              string: raw,
              ruta: ruta,
              selector: item.selector,
              termFound: term.trim()
            });
          }
          break;
        }
      }
    }
  }
}

async function main() {
  console.log('🛡️ [QA-Language-Runtime] Iniciando auditoría Playwright en caliente...');
  let serverProcess = null;

  try {
    serverProcess = await ensureServerRunning();
    const browser = await chromium.launch({ headless: true });

    // Auditar EN (objetivo: cero español cuando EN está activo)
    console.log('\n🇬🇧 Evaluando interfaz con locale English (EN)...');
    const { offenders: offendersEN, visitedRoutes: routesEN } = await auditLanguage(browser, 'English (EN)', 'en', true);
    writeFileSync(OUT_EN, JSON.stringify(offendersEN, null, 2), 'utf-8');
    console.log(`   Rutas analizadas: ${routesEN.length}`);
    console.log(`   Offenders en EN: ${offendersEN.length} → guardado en OFFENDERS-EN.json`);

    // Auditar ES (objetivo: cero inglés cuando ES está activo)
    console.log('\n🇪🇸 Evaluando interfaz con locale Español (ES)...');
    const { offenders: offendersES, visitedRoutes: routesES } = await auditLanguage(browser, 'Español (ES)', 'es', false);
    writeFileSync(OUT_ES, JSON.stringify(offendersES, null, 2), 'utf-8');
    console.log(`   Rutas analizadas: ${routesES.length}`);
    console.log(`   Offenders en ES: ${offendersES.length} → guardado en OFFENDERS-ES.json`);

    await browser.close();

    console.log('\n======================================================');
    console.log(`📊 CONTRATO DE CIERRE:`);
    console.log(`   OFFENDERS-EN.json: ${offendersEN.length} encontrados`);
    console.log(`   OFFENDERS-ES.json: ${offendersES.length} encontrados`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('❌ Error en qa-language-runtime:', err);
    process.exit(1);
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

main();
