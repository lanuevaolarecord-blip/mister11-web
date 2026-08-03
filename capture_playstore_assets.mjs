import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'play_store_assets', '02_screenshots');

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:5173';

const modulesToCapture = [
  { id: 'dashboard',     filename: '01_dashboard.png',         name: 'Dashboard' },
  { id: 'pizarra',       filename: '02_pizarra_tactica.png',   name: 'Pizarra Táctica' },
  { id: 'equipo',        filename: '03_mi_equipo.png',         name: 'Mi Equipo' },
  { id: 'planificacion', filename: '04_planificacion.png',     name: 'Planificación' },
  { id: 'sesiones',      filename: '05_sesiones.png',          name: 'Sesiones' },
  { id: 'partidos',      filename: '06_partidos_matchday.png', name: 'Match-Day' },
  { id: 'ia',            filename: '07_ia_generadora.png',     name: 'IA Generadora' },
  { id: 'tests',         filename: '08_tests_rendimiento.png', name: 'Tests Físicos' },
];

async function main() {
  console.log('📸 Capturando las 8 pantallas de Míster 11 en /demo (1080x1920 px)...');
  console.log(`   Directorio: ${OUTPUT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  // Cargar ruta public /demo
  await page.goto(`${BASE_URL}/demo`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);

  for (const m of modulesToCapture) {
    console.log(`📸 Capturando módulo: ${m.name}...`);
    
    // Buscar y hacer clic en el botón de navegación del módulo
    const tabBtn = await page.$(`button:has-text("${m.name}")`);
    if (tabBtn) {
      await tabBtn.click();
      await page.waitForTimeout(1000);
    } else {
      console.warn(`   ⚠️ No se encontró botón para ${m.name}`);
    }

    const filePath = join(OUTPUT_DIR, m.filename);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`   ✅ Captura guardada: ${m.filename}`);
  }

  await browser.close();
  console.log('\n✨ Proceso finalizado. Las 8 capturas en alta resolución han sido actualizadas.');
}

main().catch(console.error);
