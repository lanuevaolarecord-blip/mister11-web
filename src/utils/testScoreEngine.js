/**
 * MOTOR CANÓNICO UNIFICADO DE PUNTUACIONES Y BAREMOS DE TESTS (MÍSTER11)
 * 
 * Garantiza coincidencia matemática absoluta (100% de paridad) entre:
 * 1. Módulo del Entrenador (Tests.jsx)
 * 2. Portal del Jugador - Perfil y Hero Banner (PlayerPerformanceBanner.jsx)
 * 3. Portal del Jugador - Pestaña Estadísticas y Radar (PlayerStatsTab.jsx)
 * 4. Modal de Analíticas del Jugador (PlayerAnalyticsModal.jsx)
 */

export const CANONICAL_TESTS_MAP = {
  // Pruebas Físicas
  't1': { name: 'Test de Cooper', type: 'fisico', category: 'Resistencia', unit: 'm', isTime: false },
  't2': { name: 'Course Navette', type: 'fisico', category: 'Resistencia', unit: 'nivel', isTime: false },
  't3': { name: 'Sprint 10m', type: 'fisico', category: 'Velocidad', unit: 'seg', isTime: true },
  't4': { name: 'Sprint 30m', type: 'fisico', category: 'Velocidad', unit: 'seg', isTime: true },
  't5': { name: 'T-Test (Agilidad)', type: 'fisico', category: 'Agilidad', unit: 'seg', isTime: true },
  't6': { name: 'Salto CMJ', type: 'fisico', category: 'Fuerza', unit: 'cm', isTime: false },
  
  // Pruebas Técnicas
  't7': { name: 'Conducción conos', type: 'tecnico', category: 'Técnica', unit: 'seg', isTime: true },
  't8': { name: 'Pase a portería', type: 'tecnico', category: 'Técnica', unit: 'pts', isTime: false },

  // Cuestionarios Psicodeportivos
  'psi1': { name: 'ACSI-28 (Afrontamiento)', type: 'psicodeportivo', category: 'Afrontamiento', unit: 'pts', maxScore: 32 },
  'psi2': { name: 'MTQ-10 (Fortaleza Mental)', type: 'psicodeportivo', category: 'Fortaleza Mental', unit: 'pts', maxScore: 20 },
  'psi3': { name: 'Establecimiento de Metas', type: 'psicodeportivo', category: 'Metas', unit: 'pts', maxScore: 15 },
  'psi4': { name: 'Liderazgo y Comunicación', type: 'psicodeportivo', category: 'Liderazgo', unit: 'pts', maxScore: 15 },
  'psi_acsi28': { name: 'ACSI-28 (Afrontamiento)', type: 'psicodeportivo', category: 'Afrontamiento', unit: 'pts', maxScore: 112 },
  'psi_ires': { name: 'IRES (Resiliencia)', type: 'psicodeportivo', category: 'Resiliencia', unit: 'pts', maxScore: 76 },
  'psi_gets': { name: 'GETS (Trabajo en Equipo)', type: 'psicodeportivo', category: 'Trabajo en Equipo', unit: 'pts', maxScore: 50 },
  'psi_acsi28_auto': { name: 'ACSI-28 (Afrontamiento)', type: 'psicodeportivo', category: 'Afrontamiento', unit: 'pts', maxScore: 32 },
  'psi_mtq10_auto': { name: 'MTQ-10 (Fortaleza Mental)', type: 'psicodeportivo', category: 'Fortaleza Mental', unit: 'pts', maxScore: 20 },
  'psi_metas_auto': { name: 'Establecimiento de Metas', type: 'psicodeportivo', category: 'Metas', unit: 'pts', maxScore: 15 },

  // Cuestionarios Socioemocionales
  'soc1': { name: 'GEQ (Cohesión de Equipo)', type: 'sociodeportivo', category: 'Cohesión', unit: 'pts', maxScore: 20 },
  'soc2': { name: 'Escala Bienestar Mental (MHC-SF)', type: 'sociodeportivo', category: 'Bienestar', unit: 'pts', maxScore: 15 },
  'soc3': { name: 'Autoconciencia Emocional', type: 'sociodeportivo', category: 'Autoconciencia', unit: 'pts', maxScore: 15 },
  'soc4': { name: 'Empatía Deportiva', type: 'sociodeportivo', category: 'Empatía', unit: 'pts', maxScore: 10 },
  'soc5': { name: 'Resolución de Conflictos', type: 'sociodeportivo', category: 'Conflictos', unit: 'pts', maxScore: 15 },
  'soc_cwms': { name: 'CWMS (Bienestar Mental)', type: 'sociodeportivo', category: 'Bienestar', unit: 'pts', maxScore: 70 },
  'soc_eced': { name: 'ECED (Cohesión)', type: 'sociodeportivo', category: 'Cohesión', unit: 'pts', maxScore: 84 },
  'soc_edl': { name: 'EDL (Deporte Limpio)', type: 'sociodeportivo', category: 'Convivencia', unit: 'pts', maxScore: 40 },
  'soc_geq_auto': { name: 'GEQ (Cohesión de Equipo)', type: 'sociodeportivo', category: 'Cohesión', unit: 'pts', maxScore: 16 },
  'soc_mhc_auto': { name: 'MHC-SF (Bienestar)', type: 'sociodeportivo', category: 'Bienestar', unit: 'pts', maxScore: 12 },
};

/**
 * Normaliza cualquier prueba o cuestionario a una escala estándar de 10 a 99 puntos.
 */
export const normalizeTestValue = (val, testId = '', unit = '', rawItem = {}) => {
  // 1. Si ya tiene porcentaje explícito o nota calculada (0-100)
  if (rawItem?.percentage !== undefined && rawItem.percentage !== null && !isNaN(Number(rawItem.percentage))) {
    return Math.min(99, Math.max(10, Math.round(Number(rawItem.percentage))));
  }
  if (rawItem?.nota !== undefined && rawItem.nota !== null && !isNaN(Number(rawItem.nota))) {
    return Math.min(99, Math.max(10, Math.round(Number(rawItem.nota))));
  }

  // 2. Si tiene score y maxScore (cuestionarios con puntos brutos)
  const score = rawItem?.score !== undefined ? Number(rawItem.score) : Number(rawItem?.puntuacionTotal);
  const maxScore = rawItem?.maxScore !== undefined ? Number(rawItem.maxScore) : (rawItem?.puntuacionMaxima || CANONICAL_TESTS_MAP[testId]?.maxScore);
  if (!isNaN(score) && !isNaN(maxScore) && maxScore > 0) {
    return Math.min(99, Math.max(10, Math.round((score / maxScore) * 100)));
  }

  const num = parseFloat(String(val !== undefined ? val : (rawItem?.val !== undefined ? rawItem.val : (rawItem?.score || 0))).replace(',', '.')) || 0;
  const id = String(testId || rawItem?.testId || '').toLowerCase();
  const u = String(unit || rawItem?.unit || CANONICAL_TESTS_MAP[id]?.unit || '').toLowerCase();

  // 3. Pruebas específicas con baremos deportivos
  if (id === 't1' || id.includes('cooper')) {
    // Cooper: 1600m = 50, 2400m = 80, 2800m = 93, 3000m = 99
    return Math.min(99, Math.max(10, Math.round((num / 3000) * 100)));
  }
  if (id === 't2' || id.includes('navette') || id.includes('beep')) {
    // Course Navette: palier 4 = 45, palier 8 = 70, palier 11 = 88, palier 13+ = 99
    return Math.min(99, Math.max(10, Math.round((num / 13) * 100)));
  }
  if (id === 't3' || id.includes('sprint_10') || id.includes('sprint10')) {
    // Sprint 10m: 1.5s = 98, 1.8s = 85, 2.0s = 75, 2.3s = 60, 2.7s = 40
    return Math.min(99, Math.max(10, Math.round(100 - (num - 1.4) * 45)));
  }
  if (id === 't4' || id.includes('sprint_30') || id.includes('sprint30')) {
    // Sprint 30m: 3.8s = 98, 4.2s = 85, 4.6s = 72, 5.0s = 60, 5.5s = 45
    return Math.min(99, Math.max(10, Math.round(100 - (num - 3.6) * 28)));
  }
  if (id === 't5' || id.includes('t_test') || id.includes('ttest')) {
    // T-Test agilidad: 9.0s = 98, 10.5s = 82, 12.0s = 65, 14.0s = 45
    return Math.min(99, Math.max(10, Math.round(100 - (num - 8.5) * 10)));
  }
  if (id === 't6' || id.includes('cmj') || id.includes('salto')) {
    // Salto CMJ: 20cm = 45, 35cm = 72, 45cm = 88, 55cm = 99
    return Math.min(99, Math.max(10, Math.round((num / 50) * 100)));
  }
  if (id === 't7' || id.includes('conos') || id.includes('dribbling')) {
    // Conducción conos: 7.5s = 98, 9.0s = 85, 11.0s = 70, 13.0s = 50
    return Math.min(99, Math.max(10, Math.round(100 - (num - 7.0) * 8)));
  }
  if (id === 't8' || id.includes('porteria') || id.includes('pase')) {
    // Pase a portería (0 a 10 pts): 8 pts = 80
    return Math.min(99, Math.max(10, num <= 10 ? Math.round(num * 10) : Math.round(num)));
  }

  // 4. Baremos genéricos por unidad
  if (u.includes('seg') || u === 's') {
    return Math.min(99, Math.max(10, Math.round(100 - (num * 5))));
  }
  if (u === 'cm') {
    return Math.min(99, Math.max(10, Math.round((num / 50) * 100)));
  }
  if (u === 'm') {
    return Math.min(99, Math.max(10, Math.round((num / (num > 500 ? 3000 : 50)) * 100)));
  }
  if (u === 'nivel') {
    return Math.min(99, Math.max(10, Math.round((num / 13) * 100)));
  }
  if (num <= 10 && num > 0) {
    return Math.min(99, Math.max(10, Math.round(num * 10)));
  }
  if (num <= 100 && num > 0) {
    return Math.min(99, Math.max(10, Math.round(num)));
  }

  return Math.min(99, Math.max(10, 70));
};

/**
 * Extrae de forma segura y consistente un timestamp numérico (milisegundos) de cualquier
 * objeto de evaluación o test de Firestore (soporta Timestamps, Date strings, etc.).
 */
export const getSafeTimestamp = (item) => {
  if (!item) return 0;
  if (item.timestamp?.seconds) return item.timestamp.seconds * 1000;
  if (typeof item.timestamp?.toDate === 'function') return item.timestamp.toDate().getTime();
  if (item.createdAt?.seconds) return item.createdAt.seconds * 1000;
  if (typeof item.createdAt?.toDate === 'function') return item.createdAt.toDate().getTime();
  if (item.fechaActualizacion?.seconds) return item.fechaActualizacion.seconds * 1000;
  if (typeof item.fechaActualizacion?.toDate === 'function') return item.fechaActualizacion.toDate().getTime();
  const raw = item.date || item.fecha;
  if (typeof raw === 'string' && raw.trim()) {
    const cleanStr = raw.trim();
    if (cleanStr.includes('/')) {
      const parts = cleanStr.split('/');
      if (parts.length === 3) {
        // Formato DD/MM/YYYY
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(d.getTime())) return d.getTime();
      }
    }
    const parsed = new Date(cleanStr).getTime();
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
};

/**
 * Consolida deduplicando evaluaciones de todas las fuentes posibles (evaluaciones, test_results y subcolección de jugador).
 */
export const consolidatePlayerEvaluations = (rawItems = [], playerId = '') => {
  const targetPid = playerId ? String(playerId) : '';
  const aliasMap = {
    'psi_acsi28_auto': 'psi1',
    'psi_mtq10_auto': 'psi2',
    'soc_geq_auto': 'soc1',
    'soc_mhc_auto': 'soc2',
    'psi_acsi28': 'psi1',
    'psi_mtq10': 'psi2',
    'soc_geq': 'soc1',
    'soc_cwms': 'soc2'
  };

  const filtered = rawItems.filter(item => {
    if (!item) return false;
    if (!targetPid) return true;
    const pId = String(item.playerId || item.jugadorId || item.player?.id || '');
    return !pId || pId === targetPid || Boolean(item.players?.[targetPid]);
  });

  // Ordenar cronológicamente ascendente usando getSafeTimestamp para que el desempate sea 100% determinista
  const sorted = [...filtered].sort((a, b) => {
    const tsA = getSafeTimestamp(a);
    const tsB = getSafeTimestamp(b);
    if (tsA !== tsB) return tsA - tsB;

    // Si tienen la misma fecha o timestamp, priorizar registros oficiales del cuerpo técnico sobre tests autónomos
    const aIsStaff = a.tipo !== 'psicologico_auto' && !a.isAutonomous;
    const bIsStaff = b.tipo !== 'psicologico_auto' && !b.isAutonomous;
    if (aIsStaff && !bIsStaff) return 1;
    if (!aIsStaff && bIsStaff) return -1;

    // Si ambos son del mismo tipo, priorizar mayor nota
    const scoreA = Number(a.val ?? a.nota ?? a.percentage ?? a.score ?? 0);
    const scoreB = Number(b.val ?? b.nota ?? b.percentage ?? b.score ?? 0);
    return scoreA - scoreB;
  });

  return sorted.map(item => {
    const rawId = String(item.testId || item.testName || 'test_general');
    const testId = aliasMap[rawId] || rawId;
    
    // Resolución unificada de valor sin alterar ni degradar propiedades
    const rawVal = item.val !== undefined 
      ? item.val 
      : (item.nota !== undefined 
        ? item.nota 
        : (item.percentage !== undefined 
          ? item.percentage 
          : (item.score !== undefined ? item.score : (item.puntuacionTotal || 0))));
    const parsedVal = parseFloat(String(rawVal).replace(',', '.')) || 0;
    const rawDate = item.date || item.fecha;

    const resolvedNota = item.nota !== undefined ? Number(item.nota) : (item.percentage !== undefined ? Number(item.percentage) : (item.val !== undefined ? Number(item.val) : undefined));
    const resolvedPercentage = item.percentage !== undefined ? Number(item.percentage) : resolvedNota;

    return {
      ...item,
      testId,
      rawTestId: rawId,
      val: parsedVal,
      score: item.score !== undefined ? Number(item.score) : parsedVal,
      percentage: resolvedPercentage,
      nota: resolvedNota,
      date: rawDate,
      _safeTimestamp: getSafeTimestamp(item)
    };
  });
};

/**
 * Calcula la puntuación cognitiva normalizada (0-99) a partir del estado de cognitive del jugador
 */
export const calculatePlayerCognitiveScore = (player = {}) => {
  if (player?.cognitiveScore !== undefined && !isNaN(Number(player.cognitiveScore))) {
    return Number(player.cognitiveScore);
  }
  const cog = player?.cognitive;
  if (!cog) return null;

  // 1. Progresión adaptativa por niveles (Bronce: 60, Plata: 70, Oro: 80, Diamante: 90, Leyenda: 99)
  const levels = cog.levels;
  if (levels && typeof levels === 'object') {
    const levelScoreMap = { bronce: 60, plata: 70, oro: 80, diamante: 90, leyenda: 99 };
    const levelScores = [];
    Object.values(levels).forEach(lvl => {
      if (lvl && levelScoreMap[lvl]) {
        levelScores.push(levelScoreMap[lvl]);
      }
    });
    if (levelScores.length > 0) {
      return Math.round(levelScores.reduce((a, b) => a + b, 0) / levelScores.length);
    }
  }

  if (cog.weekly && cog.weekly.points > 0) {
    return Math.min(99, Math.max(10, Math.round(Number(cog.weekly.points) * 1.5)));
  }

  if (cog.best) {
    const scores = [];
    if (cog.best.g2 !== undefined && !isNaN(Number(cog.best.g2))) {
      scores.push(Number(cog.best.g2)); // precisión %
    }
    if (cog.best.g6 !== undefined && !isNaN(Number(cog.best.g6))) {
      scores.push(Number(cog.best.g6)); // precisión %
    }
    if (cog.best.g3 !== undefined && !isNaN(Number(cog.best.g3))) {
      scores.push(Math.min(99, Number(cog.best.g3) * 20)); // aciertos / 5 -> 0..100
    }
    if (cog.best.g1 !== undefined && !isNaN(Number(cog.best.g1))) {
      const ms = Number(cog.best.g1);
      const scaled = Math.min(99, Math.max(10, Math.round(100 - (ms - 200) * 0.1)));
      scores.push(scaled);
    }
    if (scores.length > 0) {
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  return null;
};

/**
 * Calcula las 4 dimensiones (FÍS, TÉC, PSI, SOC), las 5 dimensiones del radar (FÍSICO, TÉCNICA, TÁCTICA, MENTAL, ASISTENCIA)
 * y el TPI Score global para un jugador a partir de todas sus evaluaciones registradas.
 */
export const calculatePlayerPerformanceScores = (evaluations = [], player = {}, options = {}) => {
  const { attendancePct = null, matchRating = null } = options;

  let fis = 0, tec = 0, psi = 0, soc = 0, testCount = 0;
  let countFis = 0, countTec = 0, countPsi = 0, countSoc = 0;

  // Agrupar por prueba considerando el registro más reciente y desempate determinista unificado
  const latestByTest = {};
  evaluations.forEach(e => {
    const rawId = String(e.testId || e.testName || 'test_general');
    const aliasMap = {
      'psi_acsi28_auto': 'psi1',
      'psi_mtq10_auto': 'psi2',
      'soc_geq_auto': 'soc1',
      'soc_mhc_auto': 'soc2',
      'psi_acsi28': 'psi1',
      'psi_mtq10': 'psi2',
      'soc_geq': 'soc1',
      'soc_cwms': 'soc2'
    };
    const testId = aliasMap[rawId] || rawId;
    const currentTs = e._safeTimestamp || getSafeTimestamp(e);
    const existingTs = latestByTest[testId] ? (latestByTest[testId]._safeTimestamp || getSafeTimestamp(latestByTest[testId])) : -1;
    
    if (!latestByTest[testId] || currentTs > existingTs) {
      latestByTest[testId] = { ...e, testId, _safeTimestamp: currentTs };
    } else if (currentTs === existingTs) {
      // Priorizar registro oficial si hay empate
      const curIsStaff = e.tipo !== 'psicologico_auto' && !e.isAutonomous;
      const exIsStaff = latestByTest[testId].tipo !== 'psicologico_auto' && !latestByTest[testId].isAutonomous;
      if (curIsStaff && !exIsStaff) {
        latestByTest[testId] = { ...e, testId, _safeTimestamp: currentTs };
      } else if (!curIsStaff && exIsStaff) {
        // Mantener el existente
      } else {
        const curScore = Number(e.nota ?? e.val ?? e.percentage ?? e.score ?? 0);
        const exScore = Number(latestByTest[testId].nota ?? latestByTest[testId].val ?? latestByTest[testId].percentage ?? latestByTest[testId].score ?? 0);
        if (curScore >= exScore) {
          latestByTest[testId] = { ...e, testId, _safeTimestamp: currentTs };
        }
      }
    }
  });

  Object.entries(latestByTest).forEach(([testId, item]) => {
    const canonical = CANONICAL_TESTS_MAP[testId] || {};
    const val = item.val !== undefined 
      ? item.val 
      : (item.percentage !== undefined 
        ? item.percentage 
        : (item.nota !== undefined 
          ? item.nota 
          : (item.score !== undefined ? item.score : 0)));
    const unit = item.unit || canonical.unit || 'pts';
    const rawCat = String(item.category || canonical.category || item.categoria || '').toLowerCase();
    const rawType = String(item.type || canonical.type || item.tipo || '').toLowerCase();

    const norm = normalizeTestValue(val, testId, unit, item);
    testCount++;

    if (
      testId.startsWith('psi') || 
      rawType === 'psicodeportivo' || 
      rawCat.includes('afrontamiento') || 
      rawCat.includes('fortaleza') || 
      rawCat.includes('metas') || 
      rawCat.includes('liderazgo') || 
      rawCat.includes('resiliencia')
    ) {
      psi += norm; countPsi++;
    } else if (
      testId.startsWith('soc') || 
      rawType === 'sociodeportivo' || 
      rawType === 'socioemocional' || 
      rawCat.includes('cohesión') || 
      rawCat.includes('bienestar') || 
      rawCat.includes('convivencia') || 
      rawCat.includes('social') || 
      rawCat.includes('empatía') || 
      rawCat.includes('conflictos')
    ) {
      soc += norm; countSoc++;
    } else if (
      testId === 't7' || 
      testId === 't8' || 
      rawType === 'tecnico' || 
      rawCat.includes('técnic') || 
      rawCat.includes('control') || 
      rawCat.includes('pase') || 
      rawCat.includes('regate') || 
      rawCat.includes('tiro') || 
      rawCat.includes('conos') || 
      rawCat.includes('porteria')
    ) {
      tec += norm; countTec++;
    } else {
      fis += norm; countFis++;
    }
  });

  if (testCount > 0) {
    fis = countFis > 0 ? Math.min(99, Math.round(fis / countFis)) : 0;
    tec = countTec > 0 ? Math.min(99, Math.round(tec / countTec)) : 0;
    psi = countPsi > 0 ? Math.min(99, Math.round(psi / countPsi)) : 0;
    soc = countSoc > 0 ? Math.min(99, Math.round(soc / countSoc)) : 0;
  }

  // Integración de atributos de la ficha si no hay tests específicos
  const rawFisicoFicha = Number(player?.statsFisico) || Number(player?.evaluacion?.fisico) || Number(player?.fisico) || 0;
  const rawTecnicaFicha = Number(player?.statsTecnica) || Number(player?.evaluacion?.tecnica) || Number(player?.tecnica) || 0;
  const rawMentalFicha = Number(player?.statsMental) || Number(player?.evaluacion?.mental) || Number(player?.mental) || 0;
  const rawTacticaFicha = Number(player?.statsTactica) || Number(player?.evaluacion?.tactica) || Number(player?.tactica) || 0;

  if (fis === 0 && rawFisicoFicha > 0) fis = rawFisicoFicha;
  if (tec === 0 && rawTecnicaFicha > 0) tec = rawTecnicaFicha;
  if (psi === 0 && rawMentalFicha > 0) psi = rawMentalFicha;

  // Integración de Entrenamiento Cognitivo en el eje MENTAL (Regla D7: radarWeight 0 / 0.2 / 0.4)
  const weight = options.radarWeight !== undefined 
    ? Number(options.radarWeight) 
    : (options.team?.settings?.cognitive?.radarWeight ?? player?.teamSettings?.cognitive?.radarWeight ?? 0.2);

  const cogScore = options.cognitiveScore !== undefined && options.cognitiveScore !== null
    ? Number(options.cognitiveScore)
    : calculatePlayerCognitiveScore(player);

  if (cogScore !== null && !isNaN(cogScore) && weight > 0) {
    if (psi > 0) {
      psi = Math.min(99, Math.max(0, Math.round(psi * (1 - weight) + cogScore * weight)));
    } else {
      psi = Math.min(99, Math.max(0, Math.round(cogScore)));
    }
  }

  // Dimensión TÁCTICA: Derivada 100% de la calificación real del míster en partidos oficiales
  // (escala 1 a 10 multiplicada por 10 -> 10 a 99). Si no hay calificación en partidos ni nota previa en ficha, es 0.
  const tacticaRating = (matchRating && matchRating !== '-' && !isNaN(Number(matchRating)) && Number(matchRating) > 0)
    ? Math.min(99, Math.max(10, Math.round(Number(matchRating) * 10)))
    : 0;
  const tactica = tacticaRating > 0 ? tacticaRating : (rawTacticaFicha > 0 ? rawTacticaFicha : 0);

  const asistencia = attendancePct !== null && attendancePct !== undefined 
    ? Math.min(99, Math.max(0, Math.round(Number(attendancePct)))) 
    : (player?.attendancePct ? Number(player.attendancePct) : 0);

  // TPI Score global (promedio de dimensiones activas)
  const validDimensions = [fis, tec, psi, soc].filter(v => v > 0);
  const overall = validDimensions.length > 0
    ? Math.round(validDimensions.reduce((acc, v) => acc + v, 0) / validDimensions.length)
    : (testCount > 0 ? Math.round((fis + tec + psi + soc) / 4) : 0);

  return {
    fis,
    tec,
    psi,
    soc,
    tactica,
    asistencia,
    overall,
    testCount,
    streak: testCount,
    stats4: [
      { label: 'FÍS', value: fis > 0 ? fis : '-' },
      { label: 'TÉC', value: tec > 0 ? tec : '-' },
      { label: 'PSI', value: psi > 0 ? psi : '-' },
      { label: 'SOC', value: soc > 0 ? soc : '-' }
    ],
    stats5: [
      { label: 'FÍSICO', value: fis },
      { label: 'TÉCNICA', value: tec },
      { label: 'TÁCTICA', value: tactica },
      { label: 'MENTAL', value: psi },
      { label: 'ASISTENCIA', value: asistencia }
    ],
    radarData5: [
      { subject: 'FÍSICO', label: 'FÍSICO', value: fis },
      { subject: 'TÉCNICA', label: 'TÉCNICA', value: tec },
      { subject: 'TÁCTICA', label: 'TÁCTICA', value: tactica },
      { subject: 'MENTAL', label: 'MENTAL', value: psi },
      { subject: 'ASISTENCIA', label: 'ASISTENCIA', value: asistencia }
    ],
    radarData: [
      { subject: 'FÍSICO', label: 'FÍSICO', value: fis },
      { subject: 'TÉCNICA', label: 'TÉCNICA', value: tec },
      { subject: 'TÁCTICA', label: 'TÁCTICA', value: tactica },
      { subject: 'MENTAL', label: 'MENTAL', value: psi },
      { subject: 'ASISTENCIA', label: 'ASISTENCIA', value: asistencia }
    ]
  };
};
