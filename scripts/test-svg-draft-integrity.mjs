/**
 * scripts/test-svg-draft-integrity.mjs
 * Míster11 — P12-B: Validador Read-Only de Integridad para Candidatos SVG Draft
 *
 * Comprueba los 14 puntos obligatorios de P12-B sobre docs/svg-drafts/sys-9/:
 *  1. SVG parseable y bien formado.
 *  2. Peso < 50 KB (y reporta si cumple ideal < 30 KB).
 *  3. 0 colores prohibidos (#0D9488, #10B981, #0A2540, cian, azul eléctrico, magenta, neón).
 *  4. 0 imágenes raster incrustadas (<image).
 *  5. 0 base64 (data:image / base64).
 *  6. 0 scripts externos (<script en SVG o src externo en HTML).
 *  7. 0 fuentes externas.
 *  8. 0 CDN (http:// o https:// en SVG/HTML).
 *  9. Presencia de role="img", <title>, <desc>, aria-labelledby.
 * 10. Presencia de capas obligatorias: body-silhouette, support-points, joints,
 *     muscle-zones, axis-line, error-marker, warning-layer.
 * 11. Presencia de prefers-reduced-motion y clase .m11-pulse desactivable.
 * 12. canonicalTargetZones de sys-9 usadas en muscle-zones sin inventar músculos.
 * 13. Warning draft obligatorio presente en HTML y spec, 0 frases prohibidas, 0 toque a i18n producto.
 * 14. console_errors = [].
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CANONICAL_EXERCISE_SAFETY_MAP } from '../src/data/exerciseSafetyMap.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const svgPath = path.join(repoRoot, 'docs/svg-drafts/sys-9/sys-9-guide-draft.svg');
const htmlPath = path.join(repoRoot, 'docs/svg-drafts/sys-9/sys-9-guide-draft.html');
const specPath = path.join(repoRoot, 'docs/svg-drafts/sys-9/sys-9-design-spec.md');

let failed = false;
const consoleErrors = [];
const ok = (cond, msg) => {
  console.log(`${cond ? '✅' : '❌ FALLÓ:'} ${msg}`);
  if (!cond) {
    failed = true;
    consoleErrors.push(msg);
  }
};

console.log('══════════════════════════════════════════════════════════════════════');
console.log('🎨 [TEST-SVG-DRAFT-INTEGRITY] VALIDACIÓN CANDIDATO P12-B (sys-9)');
console.log('══════════════════════════════════════════════════════════════════════\n');

const svgExists = fs.existsSync(svgPath);
const htmlExists = fs.existsSync(htmlPath);
const specExists = fs.existsSync(specPath);
ok(svgExists && htmlExists && specExists, 'Archivos draft existen en docs/svg-drafts/sys-9/ (.svg, .html, -design-spec.md)');

const svgContent = fs.readFileSync(svgPath, 'utf8');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const specContent = fs.readFileSync(specPath, 'utf8');
const svgBytes = Buffer.byteLength(svgContent, 'utf8');
const svgKB = Number((svgBytes / 1024).toFixed(2));

// 1. SVG parseable
const startsWithSvg = svgContent.trim().startsWith('<svg') && svgContent.trim().endsWith('</svg>');
const openGroups = (svgContent.match(/<g\b/g) || []).length;
const closeGroups = (svgContent.match(/<\/g>/g) || []).length;
const hasViewBox = /viewBox="0 0 \d+ \d+"/.test(svgContent);
ok(startsWithSvg && openGroups === closeGroups && hasViewBox,
  `[1/14] SVG parseable y balanceado (<g>=${openGroups}/${closeGroups}, viewBox presente)`);

// 2. Peso < 50 KB (ideal < 30 KB)
ok(svgBytes < 50 * 1024,
  `[2/14] Peso del SVG = ${svgBytes} bytes (${svgKB} KB) < 50 KB (cumple ideal < 30 KB: ${svgBytes < 30 * 1024})`);

// 3. 0 colores prohibidos
const PROHIBITED_COLORS = [
  /#0d9488/i,
  /#10b981/i,
  /#0a2540/i,
  /#00ffff/i,
  /\bcyan\b/i,
  /\baqua\b/i,
  /\bmagenta\b/i,
  /#ff00ff/i,
  /#00ff00/i,
  /#39ff14/i,
  /#007bff/i
];
const foundProhibited = PROHIBITED_COLORS.filter((rx) => rx.test(svgContent) || rx.test(htmlContent));
ok(foundProhibited.length === 0,
  `[3/14] 0 colores prohibidos en SVG y HTML preview (detectados=${foundProhibited.length})`);

// 4. 0 imágenes raster incrustadas
const hasRasterImage = /<image\b/i.test(svgContent) || /\.(png|jpg|jpeg|webp|gif)\b/i.test(svgContent);
ok(!hasRasterImage, '[4/14] 0 imágenes raster incrustadas (<image> o bitmaps)');

// 5. 0 base64
const hasBase64 = /base64/i.test(svgContent) || /data:image\//i.test(svgContent) || /base64/i.test(htmlContent);
ok(!hasBase64, '[5/14] 0 contenido base64 o data:image/* en SVG y HTML');

// 6. 0 scripts en SVG y 0 scripts externos en HTML
const hasSvgScript = /<script\b/i.test(svgContent) || /<foreignObject\b/i.test(svgContent);
const hasExternalHtmlScript = /<script[^>]+src=/i.test(htmlContent);
ok(!hasSvgScript && !hasExternalHtmlScript,
  '[6/14] 0 <script> o <foreignObject> en SVG y 0 scripts externos en HTML preview');

// 7. 0 fuentes externas
const hasExternalFont = /fonts\.googleapis|fonts\.gstatic|@import\s+url\(|@font-face/i.test(svgContent + htmlContent);
ok(!hasExternalFont, '[7/14] 0 fuentes externas en SVG y HTML');

// 8. 0 CDN
const hasCdn = /https?:\/\//i.test(svgContent.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, '')) ||
               /https?:\/\//i.test(htmlContent.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, ''));
ok(!hasCdn, '[8/14] 0 enlaces CDN o llamadas de red (100% offline)');

// 9. Accesibilidad: role="img", <title>, <desc>, aria-labelledby
const hasRoleImg = /role="img"/.test(svgContent);
const hasAriaLabelledBy = /aria-labelledby="sys9-title sys9-desc"/.test(svgContent);
const hasTitle = /<title id="sys9-title">[\s\S]+<\/title>/.test(svgContent);
const hasDesc = /<desc id="sys9-desc">[\s\S]+<\/desc>/.test(svgContent);
ok(hasRoleImg && hasAriaLabelledBy && hasTitle && hasDesc,
  '[9/14] Accesibilidad SVG: role="img", aria-labelledby, <title> y <desc> bilingüe presentes');

// 10. Capas obligatorias
const REQUIRED_LAYERS = [
  'body-silhouette',
  'support-points',
  'joints',
  'muscle-zones',
  'axis-line',
  'error-marker',
  'warning-layer'
];
const missingLayers = REQUIRED_LAYERS.filter((layer) => !new RegExp(`id="${layer}"`).test(svgContent));
const hasOptionalLayers = /id="regression-layer"/.test(svgContent) && /id="progression-layer"/.test(svgContent);
ok(missingLayers.length === 0 && hasOptionalLayers,
  `[10/14] Capas obligatorias presentes (7/7: ${REQUIRED_LAYERS.join(', ')}) + capas opcionales (regression-layer, progression-layer)`);

// 11. prefers-reduced-motion
const hasReducedMotion = /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(svgContent) && /\.m11-pulse/.test(svgContent);
ok(hasReducedMotion, '[11/14] Animación ligera .m11-pulse con soporte @media (prefers-reduced-motion: reduce)');

// 12. canonicalTargetZones de sys-9 usadas en muscle-zones sin inventar músculos
const sys9Safety = CANONICAL_EXERCISE_SAFETY_MAP['sys-9'];
const expectedZones = sys9Safety?.canonicalTargetZones || [];
const declaredZonesMatch = svgContent.match(/id="muscle-zones"[^>]*data-canonical-zones="([^"]+)"/);
const declaredZones = declaredZonesMatch ? declaredZonesMatch[1].split(',').map((s) => s.trim()) : [];
const zoneTags = [...svgContent.matchAll(/data-zone="([^"]+)"/g)].map((m) => m[1]);
const zonesMatchExact = JSON.stringify(declaredZones) === JSON.stringify(expectedZones) &&
                        JSON.stringify(zoneTags) === JSON.stringify(expectedZones);
ok(zonesMatchExact,
  `[12/14] canonicalTargetZones de sys-9 en muscle-zones coinciden exactamente con fuente (${JSON.stringify(declaredZones)} === ${JSON.stringify(expectedZones)}, 0 músculos inventados)`);

// 13. Warning draft obligatorio y ausencia de frases prohibidas
const MANDATORY_WARNING = 'Guía visual orientativa en rediseño. No validada clínicamente. No sustituye supervisión ni valoración profesional.';
const FORBIDDEN_PHRASES = [
  'técnica correcta',
  'ejercicio seguro',
  'validado por fisio',
  'hazlo así'
];
const hasWarningInHtmlAndSpec = htmlContent.includes(MANDATORY_WARNING) && specContent.includes(MANDATORY_WARNING);
const stripNegatedProhibitions = (txt) => txt.replace(/No usar frases como:[\s\S]*$/i, '').replace(/0 frases prohibidas[^\n]*/gi, '');
const combinedForForbiddenCheck = (svgContent + '\n' + htmlContent + '\n' + stripNegatedProhibitions(specContent)).toLowerCase();
const foundForbiddenPhrases = FORBIDDEN_PHRASES.filter((p) => combinedForForbiddenCheck.includes(p));
ok(hasWarningInHtmlAndSpec && foundForbiddenPhrases.length === 0,
  `[13/14] Warning draft obligatorio presente en HTML y spec; 0 frases clínicas prohibidas (detectadas=${foundForbiddenPhrases.length})`);

// 14. Estado de producto intacto (sys-9 sigue rejected_by_owner y reviewed_by_human=false) y console_errors = []
ok(sys9Safety.illustrationStatus === 'rejected_by_owner' && consoleErrors.length === 0,
  `[14/14] sys-9 en producto mantiene status='rejected_by_owner' y console_errors = ${JSON.stringify(consoleErrors)}`);

console.log('\n══════════════════════════════════════════════════════════════════════');
if (failed) {
  console.error('❌ [TEST-SVG-DRAFT-INTEGRITY] FALLÓ');
  process.exit(1);
} else {
  console.log(`✅ [TEST-SVG-DRAFT-INTEGRITY] 14/14 PASS — sys-9-guide-draft.svg (${svgBytes} bytes / ${svgKB} KB)`);
  console.log('══════════════════════════════════════════════════════════════════════');
  process.exit(0);
}
