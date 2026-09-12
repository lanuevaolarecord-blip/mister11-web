/**
 * scripts/check-circular-deps.mjs
 * Míster11 — Verificador Estricto de Dependencias Circulares en Componentes Canónicos & Utils
 *
 * Analiza el grafo de dependencias de archivos en src/components/canonical, src/utils y src/config.
 * Si detecta ciclos, imprime los archivos involucrados y finaliza con código 1.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const TARGET_DIRS = [
  path.join(projectRoot, 'src', 'components', 'canonical'),
  path.join(projectRoot, 'src', 'utils'),
  path.join(projectRoot, 'src', 'config')
];

const EXTENSIONS = ['.js', '.jsx', '.mjs', '.ts', '.tsx'];

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function resolveImport(sourceFile, importPath) {
  if (!importPath.startsWith('.')) {
    // Es una dependencia externa o alias absoluto
    return null;
  }
  const sourceDir = path.dirname(sourceFile);
  const candidate = path.resolve(sourceDir, importPath);

  // Comprobar archivo exacto
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  // Comprobar con extensiones
  for (const ext of EXTENSIONS) {
    if (fs.existsSync(candidate + ext)) {
      return candidate + ext;
    }
  }

  // Comprobar como directorio index
  for (const ext of EXTENSIONS) {
    const indexCandidate = path.join(candidate, `index${ext}`);
    if (fs.existsSync(indexCandidate)) {
      return indexCandidate;
    }
  }

  return null;
}

function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex = /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"])|(?:export\s+[\w*\s{},]*\s+from\s+['"]([^'"]+)['"])/g;
  const imports = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1] || match[2];
    if (importPath) {
      const resolved = resolveImport(filePath, importPath);
      if (resolved) {
        imports.push(resolved);
      }
    }
  }
  return imports;
}

function buildDependencyGraph(files) {
  const graph = new Map();
  for (const file of files) {
    const dependencies = extractImports(file);
    graph.set(file, dependencies);
  }
  return graph;
}

function findCycles(graph) {
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(node, currentPath) {
    visited.add(node);
    recursionStack.add(node);
    currentPath.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, currentPath);
      } else if (recursionStack.has(neighbor)) {
        const cycleStartIndex = currentPath.indexOf(neighbor);
        const cycle = currentPath.slice(cycleStartIndex).concat(neighbor);
        cycles.push(cycle);
      }
    }

    currentPath.pop();
    recursionStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

console.log('==============================================================================');
console.log('MÍSTER 11 — AUDITORÍA DE DEPENDENCIAS CIRCULARES (CANONICAL & UTILS)');
console.log('==============================================================================');

const files = TARGET_DIRS.flatMap(d => getAllFiles(d));
console.log(`📁 Analizando ${files.length} módulos en src/components/canonical, src/utils, src/config...`);

const graph = buildDependencyGraph(files);
const cycles = findCycles(graph);

if (cycles.length > 0) {
  console.error(`\n❌ SE DETECTARON ${cycles.length} CICLOS DE DEPENDENCIAS CIRCULARES:`);
  cycles.forEach((cycle, idx) => {
    console.error(`\nCiclo #${idx + 1}:`);
    cycle.forEach(f => {
      console.error(`  → ${path.relative(projectRoot, f)}`);
    });
  });
  process.exit(1);
} else {
  console.log('✅ CERO DEPENDENCIAS CIRCULARES ENCONTRADAS. Arquitectura limpia y desacoplada.');
  process.exit(0);
}
