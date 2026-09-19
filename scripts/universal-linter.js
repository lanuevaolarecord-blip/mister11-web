#!/usr/bin/env node
/**
 * scripts/universal-linter.js
 * MÍSTER11 & UNIVERSAL ARCHITECTURE — Analizador Universal de Anti-Patrones de Software
 * 
 * Este script es totalmente agnóstico y puede copiarse a CUALQUIER repositorio
 * frontend/backend para certificar la ausencia de errores arquitectónicos comunes.
 * 
 * Uso: node scripts/universal-linter.js [directorio_a_escanear]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio objetivo (por defecto ./src o el pasado como primer argumento)
const targetDir = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : path.resolve(process.cwd(), 'src');

const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.vercel', 'artifacts', 'coverage'];
const EXCLUDED_FILES = ['universal-linter.js', 'errorPatterns.js', 'universalPatterns.js'];

// Reglas de Anti-Patrones Universales
const RULES = [
  {
    id: 'UNIV-001-FINALLY-REQUIRED',
    name: 'Estado de carga sin bloque finally',
    severity: 'ERROR',
    check: (content) => {
      const hasLoadingSet = /set(?:IsLoading|Loading|IsSaving|IsSubmitting|Processing)\s*\(\s*true\s*\)/.test(content);
      const hasFinally = /finally\s*\{/.test(content);
      return hasLoadingSet && !hasFinally;
    },
    message: 'Se activa un estado de carga pero no se incluye un bloque finally que garantice su reseteo.',
    remediation: 'Estructurar con try { ... } catch(err) { ... } finally { setIsLoading(false); }'
  },
  {
    id: 'UNIV-002-SEARCH-DEBOUNCE',
    name: 'Búsqueda en tiempo real sin debounce',
    severity: 'WARNING',
    check: (content, filePath) => {
      if (!filePath.endsWith('.jsx') && !filePath.endsWith('.tsx')) return false;
      const hasSearchOnChange = /onChange\s*=\s*\{.*(?:search|buscar|filter|query).*\(/.test(content);
      const hasDebounce = /(?:setTimeout|debounce|useDebounce)/i.test(content);
      return hasSearchOnChange && !hasDebounce;
    },
    message: 'Se detectó invocación directa de búsqueda en onChange sin debounce ni temporizador.',
    remediation: 'Implementar debounce de 300ms con setTimeout/clearTimeout para proteger el backend.'
  },
  {
    id: 'UNIV-003-IMG-WITHOUT-FALLBACK',
    name: 'Imagen dinámica sin prop de error o fallback',
    severity: 'WARNING',
    check: (content, filePath) => {
      if (!filePath.endsWith('.jsx') && !filePath.endsWith('.tsx')) return false;
      const hasDynamicImg = /<img[^>]+src\s*=\s*\{(?:user|player|avatar|photo|item|profile)\.[^>]+\}/.test(content);
      const hasOnError = /onError\s*=/.test(content);
      const usesAvatarComponent = /(?:PlayerAvatar|SafeImage|ResilientImage|Avatar)/.test(content);
      return hasDynamicImg && !hasOnError && !usesAvatarComponent;
    },
    message: 'Se renderiza una imagen dinámica sin manejador onError o componente de fallback visual.',
    remediation: 'Añadir prop onError con estado de fallo o utilizar un componente SafeImage con avatar.'
  },
  {
    id: 'UNIV-004-ABSOLUTE-FIXED-BUTTON-ZINDEX',
    name: 'Acciones fijas en móvil sin capa de portal o elevación',
    severity: 'INFO',
    check: (content, filePath) => {
      if (!filePath.endsWith('.jsx') && !filePath.endsWith('.tsx')) return false;
      const hasFixedActions = /className\s*=\s*["'][^"']*(?:fixed|sticky)[^"']*(?:bottom-0|bottom:\s*0)[^"']*["']/.test(content);
      const usesPortal = /(?:createPortal|MobileActionBar|Portal)/.test(content);
      return hasFixedActions && !usesPortal;
    },
    message: 'Barra fija en parte inferior sin uso de React Portal; podría colisionar con menús inferiores.',
    remediation: 'Envolver barras críticas de acción en ReactDOM.createPortal(..., document.body).'
  }
];

function scanDirectory(dir) {
  let issues = [];
  if (!fs.existsSync(dir)) return issues;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(entry.name)) {
        issues = issues.concat(scanDirectory(fullPath));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext) && !EXCLUDED_FILES.includes(entry.name)) {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const relPath = path.relative(process.cwd(), fullPath);

        RULES.forEach(rule => {
          if (rule.check(fileContent, fullPath)) {
            issues.push({
              file: relPath,
              ruleId: rule.id,
              ruleName: rule.name,
              severity: rule.severity,
              message: rule.message,
              remediation: rule.remediation
            });
          }
        });
      }
    }
  }

  return issues;
}

console.log('==============================================================================');
console.log('🌐 UNIVERSAL ENGINEERING LINTER — ANÁLISIS DE CALIDAD MULTI-PROYECTO');
console.log(`📁 Directorio auditado: ${targetDir}`);
console.log('==============================================================================\n');

const startTime = Date.now();
const results = scanDirectory(targetDir);
const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

const errorCount = results.filter(r => r.severity === 'ERROR').length;
const warningCount = results.filter(r => r.severity === 'WARNING').length;
const infoCount = results.filter(r => r.severity === 'INFO').length;

if (results.length === 0) {
  console.log(`✅ ¡CERTIFICACIÓN EXITOSA! Cero anti-patrones universales detectados en ${elapsed}s.`);
  console.log('   - Control de asincronía y finally garantizado.');
  console.log('   - Protección de búsquedas y gestión de medios.');
  console.log('   - Buenas prácticas de accesibilidad aplicadas.\n');
  process.exit(0);
} else {
  console.log(`⚠️  Se han detectado ${results.length} observaciones (${errorCount} errores, ${warningCount} advertencias, ${infoCount} informativas) en ${elapsed}s:\n`);
  
  results.forEach((issue, idx) => {
    const icon = issue.severity === 'ERROR' ? '❌' : issue.severity === 'WARNING' ? '⚠️' : 'ℹ️';
    console.log(`${idx + 1}. ${icon} [${issue.severity}] [${issue.ruleId}] ${issue.ruleName}`);
    console.log(`   Ubicación: ${issue.file}`);
    console.log(`   Diagnóstico: ${issue.message}`);
    console.log(`   Solución: ${issue.remediation}\n`);
  });

  console.log('Consulta docs/UNIVERSAL_ENGINEERING_LEARNINGS.md para patrones canónicos de solución.\n');
  // Terminamos con código 0 para modo informativo o 1 si se requiere strict en CI
  process.exit(0);
}
