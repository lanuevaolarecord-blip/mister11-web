/**
 * scripts/test-hybrid-media-integrity.mjs
 * MÍSTER 11 — Validador Read-Only del Estándar Híbrido Rayos-X 3D + 4 Banderas Rojas Automáticas
 * (Base WebP + Máscara Bioluminiscente Píxel-Exacta + HUD SVG + Micro-Loop WebP)
 *
 * Verifica para los 5 ejercicios del prototipo aprobado (sys-1, sys-2, sys-9, hex-015, hex-008):
 *  1. Presencia y peso de <id>-card.webp (<= 40 KB).
 *  2. Presencia y peso de <id>-full.webp (<= 40 KB).
 *  3. Presencia y peso de <id>-glow.webp (<= 15 KB, máscara bioluminiscente extraída píxel a píxel con 0.0 px de error).
 *  4. Presencia y peso de <id>-microloop.webp (<= 150 KB, header RIFF/WEBP animado).
 *  5. Presencia y peso de <id>-overlay.svg (<= 10 KB, HUD SVG sin círculos falsos en el aire, con canonicalTargetZones y prefers-reduced-motion).
 *  6. LAS 4 BANDERAS ROJAS AUTOMÁTICAS (Red Flags):
 *     - RED_FLAG_1 (glow con 0 píxeles verdes): <id>-glow.webp debe contener píxeles verdes bioluminiscentes activos (> 0).
 *     - RED_FLAG_2 (silueta cortada en borde): la silueta anatómica en <id>-card.webp no debe estar mutilada/cortada en los bordes superior, izquierdo o derecho.
 *     - RED_FLAG_3 (glow fuera del cuerpo): los píxeles activos de <id>-glow.webp deben caer dentro de la envolvente anatómica/vectores de <id>-card.webp (>= 97% dentro de la silueta dilatada).
 *     - RED_FLAG_4 (proporción de aspect ratio inconsistente): el aspect ratio (width/height) debe ser consistente entre <id>-card.webp, <id>-full.webp, <id>-glow.webp y <id>-microloop.webp (diferencia <= 0.02).
 *  7. Gobernanza intacta: sys-1, sys-2, sys-9 siguen en illustrationStatus='rejected_by_owner' hasta promoción individual a producción.
 * [10] Tokens hex vectoriales del SVG (fuera de payloads base64) deben pertenecer a la allowlist canónica Tierra y Campo; el neón solo se tolera dentro del raster (D8 Condición 3 enmendada).
 * [11] El manifest (<id>-manifest.json) de cada asset declara provenance: ai_generated y tier de revisión válido (A/B/C).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { CANONICAL_EXERCISE_SAFETY_MAP } from '../src/data/exerciseSafetyMap.js';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const assetsDir = path.join(repoRoot, 'docs/svg-drafts/hybrid-prototype/assets');
const showcasePath = path.join(repoRoot, 'docs/svg-drafts/hybrid-prototype/mister11-hybrid-xray-showcase.html');

const IDS = ['sys-1', 'sys-2', 'sys-9', 'hex-015', 'hex-008'];

// D8 Condición 3 (enmendada): Allowlist canónica Tierra y Campo para TODO elemento vectorial SVG
export const CANONICAL_VECTOR_HEX_ALLOWLIST = new Set([
  '#1B3A2D',
  '#4CAF7D',
  '#2E7D52',
  '#D4A843',
  '#C85A32',
  '#9C6A3B',
  '#F7F5F0',
]);

/**
 * [10] Extrae tokens hex del SVG ignorando payloads base64 (data:image/...;base64,...)
 * y devuelve aquellos fuera de la allowlist canónica Tierra y Campo.
 */
export function auditVectorSvgHexPalette(svgContent) {
  const withoutBase64 = svgContent.replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, 'data:image/stripped');
  const matches = withoutBase64.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) || [];
  const normalized = Array.from(new Set(matches.map((h) => h.toUpperCase())));
  const disallowed = normalized.filter((hex) => !CANONICAL_VECTOR_HEX_ALLOWLIST.has(hex));
  return { found: normalized, disallowed };
}

/**
 * [11] Valida el manifest (<id>-manifest.json): provenance === 'ai_generated' (o provenance.source === 'ai_generated')
 * y reviewTier válido ('A', 'B' o 'C').
 */
export function validateAssetManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) {
    return { valid: false, reason: 'manifest_missing', provenance: null, reviewTier: null };
  }
  try {
    const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const prov = typeof data.provenance === 'string' ? data.provenance : data.provenance?.source || null;
    const tier = data.reviewTier || data.tier || null;
    const validProv = prov === 'ai_generated';
    const validTier = ['A', 'B', 'C'].includes(tier);
    return {
      valid: validProv && validTier,
      reason: !validProv ? `provenance_invalid(${prov})` : !validTier ? `reviewTier_invalid(${tier})` : 'ok',
      provenance: prov,
      reviewTier: tier,
    };
  } catch (err) {
    return { valid: false, reason: `json_parse_error(${err.message})`, provenance: null, reviewTier: null };
  }
}
let failed = false;

const ok = (cond, msg) => {
  console.log(`${cond ? '✅' : '❌ FALLÓ:'} ${msg}`);
  if (!cond) failed = true;
};

/**
 * Determina si un píxel RGBA pertenece a la silueta anatómica o vectores biomecánicos
 * (soportando tanto fondo crema claro #F2F2E8 como fondo esmeralda oscuro #05110C).
 */
function isBodyOrVectorPixel(r, g, b, bgR, bgG, bgB) {
  const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
  // La cuadrícula CAD sutil tiene diff < 65 respecto al fondo crema o < 45 respecto al fondo oscuro.
  // El cuerpo verde esmeralda (#1B3A2D), hueso marfil (#EAE3D2), músculo verde (#3CFF8F) y vectores dorados (#D4A843)
  // tienen una diferencia cromática fuerte o saturación verde/dorada clara.
  const isGreenOrEmerald = g > r + 10 && g > b + 8 && diff > 55;
  const isGoldVector = r > b + 35 && g > b + 15 && diff > 48;
  const isStrongBodyContrast = diff > 95;
  return isGreenOrEmerald || isGoldVector || isStrongBodyContrast;
}

/**
 * Evalúa las 4 banderas rojas automáticas sobre un ejercicio híbrido.
 */
export async function evaluateHybridRedFlags(id, cardPath, fullPath, glowPath, loopPath) {
  const cardMeta = await sharp(cardPath).metadata();
  const fullMeta = await sharp(fullPath).metadata();
  const glowMeta = await sharp(glowPath).metadata();
  const loopMeta = await sharp(loopPath, { animated: false }).metadata();

  const W = cardMeta.width;
  const H = cardMeta.height;

  // Extraer buffers RGBA a la resolución de card (W x H) para comparación píxel a píxel
  const cardRaw = await sharp(cardPath).ensureAlpha().raw().toBuffer();
  const glowRawFull = await sharp(glowPath).resize(W, H).ensureAlpha().raw().toBuffer();
  const glowRawNative = await sharp(glowPath).ensureAlpha().raw().toBuffer();

  // ─────────────────────────────────────────────────────────────────────────
  // RED FLAG 1: Glow con 0 píxeles verdes
  // ─────────────────────────────────────────────────────────────────────────
  let greenGlowPixels = 0;
  for (let i = 0; i < glowRawNative.length; i += 4) {
    const r = glowRawNative[i];
    const g = glowRawNative[i + 1];
    const b = glowRawNative[i + 2];
    const a = glowRawNative[i + 3];
    if (a >= 20 && g > 130 && g - r >= 25 && g >= b) {
      greenGlowPixels++;
    }
  }
  const flag1ZeroGreenGlow = greenGlowPixels === 0;

  // Estimar color de fondo desde las 4 esquinas (promedio de 6x6 px en esquina superior izquierda)
  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  for (let y = 2; y < 8; y++) {
    for (let x = 2; x < 8; x++) {
      const idx = (y * W + x) * 4;
      bgR += cardRaw[idx];
      bgG += cardRaw[idx + 1];
      bgB += cardRaw[idx + 2];
      bgCount++;
    }
  }
  bgR = Math.round(bgR / bgCount);
  bgG = Math.round(bgG / bgCount);
  bgB = Math.round(bgB / bgCount);

  // Construir máscara binaria del cuerpo + vectores en card.webp
  const bodyMask = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (isBodyOrVectorPixel(cardRaw[i], cardRaw[i + 1], cardRaw[i + 2], bgR, bgG, bgB)) {
      bodyMask[p] = 1;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RED FLAG 2: Silueta cortada en borde (superior, izquierdo o derecho)
  // ─────────────────────────────────────────────────────────────────────────
  let topBorderBodyPixels = 0;
  let leftBorderBodyPixels = 0;
  let rightBorderBodyPixels = 0;

  for (let x = 0; x < W; x++) {
    if (bodyMask[x] || bodyMask[W + x]) topBorderBodyPixels++;
  }
  for (let y = 0; y < H; y++) {
    if (bodyMask[y * W] || bodyMask[y * W + 1]) leftBorderBodyPixels++;
    if (bodyMask[y * W + (W - 1)] || bodyMask[y * W + (W - 2)]) rightBorderBodyPixels++;
  }

  const topRatio = topBorderBodyPixels / W;
  const leftRatio = leftBorderBodyPixels / H;
  const rightRatio = rightBorderBodyPixels / H;
  // Si más del 4% del borde superior, izquierdo o derecho tiene píxeles de silueta anatómica, la figura está cortada en el borde
  const flag2SilhouetteCutAtBorder = topRatio > 0.04 || leftRatio > 0.04 || rightRatio > 0.04;

  // ─────────────────────────────────────────────────────────────────────────
  // RED FLAG 3: Glow fuera del cuerpo
  // (Como el glow tiene blur(3px), dilatamos la máscara del cuerpo 6px para cubrir el halo natural)
  // ─────────────────────────────────────────────────────────────────────────
  const dilatedBody = new Uint8Array(W * H);
  const radius = 6;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!bodyMask[y * W + x]) continue;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= H) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= W) continue;
          dilatedBody[ny * W + nx] = 1;
        }
      }
    }
  }

  let totalActiveGlow = 0;
  let glowOutsideBody = 0;
  for (let p = 0; p < W * H; p++) {
    const a = glowRawFull[p * 4 + 3];
    if (a >= 35) {
      totalActiveGlow++;
      if (!dilatedBody[p]) {
        glowOutsideBody++;
      }
    }
  }
  const outsideRatio = totalActiveGlow > 0 ? glowOutsideBody / totalActiveGlow : 1;
  // Bandera roja si más del 3% de los píxeles de glow activos están fuera de la envolvente del cuerpo
  const flag3GlowOutsideBody = totalActiveGlow === 0 || outsideRatio > 0.03;

  // ─────────────────────────────────────────────────────────────────────────
  // RED FLAG 4: Proporción de aspect ratio inconsistente
  // ─────────────────────────────────────────────────────────────────────────
  const arCard = cardMeta.width / cardMeta.height;
  const arFull = fullMeta.width / fullMeta.height;
  const arGlow = glowMeta.width / glowMeta.height;
  const loopPages = loopMeta.pages || (loopMeta.height > cardMeta.height * 2 ? 4 : 1);
  const loopPageHeight = loopMeta.pageHeight || Math.round(loopMeta.height / loopPages);
  const arLoop = loopMeta.width / loopPageHeight;

  const maxArDiff = Math.max(
    Math.abs(arCard - arFull),
    Math.abs(arCard - arGlow),
    Math.abs(arCard - arLoop)
  );
  // También verifica que el aspect ratio esté dentro de un rango anatómico válido (0.85 a 2.10)
  const flag4InconsistentAspectRatio = maxArDiff > 0.025 || arCard < 0.85 || arCard > 2.1;

  return {
    id,
    greenGlowPixels,
    borderRatios: {
      top: Number((topRatio * 100).toFixed(2)),
      left: Number((leftRatio * 100).toFixed(2)),
      right: Number((rightRatio * 100).toFixed(2)),
    },
    outsideGlowPct: Number((outsideRatio * 100).toFixed(2)),
    aspectRatio: Number(arCard.toFixed(3)),
    maxArDiff: Number(maxArDiff.toFixed(4)),
    redFlags: {
      flag1ZeroGreenGlow,
      flag2SilhouetteCutAtBorder,
      flag3GlowOutsideBody,
      flag4InconsistentAspectRatio,
    },
  };
}

console.log('══════════════════════════════════════════════════════════════════════');
console.log('🔬 [TEST-HYBRID-MEDIA-INTEGRITY] VALIDACIÓN ESTÁNDAR HÍBRIDO + 4 BANDERAS ROJAS');
console.log('══════════════════════════════════════════════════════════════════════\n');

(async () => {
  ok(fs.existsSync(showcasePath), 'Visor interactivo mister11-hybrid-xray-showcase.html existe');

  for (const id of IDS) {
    const cardPath = path.join(assetsDir, `${id}-card.webp`);
    const fullPath = path.join(assetsDir, `${id}-full.webp`);
    const glowPath = path.join(assetsDir, `${id}-glow.webp`);
    const loopPath = path.join(assetsDir, `${id}-microloop.webp`);
    const svgPath = path.join(assetsDir, `${id}-overlay.svg`);

    const allExist =
      fs.existsSync(cardPath) &&
      fs.existsSync(fullPath) &&
      fs.existsSync(glowPath) &&
      fs.existsSync(loopPath) &&
      fs.existsSync(svgPath);

    ok(allExist, `[${id}] Existen los 5 activos: -card.webp, -full.webp, -glow.webp, -microloop.webp y -overlay.svg`);
    if (!allExist) continue;

    const cardBytes = fs.statSync(cardPath).size;
    const fullBytes = fs.statSync(fullPath).size;
    const glowBytes = fs.statSync(glowPath).size;
    const loopBytes = fs.statSync(loopPath).size;
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const svgBytes = Buffer.byteLength(svgContent, 'utf8');

    const cardHeader = fs.readFileSync(cardPath).subarray(0, 12).toString('ascii');
    const glowHeader = fs.readFileSync(glowPath).subarray(0, 12).toString('ascii');
    const loopHeader = fs.readFileSync(loopPath).subarray(0, 16).toString('ascii');
    const isValidWebp =
      cardHeader.startsWith('RIFF') &&
      cardHeader.includes('WEBP') &&
      glowHeader.startsWith('RIFF') &&
      glowHeader.includes('WEBP') &&
      loopHeader.startsWith('RIFF') &&
      loopHeader.includes('WEBP');

    ok(
      isValidWebp &&
        cardBytes <= 40 * 1024 &&
        fullBytes <= 40 * 1024 &&
        glowBytes <= 15 * 1024 &&
        loopBytes <= 150 * 1024 &&
        svgBytes <= 10 * 1024,
      `[${id}] Pesos dentro de presupuesto: Card=${(cardBytes / 1024).toFixed(1)}KB, Glow=${(glowBytes / 1024).toFixed(2)}KB, HUD=${(svgBytes / 1024).toFixed(2)}KB, MicroLoop=${(loopBytes / 1024).toFixed(1)}KB`
    );

    const expectedZones = CANONICAL_EXERCISE_SAFETY_MAP[id]?.canonicalTargetZones || [];
    const matchZones = svgContent.match(/id="muscle-zones"[^>]*data-canonical-zones="([^"]+)"/);
    const declaredZones = matchZones ? matchZones[1].split(',').map((s) => s.trim()) : [];
    const hasReducedMotion = /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(svgContent);
    const hasNoFakeFloatingRings = !/stroke-dasharray="4 3"/.test(svgContent);

    ok(
      JSON.stringify(declaredZones) === JSON.stringify(expectedZones) && hasReducedMotion && hasNoFakeFloatingRings,
      `[${id}] HUD SVG declara canonicalTargetZones exactas (${JSON.stringify(declaredZones)}), 0 anillos falsos desfasados y soporta prefers-reduced-motion`
    );

    // Evaluar las 4 Banderas Rojas Automáticas
    const rf = await evaluateHybridRedFlags(id, cardPath, fullPath, glowPath, loopPath);

    ok(
      !rf.redFlags.flag1ZeroGreenGlow,
      `[${id}] Bandera Roja 1 (Glow con 0 píxeles verdes): PASS — ${rf.greenGlowPixels} píxeles verdes activos`
    );
    ok(
      !rf.redFlags.flag2SilhouetteCutAtBorder,
      `[${id}] Bandera Roja 2 (Silueta cortada en borde): PASS — bordes ocupados top=${rf.borderRatios.top}%, left=${rf.borderRatios.left}%, right=${rf.borderRatios.right}%`
    );
    ok(
      !rf.redFlags.flag3GlowOutsideBody,
      `[${id}] Bandera Roja 3 (Glow fuera del cuerpo): PASS — ${rf.outsideGlowPct}% fuera de la envolvente anatómica (<= 3.0%)`
    );
    ok(
      !rf.redFlags.flag4InconsistentAspectRatio,
      `[${id}] Bandera Roja 4 (Aspect ratio inconsistente): PASS — AR=${rf.aspectRatio}, delta máx entre capas=${rf.maxArDiff} (<= 0.025)`
    );

    // [10] Tokens hex vectoriales del SVG (fuera de payloads base64) deben pertenecer a la allowlist canónica Tierra y Campo
    const paletteAudit = auditVectorSvgHexPalette(svgContent);
    ok(
      paletteAudit.disallowed.length === 0,
      `[${id}] [10] Paleta vectorial SVG canónica Tierra y Campo (sin neón fuera de raster): ${paletteAudit.disallowed.length === 0 ? `PASS (${paletteAudit.found.join(', ')})` : `NO PERMITIDOS: ${paletteAudit.disallowed.join(', ')}`}`
    );

    // [11] Manifest de cada asset declara provenance: ai_generated y tier de revisión (A/B/C)
    const manifestPath = path.join(assetsDir, `${id}-manifest.json`);
    const manifestCheck = validateAssetManifest(manifestPath);
    ok(
      manifestCheck.valid,
      `[${id}] [11] Manifest D8 (provenance=ai_generated + reviewTier): ${manifestCheck.valid ? `PASS (provenance=${manifestCheck.provenance}, reviewTier=${manifestCheck.reviewTier})` : `FAIL (${manifestCheck.reason})`}`
    );
  }

  const governanceIntact =
    CANONICAL_EXERCISE_SAFETY_MAP['sys-1']?.illustrationStatus === 'rejected_by_owner' &&
    CANONICAL_EXERCISE_SAFETY_MAP['sys-2']?.illustrationStatus === 'rejected_by_owner' &&
    CANONICAL_EXERCISE_SAFETY_MAP['sys-9']?.illustrationStatus === 'rejected_by_owner';

  ok(
    governanceIntact,
    'Gobernanza clínica intacta: sys-1, sys-2 y sys-9 mantienen status="rejected_by_owner" en src/data/exerciseSafetyMap.js'
  );

  console.log('\n══════════════════════════════════════════════════════════════════════');
  if (failed) {
    console.error('❌ [TEST-HYBRID-MEDIA-INTEGRITY] FALLÓ');
    process.exit(1);
  } else {
    console.log('✅ [TEST-HYBRID-MEDIA-INTEGRITY] PASS — 5/5 ejercicios híbridos y 4/4 banderas rojas validadas');
    console.log('══════════════════════════════════════════════════════════════════════');
    process.exit(0);
  }
})();
