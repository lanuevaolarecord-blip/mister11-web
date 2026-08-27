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
  // 1. Si ya tiene porcentaje explícito
  if (rawItem?.percentage !== undefined && rawItem.percentage !== null && !isNaN(Number(rawItem.percentage))) {
    return Math.min(99, Math.max(10, Math.round(Number(rawItem.percentage))));
  }

  // 2. Si tiene score y maxScore (cuestionarios)
  const score = rawItem?.score !== undefined ? Number(rawItem.score) : Number(rawItem?.puntuacionTotal);
  const maxScore = rawItem?.maxScore !== undefined ? Number(rawItem.maxScore) : (rawItem?.puntuacionMaxima || CANONICAL_TESTS_MAP[testId]?.maxScore);
  if (!isNaN(score) && !isNaN(maxScore) && maxScore > 0) {
    return Math.min(99, Math.max(10, Math.round((score / maxScore) * 100)));
  }

  const num = parseFloat(String(val !== undefined ? val : (rawItem?.val || 0)).replace(',', '.')) || 0;
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
 * Calcula las 4 dimensiones (FÍS, TÉC, PSI, SOC), las 5 dimensiones del radar (FÍSICO, TÉCNICA, TÁCTICA, MENTAL, ASISTENCIA)
 * y el TPI Score global para un jugador a partir de todas sus evaluaciones registradas.
 */
export const calculatePlayerPerformanceScores = (evaluations = [], player = {}, options = {}) => {
  const { attendancePct = null, matchRating = null } = options;

  let fis = 0, tec = 0, psi = 0, soc = 0, testCount = 0;
  let countFis = 0, countTec = 0, countPsi = 0, countSoc = 0;

  // Agrupar por prueba considerando el registro más reciente
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
    if (!latestByTest[testId] || new Date(e.date || e.fecha || 0) >= new Date(latestByTest[testId].date || latestByTest[testId].fecha || 0)) {
      latestByTest[testId] = { ...e, testId };
    }
  });

  Object.entries(latestByTest).forEach(([testId, item]) => {
    const canonical = CANONICAL_TESTS_MAP[testId] || {};
    const val = item.val !== undefined ? item.val : (item.score !== undefined ? item.score : (item.percentage || 0));
    const unit = item.unit || canonical.unit || 'pts';
    const rawCat = String(item.category || canonical.category || item.categoria || '').toLowerCase();
    const rawType = String(item.type || canonical.type || item.tipo || '').toLowerCase();

    const norm = normalizeTestValue(val, testId, unit, item);
    testCount++;

    if (
      rawType === 'fisico' || 
      testId === 't1' || testId === 't2' || testId === 't3' || testId === 't4' || testId === 't5' || testId === 't6' ||
      rawCat.includes('resistencia') || rawCat.includes('velocidad') || rawCat.includes('fuerza') || rawCat.includes('agilidad')
    ) {
      if (rawCat.includes('técnic') || testId === 't7' || testId === 't8') {
        tec += norm; countTec++;
      } else {
        fis += norm; countFis++;
      }
    } else if (
      rawType === 'tecnico' || testId === 't7' || testId === 't8' ||
      rawCat.includes('técnic') || rawCat.includes('control') || rawCat.includes('pase') || rawCat.includes('regate') || rawCat.includes('tiro')
    ) {
      tec += norm; countTec++;
    } else if (
      rawType === 'psicodeportivo' || rawType === 'psicosocial' || testId.startsWith('psi') ||
      rawCat.includes('afrontamiento') || rawCat.includes('fortaleza') || rawCat.includes('metas') || rawCat.includes('liderazgo') || rawCat.includes('mental') || rawCat.includes('psico') || rawCat.includes('presión') || rawCat.includes('resiliencia')
    ) {
      psi += norm; countPsi++;
    } else if (
      rawType === 'sociodeportivo' || rawType === 'socioemocional' || testId.startsWith('soc') ||
      rawCat.includes('cohesión') || rawCat.includes('bienestar') || rawCat.includes('autoconciencia') || rawCat.includes('empatía') || rawCat.includes('conflictos') || rawCat.includes('convivencia') || rawCat.includes('social')
    ) {
      soc += norm; countSoc++;
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

  const tacticaRating = matchRating ? Math.min(99, Math.round(Number(matchRating) * 10)) : 0;
  const tactica = Math.max(rawTacticaFicha, tacticaRating, tec);

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
