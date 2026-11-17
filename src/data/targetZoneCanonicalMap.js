/**
 * src/data/targetZoneCanonicalMap.js
 * Míster11 — P12-A (Q4=B): Mapa Canónico y Normalizador de targetZones
 *
 * Objetivo:
 * Normalizar todas las variantes léxicas y funcionales de targetZones del catálogo
 * (isquiosural/isquiosurales, gluteo_mayor/gluteo_medio, tobillo/tobillos,
 * gemelo/gemelos, tendon_aquiles/tendón_aquiles, etc.) a un conjunto cerrado de
 * 26 claves canónicas sin acentos para uso interno, tests de integridad y
 * futuro rediseño SVG biomecánico (D2-R).
 *
 * Regla de gobernanza:
 * - Si una zona no encaja en el mapa, NO se inventa ni se acepta en silencio:
 *   retorna '[TARGETZONE_NO_CANONICA]'.
 * - El token ambiguo 'gluteo' sin sufijo exige resolución explícita a
 *   'gluteo_mayor' o 'gluteo_medio' según el ejercicio.
 */

export const CANONICAL_TARGET_ZONES = Object.freeze([
  'core',
  'oblicuos',
  'estabilizadores_lumbopelvicos',
  'cadera',
  'gluteo_mayor',
  'gluteo_medio',
  'isquiosurales',
  'cuadriceps',
  'aductores',
  'tobillo',
  'dorsiflexion',
  'soleo',
  'gemelos',
  'tendon_aquiles',
  'rodilla',
  'estabilidad_rodilla',
  'prevencion_lca',
  'hombro',
  'escapula',
  'cervical_gk',
  'cardio',
  'coordinacion',
  'agilidad',
  'tecnica',
  'recuperacion',
  'movilidad'
]);

export const CANONICAL_TARGET_ZONE_SET = new Set(CANONICAL_TARGET_ZONES);

/**
 * Etiquetas legibles en UI por clave canónica (ES / EN).
 */
export const CANONICAL_TARGET_ZONE_LABELS = Object.freeze({
  core: { es: 'Core abdominal', en: 'Core' },
  oblicuos: { es: 'Oblicuos', en: 'Obliques' },
  estabilizadores_lumbopelvicos: { es: 'Estabilizadores lumbopélvicos', en: 'Lumbopelvic stabilizers' },
  cadera: { es: 'Cadera y flexores/rotadores', en: 'Hip complex' },
  gluteo_mayor: { es: 'Glúteo mayor', en: 'Gluteus maximus' },
  gluteo_medio: { es: 'Glúteo medio', en: 'Gluteus medius' },
  isquiosurales: { es: 'Isquiosurales', en: 'Hamstrings' },
  cuadriceps: { es: 'Cuádriceps', en: 'Quadriceps' },
  aductores: { es: 'Aductores y pubis', en: 'Adductors & groin' },
  tobillo: { es: 'Tobillo y complejo distal', en: 'Ankle & foot complex' },
  dorsiflexion: { es: 'Dorsiflexión de tobillo', en: 'Ankle dorsiflexion' },
  soleo: { es: 'Sóleo', en: 'Soleus' },
  gemelos: { es: 'Gemelos (gastrocnemio)', en: 'Calves (gastrocnemius)' },
  tendon_aquiles: { es: 'Tendón de Aquiles', en: 'Achilles tendon' },
  rodilla: { es: 'Articulación de rodilla y tendón rotuliano', en: 'Knee joint & patellar tendon' },
  estabilidad_rodilla: { es: 'Estabilidad de rodilla y frenada', en: 'Knee stability & deceleration' },
  prevencion_lca: { es: 'Prevención de LCA y absorción de impacto', en: 'ACL prevention & landing absorption' },
  hombro: { es: 'Hombro y manguito rotador', en: 'Shoulder & rotator cuff' },
  escapula: { es: 'Escápula y cintura escapular', en: 'Scapula & upper back' },
  cervical_gk: { es: 'Cervical y cuello (portero)', en: 'Cervical & goalkeeper neck' },
  cardio: { es: 'Capacidad cardiovascular', en: 'Cardiovascular conditioning' },
  coordinacion: { es: 'Coordinación y propiocepción', en: 'Coordination & proprioception' },
  agilidad: { es: 'Agilidad y cambio de dirección', en: 'Agility & change of direction' },
  tecnica: { es: 'Técnica individual con balón', en: 'Ball technique & control' },
  recuperacion: { es: 'Recuperación y descarga', en: 'Recovery & parasympathetic reset' },
  movilidad: { es: 'Movilidad articular y torácica', en: 'Joint & thoracic mobility' }
});

/**
 * Desambiguación biomecánica explícita por ejercicio cuando en histórico aparecía 'gluteo' sin sufijo.
 */
export const GLUTEO_DISAMBIGUATION_BY_EXERCISE_ID = Object.freeze({
  'hex-007': 'gluteo_mayor', // Zancada Inversa con Rotación Torácica (extensión de cadera)
  'hex-008': 'gluteo_medio', // Zancada Lateral Dinámica / Cossack Parcial (plano frontal)
  'hex-100': 'gluteo_medio'  // Torsión Espinal Tumbado (estiramiento lateral de cadera/glúteo medio)
});

/**
 * Mapa determinista de variantes del catálogo (sin acentos, en minúsculas) -> clave canónica.
 */
export const TARGET_ZONE_CANONICAL_MAP = Object.freeze({
  // 1. core
  core: 'core',
  abdomen: 'core',
  core_lateral: 'core',
  anti_rotacion: 'core',
  anti_rotacion_core: 'core',
  recto_abdominal: 'core',
  transverso_abdomen: 'core',

  // 2. oblicuos
  oblicuos: 'oblicuos',
  oblicuo: 'oblicuos',

  // 3. estabilizadores_lumbopelvicos
  estabilizadores_lumbopelvicos: 'estabilizadores_lumbopelvicos',
  anti_extension_lumbar: 'estabilizadores_lumbopelvicos',
  cuadrado_lumbar: 'estabilizadores_lumbopelvicos',
  erectores_espinales: 'estabilizadores_lumbopelvicos',
  estabilidad_lumbopelvica: 'estabilizadores_lumbopelvicos',
  estabilidad_pelvica: 'estabilizadores_lumbopelvicos',
  lumbar: 'estabilizadores_lumbopelvicos',
  lumbar_descarga: 'estabilizadores_lumbopelvicos',
  pelvis: 'estabilizadores_lumbopelvicos',
  sacro: 'estabilizadores_lumbopelvicos',
  espalda: 'estabilizadores_lumbopelvicos',

  // 4. cadera
  cadera: 'cadera',
  caderas: 'cadera',
  cadera_movilidad: 'cadera',
  estabilizacion_cadera: 'cadera',
  flexores_cadera: 'cadera',
  psoas: 'cadera',
  psoas_iliaco: 'cadera',
  piramidal: 'cadera',
  rotadores_externos_cadera: 'cadera',
  abductores: 'cadera',

  // 5. gluteo_mayor
  gluteo_mayor: 'gluteo_mayor',
  gluteo_aislado: 'gluteo_mayor',
  gluteos: 'gluteo_mayor',

  // 6. gluteo_medio
  gluteo_medio: 'gluteo_medio',
  gluteo_profundo: 'gluteo_medio',

  // 7. isquiosurales
  isquiosural: 'isquiosurales',
  isquiosurales: 'isquiosurales',
  isquiosurales_excentrico: 'isquiosurales',
  prevencion_roturas: 'isquiosurales',
  cadena_posterior: 'isquiosurales',
  cadena_posterior_completa: 'isquiosurales',
  hueco_popliteo: 'isquiosurales',
  fosa_poplitea: 'isquiosurales',
  cadera_posterior: 'isquiosurales',

  // 8. cuadriceps
  cuadriceps: 'cuadriceps',
  cuadriceps_aislado: 'cuadriceps',
  recto_anterior_cuadriceps: 'cuadriceps',
  fuerza_estatica: 'cuadriceps',
  fuerza_unipodal: 'cuadriceps',
  potencia_tren_inferior: 'cuadriceps',

  // 9. aductores
  aductores: 'aductores',
  aductor: 'aductores',
  aductor_medio: 'aductores',
  aductores_profundos: 'aductores',
  pubalgia_prevencion: 'aductores',
  pubis: 'aductores',

  // 10. tobillo
  tobillo: 'tobillo',
  tobillos: 'tobillo',
  estabilidad_tobillo: 'tobillo',
  ligamentos_tobillo: 'tobillo',
  propiocepcion_tobillo: 'tobillo',
  tobillo_unipodal: 'tobillo',
  tibial_anterior: 'tobillo',
  espinillas: 'tobillo',
  metatarsos: 'tobillo',
  propiocepcion_pie: 'tobillo',

  // 11. dorsiflexion
  dorsiflexion: 'dorsiflexion',
  tobillo_dorsiflexion: 'dorsiflexion',
  movilidad_tobillo: 'dorsiflexion',

  // 12. soleo
  soleo: 'soleo',

  // 13. gemelos
  gemelo: 'gemelos',
  gemelos: 'gemelos',
  pantorrilla: 'gemelos',
  resistencia_gemelos: 'gemelos',

  // 14. tendon_aquiles
  tendon_aquiles: 'tendon_aquiles',
  prevencion_aquiles: 'tendon_aquiles',
  rigidez_reactiva: 'tendon_aquiles',
  fuerza_elastica: 'tendon_aquiles',
  fuerza_reactiva: 'tendon_aquiles',

  // 15. rodilla
  rodilla: 'rodilla',
  tendon_rotuliano: 'rodilla',
  tendinopatia_rotuliana: 'rodilla',

  // 16. estabilidad_rodilla
  estabilidad_rodilla: 'estabilidad_rodilla',
  propiocepcion_rodilla: 'estabilidad_rodilla',
  frenada_excentrica: 'estabilidad_rodilla',
  frenada_lateral: 'estabilidad_rodilla',
  frenada: 'estabilidad_rodilla',
  frenada_corta: 'estabilidad_rodilla',

  // 17. prevencion_lca
  prevencion_lca: 'prevencion_lca',
  lca: 'prevencion_lca',
  lca_prevencion: 'prevencion_lca',
  lca_control_excentrico: 'prevencion_lca',
  absorcion_impactos: 'prevencion_lca',

  // 18. hombro
  hombro: 'hombro',
  hombros: 'hombro',
  hombro_anterior: 'hombro',
  hombro_manguito: 'hombro',
  deltoides_posterior: 'hombro',
  estabilidad_hombro: 'hombro',
  pectoral_mayor: 'hombro',

  // 19. escapula
  escapula: 'escapula',
  estabilidad_escapular: 'escapula',
  romboides: 'escapula',
  serrato_anterior: 'escapula',
  dorsales: 'escapula',
  trapecio: 'escapula',

  // 20. cervical_gk
  cervical_gk: 'cervical_gk',
  cuello: 'cervical_gk',
  cervical: 'cervical_gk',
  cervical_portero: 'cervical_gk',
  prevencion_conmocion_cuello_gk: 'cervical_gk',

  // 21. cardio
  cardio: 'cardio',
  cardio_anaerobico: 'cardio',
  frecuencia_cardiaca: 'cardio',

  // 22. coordinacion
  coordinacion: 'coordinacion',
  coordinacion_alta: 'coordinacion',
  coordinacion_bimanual_pies: 'coordinacion',
  coordinacion_cruzada: 'coordinacion',
  coordinacion_fina: 'coordinacion',
  coordinacion_manos_pies: 'coordinacion',
  coordinacion_segmentaria: 'coordinacion',
  coordinacion_tecnica: 'coordinacion',
  control_motor: 'coordinacion',
  disociacion_tren_inferior: 'coordinacion',
  equilibrio: 'coordinacion',
  propiocepcion: 'coordinacion',
  propiocepcion_profunda: 'coordinacion',
  ritmo: 'coordinacion',
  ritmo_dos_toques: 'coordinacion',
  ritmo_motor: 'coordinacion',
  sistema_vestibular: 'coordinacion',
  transferencia_peso: 'coordinacion',
  ambidextrismo: 'coordinacion',
  concentracion: 'coordinacion',

  // 23. agilidad
  agilidad: 'agilidad',
  agilidad_cod: 'agilidad',
  agilidad_pies: 'agilidad',
  aceleracion_corta: 'agilidad',
  aceleracion_post_transicion: 'agilidad',
  cambio_apoyo_lateral: 'agilidad',
  cambio_de_ritmo: 'agilidad',
  cambio_direccion: 'agilidad',
  cambio_sentido: 'agilidad',
  frecuencia_apoyos: 'agilidad',
  frecuencia_zancada: 'agilidad',
  giro_pivot: 'agilidad',
  '180_giro': 'agilidad',
  perfil_defensivo: 'agilidad',
  perfilacion: 'agilidad',
  potencia_lateral: 'agilidad',
  reactividad_multidireccional: 'agilidad',
  tiempo_reaccion: 'agilidad',
  velocidad_apoyos: 'agilidad',
  velocidad_reaccion: 'agilidad',
  desmarque: 'agilidad',

  // 24. tecnica
  tecnica: 'tecnica',
  conduccion_corta: 'tecnica',
  control_aereo: 'tecnica',
  control_exterior: 'tecnica',
  control_orientado: 'tecnica',
  control_pecho: 'tecnica',
  control_pie: 'tecnica',
  dominio_planta: 'tecnica',
  engano_corporal: 'tecnica',
  finta: 'tecnica',
  finta_inversa: 'tecnica',
  futsal_skills: 'tecnica',
  pase_corto: 'tecnica',
  pie_debil: 'tecnica',
  pie_dominante: 'tecnica',
  pie_dominante_y_no_dominante: 'tecnica',
  primer_toque: 'tecnica',
  proteccion_balon: 'tecnica',
  punteria_pase: 'tecnica',
  recorte: 'tecnica',
  regate_avanzado: 'tecnica',
  regate_corto: 'tecnica',
  regate_desborde: 'tecnica',
  regate_explosivo: 'tecnica',
  regate_protegido: 'tecnica',
  sensibilidad_empeine: 'tecnica',
  sensibilidad_planta: 'tecnica',
  tacto_balon: 'tecnica',
  vision_aerea: 'tecnica',
  vision_espacial: 'tecnica',

  // 25. recuperacion
  recuperacion: 'recuperacion',
  piernas_cansadas: 'recuperacion',
  recuperacion_parasimpatica: 'recuperacion',
  relajacion_global: 'recuperacion',
  retorno_venoso: 'recuperacion',
  sistema_nervioso_parasimpatico: 'recuperacion',

  // 26. movilidad
  movilidad: 'movilidad',
  columna: 'movilidad',
  columna_toracica: 'movilidad',
  extension_columna: 'movilidad',
  movilidad_toracica: 'movilidad',
  torax: 'movilidad'
});

/**
 * Zonas canónicas objetivo para el rediseño SVG de los 5 ejercicios rechazados (D2-R) y su alias hex-001.
 */
export const REDESIGN_SVG_CANONICAL_ZONES = Object.freeze({
  'sys-1': ['core', 'estabilizadores_lumbopelvicos'],
  'sys-2': ['cadera', 'gluteo_mayor', 'core'],
  'sys-3': ['tobillo', 'dorsiflexion', 'soleo', 'gemelos'],
  'sys-8': ['isquiosurales', 'recuperacion'],
  'sys-9': ['core', 'oblicuos', 'estabilizadores_lumbopelvicos'],
  'hex-001': ['tobillo', 'dorsiflexion', 'soleo', 'gemelos'] // hereda de sys-3
});

/**
 * Normaliza un string eliminando acentos/diacríticos y espacios.
 */
export function stripAccentsAndNormalizeKey(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

/**
 * Resuelve una zona individual a su clave canónica de las 26 permitidas.
 * Si no es reconocible, retorna '[TARGETZONE_NO_CANONICA]'.
 */
export function normalizeTargetZone(rawZone, exerciseId = null) {
  const clean = stripAccentsAndNormalizeKey(rawZone);
  if (!clean) return '[TARGETZONE_NO_CANONICA]';

  // Regla Q4: 'gluteo' sin sufijo exige gluteo_mayor o gluteo_medio según ejercicio
  if (clean === 'gluteo') {
    if (exerciseId && GLUTEO_DISAMBIGUATION_BY_EXERCISE_ID[exerciseId]) {
      return GLUTEO_DISAMBIGUATION_BY_EXERCISE_ID[exerciseId];
    }
    return '[TARGETZONE_NO_CANONICA]';
  }

  const mapped = TARGET_ZONE_CANONICAL_MAP[clean];
  if (mapped && CANONICAL_TARGET_ZONE_SET.has(mapped)) {
    return mapped;
  }

  return '[TARGETZONE_NO_CANONICA]';
}

/**
 * Normaliza el array de targetZones de un ejercicio (o array de zonas).
 * Si el ejercicio tiene duplicateOf (ej. hex-001 -> sys-3) y se pasa un mapa de catálogo,
 * reconcilia/hereda las zonas canónicas del ejercicio padre.
 */
export function normalizeExerciseTargetZones(exerciseOrZones, exerciseId = null, catalogById = null) {
  if (Array.isArray(exerciseOrZones)) {
    const resolved = exerciseOrZones.map(z => normalizeTargetZone(z, exerciseId));
    return [...new Set(resolved)];
  }
  if (!exerciseOrZones || typeof exerciseOrZones !== 'object') {
    return [];
  }

  const id = exerciseOrZones.id || exerciseId || null;
  const parentId = exerciseOrZones.duplicateOf || null;
  const rawZones = Array.isArray(exerciseOrZones.targetZones) ? exerciseOrZones.targetZones : [];

  const ownCanonical = rawZones.map(z => normalizeTargetZone(z, id));
  if (parentId && catalogById && catalogById[parentId]) {
    const parentZones = Array.isArray(catalogById[parentId].targetZones) ? catalogById[parentId].targetZones : [];
    const parentCanonical = parentZones.map(z => normalizeTargetZone(z, parentId));
    return [...new Set([...parentCanonical, ...ownCanonical])];
  }

  return [...new Set(ownCanonical)];
}

/**
 * Audita un catálogo completo de ejercicios verificando que el 100% de sus targetZones
 * resuelvan a CANONICAL_TARGET_ZONES sin unknowns silenciosos.
 */
export function auditCatalogTargetZones(catalog = []) {
  const byId = Object.fromEntries(catalog.map(e => [e.id, e]));
  const nonCanonical = [];
  const resolvedByExercise = {};

  for (const ex of catalog) {
    const rawList = Array.isArray(ex.targetZones) ? ex.targetZones : [];
    if (rawList.length === 0) {
      nonCanonical.push({ id: ex.id, raw: null, reason: 'empty_targetZones' });
    }
    for (const raw of rawList) {
      const norm = normalizeTargetZone(raw, ex.id);
      if (norm === '[TARGETZONE_NO_CANONICA]' || !CANONICAL_TARGET_ZONE_SET.has(norm)) {
        nonCanonical.push({ id: ex.id, raw, normalized: norm });
      }
    }
    resolvedByExercise[ex.id] = normalizeExerciseTargetZones(ex, ex.id, byId);
  }

  return {
    totalExercises: catalog.length,
    nonCanonicalCount: nonCanonical.length,
    nonCanonical,
    resolvedByExercise
  };
}

export default TARGET_ZONE_CANONICAL_MAP;
