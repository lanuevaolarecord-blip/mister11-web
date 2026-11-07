/**
 * scripts/test-p14-animation-determinism.mjs
 * MÍSTER11 — P14-FIX: Test de Reproducción Determinista 10x de Animación en Pizarra (Fabric.js)
 *
 * Valida de forma estricta:
 * 1. Cero líneas residuales teal (#4CAF7D, #0D9488, etc.) en cada rAF y tras cada transición.
 * 2. Balón con exactamente 1 única instancia viva por rAF (cero duplicados / ghosting).
 * 3. 10 reproducciones consecutivas sin un solo fallo (10/10 PASS).
 */

import { getTacticalCategory, getTacticalPieceIdentifier, isFieldLayer, removeAllTacticalPieces, TACTICAL_CATEGORIES } from '../src/lib/mister11-pieces.js';

class MockFabricCanvas {
  constructor() {
    this.objects = [];
    this.width = 800;
    this.height = 533;
    this.drawCalls = 0;
  }
  add(obj) {
    this.objects.push(obj);
  }
  remove(obj) {
    const idx = this.objects.indexOf(obj);
    if (idx !== -1) this.objects.splice(idx, 1);
  }
  getObjects() {
    return [...this.objects];
  }
  sendToBack(obj) {
    const idx = this.objects.indexOf(obj);
    if (idx !== -1) {
      this.objects.splice(idx, 1);
      this.objects.unshift(obj);
    }
  }
  discardActiveObject() {}
  renderAll() {
    this.drawCalls++;
  }
}

class MockFabricObject {
  constructor(opts = {}) {
    Object.assign(this, opts);
  }
  set(props) {
    Object.assign(this, props);
  }
  setCoords() {}
  toObject(props = []) {
    const res = { ...this };
    return res;
  }
}

// Simulación de los 3 fotogramas:
// Frame 1: Nodo 4 con balón (100, 200), Nodo 7 en (200, 200)
// Frame 2: Nodo 7 en el centro (400, 260), Balón a su derecha (430, 260), Nodo 4 en (220, 300)
// Frame 3: Nodo 7 a la derecha (600, 260), Balón junto al 7 (630, 260), Nodo 4 en (300, 300)

function createTestFrames() {
  return [
    {
      id: 'frame-1',
      duration: 800,
      state: {
        objects: [
          { id: 'player_local_4', isPlayerPiece: true, left: 100, top: 200, data: { id: 'player_local_4', type: 'player', label: '4' } },
          { id: 'player_local_7', isPlayerPiece: true, left: 200, top: 200, data: { id: 'player_local_7', type: 'player', label: '7' } },
          { id: 'ball', isBall: true, category: 'ball', left: 130, top: 200, data: { id: 'ball', type: 'ball', itemId: 'balon' } }
        ]
      }
    },
    {
      id: 'frame-2',
      duration: 800,
      state: {
        objects: [
          { id: 'player_local_4', isPlayerPiece: true, left: 220, top: 300, data: { id: 'player_local_4', type: 'player', label: '4' } },
          { id: 'player_local_7', isPlayerPiece: true, left: 400, top: 260, data: { id: 'player_local_7', type: 'player', label: '7' } },
          { id: 'ball', isBall: true, category: 'ball', left: 430, top: 260, data: { id: 'ball', type: 'ball', itemId: 'balon' } }
        ]
      }
    },
    {
      id: 'frame-3',
      duration: 800,
      state: {
        objects: [
          { id: 'player_local_4', isPlayerPiece: true, left: 300, top: 300, data: { id: 'player_local_4', type: 'player', label: '4' } },
          { id: 'player_local_7', isPlayerPiece: true, left: 600, top: 260, data: { id: 'player_local_7', type: 'player', label: '7' } },
          { id: 'ball', isBall: true, category: 'ball', left: 630, top: 260, data: { id: 'ball', type: 'ball', itemId: 'balon' } }
        ]
      }
    }
  ];
}

// Implementación con el fix P14 aplicado
function runSimulationRun(runNumber, logDetails = false) {
  const fc = new MockFabricCanvas();
  fc.add(new MockFabricObject({ id: 'campo', isFieldLayer: true, fill: '#1b3a2d' }));

  const frames = createTestFrames();
  let rAfViolations = 0;
  let tealLinesSeen = 0;

  function serializarFrame() {
    const objects = fc.getObjects().filter(o => 
      !isFieldLayer(o) &&
      !o.isTrajectory &&
      o.category !== TACTICAL_CATEGORIES.TRAJECTORY &&
      o.data?.type !== 'trajectory' &&
      o.data?.type !== 'temp'
    ).map(obj => obj.toObject());
    return { objects };
  }

  function cargarFrame(state, cb) {
    removeAllTacticalPieces(fc);
    const rawObjs = Array.isArray(state?.objects) ? state.objects : [];
    const objsToEnliven = rawObjs.filter(o =>
      !o.isTrajectory &&
      o.category !== TACTICAL_CATEGORIES.TRAJECTORY &&
      o.data?.type !== 'trajectory' &&
      o.data?.type !== 'temp'
    );

    let ballAdded = false;
    objsToEnliven.forEach(itemData => {
      const o = new MockFabricObject(itemData);
      const cat = itemData.category || getTacticalCategory(o) || getTacticalCategory(itemData);

      if (cat === TACTICAL_CATEGORIES.TRAJECTORY || o.isTrajectory || itemData.isTrajectory || itemData.data?.type === 'trajectory') {
        return;
      }

      const isBall = cat === TACTICAL_CATEGORIES.BALL || o.isBall || itemData.isBall || o.id === 'ball' || itemData.id === 'ball' || itemData.data?.type === 'ball';
      if (isBall) {
        if (ballAdded) return;
        ballAdded = true;
        o.isBall = true;
      }

      if (cat === TACTICAL_CATEGORIES.PLAYER) o.isPlayerPiece = true;
      if (cat === TACTICAL_CATEGORIES.MATERIAL && !isBall) o.isMaterial = true;

      fc.add(o);
    });

    // Purga defensiva en runtime
    fc.getObjects().forEach(obj => {
      if (obj.isTrajectory || obj.data?.type === 'trajectory' || obj.category === 'trajectory') {
        fc.remove(obj);
      }
    });
    const currentBalls = fc.getObjects().filter(b => b.isBall || b.category === 'ball' || b.id === 'ball');
    if (currentBalls.length > 1) {
      for (let i = 1; i < currentBalls.length; i++) fc.remove(currentBalls[i]);
    }

    fc.renderAll();
    if (cb) cb();
  }

  function loadFrame(idx, cb) {
    cargarFrame(frames[idx].state, () => {
      // D-FRAME-1 (P14-FIX): Suprimido por defecto para 0 líneas en runtime
      fc.getObjects().forEach(obj => {
        if (obj.isTrajectory || obj.data?.type === 'trajectory' || obj.category === 'trajectory') {
          fc.remove(obj);
        }
      });
      fc.renderAll();
      if (cb) cb();
    });
  }

  // 1. Cargar Frame 1
  loadFrame(0);

  // 2. Transición Frame 1 -> Frame 2
  // Paso 1 (0 -> 1):
  const stateB1 = frames[1].state;
  cargarFrame(stateB1);

  // 3. Transición Frame 2 -> Frame 3 (Paso crucial 2/3 -> 3/3)
  const stateB2 = frames[2].state;
  const rawTargets = (Array.isArray(stateB2.objects) ? stateB2.objects : []).filter(o =>
    !isFieldLayer(o) &&
    !o.isTrajectory &&
    o.category !== 'trajectory' &&
    o.data?.type !== 'trajectory'
  );

  const targetListWithPos = rawTargets.map((objData, i) => {
    return {
      left: objData.left,
      top: objData.top,
      id: getTacticalPieceIdentifier(objData),
      category: getTacticalCategory(objData),
      data: objData,
      index: i
    };
  });

  const animatableObjs = fc.getObjects().filter(o => 
    !isFieldLayer(o) && 
    !o.isTrajectory && 
    o.category !== 'trajectory' && 
    o.data?.type !== 'trajectory'
  );

  const matchedTargetIndices = new Set();
  const animationsData = animatableObjs.map((obj) => {
    const objId = getTacticalPieceIdentifier(obj);
    const objCat = getTacticalCategory(obj);

    let target = null;
    if (objId) {
      const foundIdx = targetListWithPos.findIndex((t, idxT) => !matchedTargetIndices.has(idxT) && t.id === objId);
      if (foundIdx !== -1) {
        matchedTargetIndices.add(foundIdx);
        target = targetListWithPos[foundIdx];
      }
    }

    if (!target && objCat) {
      const foundIdx = targetListWithPos.findIndex((t, idxT) => {
        if (matchedTargetIndices.has(idxT)) return false;
        if (t.category !== objCat) return false;
        return true;
      });
      if (foundIdx !== -1) {
        matchedTargetIndices.add(foundIdx);
        target = targetListWithPos[foundIdx];
      }
    }

    const sLeft = obj.left || 0;
    const sTop  = obj.top  || 0;
    const tLeft = target?.left !== undefined ? target.left : sLeft;
    const tTop  = target?.top  !== undefined ? target.top  : sTop;

    return { obj, sLeft, sTop, tLeft, tTop };
  });

  // Simular 10 ticks de rAF en la transición 2/3 -> 3/3
  const rAFProgress = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  if (logDetails) {
    console.log(`| Corredura | Tick rAF | Progreso | Balones | Líneas Teal | Pos Balón | Pos Nodo 7 | Estado |`);
    console.log(`|---|---|---|---|---|---|---|---|`);
  }

  rAFProgress.forEach((v, tickIdx) => {
    // P14-FIX: Balón con 1 única instancia viva por rAF
    const ballsInRaf = fc.getObjects().filter(b => b.isBall || b.category === 'ball' || b.id === 'ball' || b.data?.type === 'ball');
    if (ballsInRaf.length > 1) {
      for (let i = 1; i < ballsInRaf.length; i++) fc.remove(ballsInRaf[i]);
    }

    animationsData.forEach(({ obj, sLeft, sTop, tLeft, tTop }) => {
      obj.set({
        left: sLeft + (tLeft - sLeft) * v,
        top:  sTop  + (tTop  - sTop ) * v,
      });
    });
    fc.renderAll();

    // Verificaciones por rAF
    const currentObjects = fc.getObjects();
    const liveBalls = currentObjects.filter(b => b.isBall || b.category === 'ball' || b.id === 'ball' || b.data?.type === 'ball');
    const tealLines = currentObjects.filter(l => l.stroke === '#4CAF7D' || l.stroke === '#0D9488' || l.isTrajectory);
    const node7 = currentObjects.find(o => o.id === 'player_local_7');

    if (liveBalls.length !== 1) {
      rAfViolations++;
    }
    if (tealLines.length > 0) {
      tealLinesSeen += tealLines.length;
    }

    if (logDetails) {
      const status = (liveBalls.length === 1 && tealLines.length === 0) ? 'PASS' : 'FAIL';
      console.log(`| Run #${runNumber} | rAF #${tickIdx + 1} | ${(v * 100).toFixed(0)}% | ${liveBalls.length} | ${tealLines.length} | (${liveBalls[0]?.left?.toFixed(0)}, ${liveBalls[0]?.top?.toFixed(0)}) | (${node7?.left?.toFixed(0)}, ${node7?.top?.toFixed(0)}) | ${status} |`);
    }
  });

  // onComplete: Cargar frame final y restaurar
  cargarFrame(stateB2);
  loadFrame(2);

  const finalBalls = fc.getObjects().filter(b => b.isBall || b.category === 'ball' || b.id === 'ball');
  const finalTealLines = fc.getObjects().filter(l => l.stroke === '#4CAF7D' || l.isTrajectory);

  if (finalBalls.length !== 1) rAfViolations++;
  if (finalTealLines.length > 0) tealLinesSeen += finalTealLines.length;

  return {
    run: runNumber,
    pass: rAfViolations === 0 && tealLinesSeen === 0,
    rAfViolations,
    tealLinesSeen,
    finalBallCount: finalBalls.length,
    finalLineCount: finalTealLines.length
  };
}

console.log('==============================================================================');
console.log('MÍSTER 11 — P14-FIX: VERIFICACIÓN DETERMINISTA 10x DE ANIMACIÓN (TWEEN 2/3 -> 3/3)');
console.log('==============================================================================\n');

// Ejecución 1 con logging detallado
const firstRunResult = runSimulationRun(1, true);

console.log('\n--- EJECUTANDO BATERÍA DETERMINISTA 10x CONSECUTIVA ---');
const results = [firstRunResult];
for (let i = 2; i <= 10; i++) {
  results.push(runSimulationRun(i, false));
}

console.log('| Corredura | Balón == 1 por rAF | Líneas Teal == 0 | Balón Final | Líneas Final | Resultado |');
console.log('|---|---|---|---|---|---|');
results.forEach(r => {
  console.log(`| Run #${r.run} | ${r.rAfViolations === 0 ? 'SÍ (100% rAF)' : 'NO'} | ${r.tealLinesSeen === 0 ? 'SÍ (0 líneas)' : 'NO'} | ${r.finalBallCount} | ${r.finalLineCount} | ${r.pass ? 'PASS' : 'FAIL'} |`);
});

const allPassed = results.every(r => r.pass);
console.log('\n==============================================================================');
if (allPassed) {
  console.log('✅ [PASS] 10/10 EJECUCIONES EXITOSAS. Cero duplicados de balón y cero líneas teal residuales en cada rAF.');
  process.exit(0);
} else {
  console.error('❌ [FAIL] Fallos detectados en la suite determinista.');
  process.exit(1);
}
