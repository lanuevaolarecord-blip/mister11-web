import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const catalogPath = path.join(rootDir, 'src', 'data', 'homeExercisesCatalog.js');
let catalogContent = fs.readFileSync(catalogPath, 'utf8');

console.log('--- Iniciando migración de homeExercisesCatalog.js a Oleada 6.1 ---');

// 1. Cabecera y categorías actualizadas
const newHeaderAndCategories = `/**
 * homeExercisesCatalog.js
 * Míster11 — Catálogo Canónico de Ejercicios de Entrenamiento en Casa / Tecnificación
 *
 * Oleada 6.1:
 * - Esquema clínico con material_preferido, alternativa_casa, contexto
 * - Umbrales duros de edad (edad_minima_segura, requiere_supervision_presencial, safety_notes)
 * - Fuentes clínicas de lista blanca (FIFA 11+, Petersen, Thorborg, ACSM, Lloyd LTAD, etc.)
 * - Cero source: 'system'
 * - Categorías con iconos Lucide y paleta Tierra y Campo
 */

export const DEFAULT_USER_INVENTORY = [
  'peso_corporal',
  'toalla',
  'botella',
  'mochila_lastre',
  'escalon',
  'silla_estable',
  'cojin',
  'colchoneta',
  'marco_puerta',
  'pared',
  'suelo',
  'pelota'
];

export const HOME_EXERCISES_CATEGORIES = {
  calentamiento: {
    id: 'calentamiento',
    nameEs: 'Calentamiento y Activación Dinámica',
    nameEn: 'Warm-up & Dynamic Activation',
    icon: 'Flame',
    color: '#C85A32' // --terracota
  },
  tecnica: {
    id: 'tecnica',
    nameEs: 'Técnica Individual y Control',
    nameEn: 'Individual Technique & Control',
    icon: 'Target',
    color: '#D4A843' // --oro
  },
  coordinacion_agilidad: {
    id: 'coordinacion_agilidad',
    nameEs: 'Coordinación y Agilidad',
    nameEn: 'Coordination & Agility',
    icon: 'Zap',
    color: '#9C6A3B' // --ocre
  },
  fuerza_preventiva: {
    id: 'fuerza_preventiva',
    nameEs: 'Fuerza Preventiva y Core',
    nameEn: 'Preventive Strength & Core',
    icon: 'ShieldCheck',
    color: '#1B3A2D' // --verde-selva
  },
  vuelta_calma: {
    id: 'vuelta_calma',
    nameEs: 'Vuelta a la Calma y Movilidad',
    nameEn: 'Cool-down & Mobility',
    icon: 'Wind',
    color: '#4CAF7D' // --verde-campo
  }
};`;

// Reemplazar cabecera y categorías
catalogContent = catalogContent.replace(/\/\*\*[\s\S]*?export const HOME_EXERCISES_CATEGORIES = \{[\s\S]*?\n\};/, newHeaderAndCategories);

// Ahora importemos dinámicamente los ejercicios existentes
const moduleUrl = 'file:///' + catalogPath.replace(/\\/g, '/');
const { HOME_EXERCISES_107: rawArray } = await import(moduleUrl);
const HOME_EXERCISES_107 = rawArray.filter(e => e.id !== 'hex-108');

console.log(`Cargados ${HOME_EXERCISES_107.length} ejercicios originales.`);

// Función transformadora para cada ejercicio
const transformed = HOME_EXERCISES_107.map(ex => {
  const item = { ...ex };
  delete item.source; // eliminamos source primitivo string

  // Definir contexto
  // Campo only: ejercicios de técnica con balón que requieren espacio amplio o circuito de conos en campo
  const campoOnlyIds = ['hex-030', 'hex-032', 'hex-033', 'hex-043', 'hex-044', 'hex-046', 'hex-060'];
  if (campoOnlyIds.includes(item.id)) {
    item.contexto = 'campo_only';
  } else {
    item.contexto = 'casa';
  }

  // Material preferido y alternativa casa
  const rawMats = item.materials || [];
  
  if (item.id === 'hex-078') { // Nordic
    item.material_preferido = ['anclaje_pies'];
    item.alternativa_casa = {
      option: ['sofa_pesado', 'tope_puerta', 'companero'],
      nota: {
        es: 'Asegurar anclaje estable en base de sofá pesado, bajo puerta firme o con ayuda de un adulto. Nunca prescribir sin supervisión presencial.',
        en: 'Ensure stable anchor at base of heavy couch, firm door strap or adult partner. Never prescribe without in-person supervision.'
      }
    };
  } else if (item.id === 'hex-076') { // Copenhagen banco
    item.material_preferido = ['banco', 'silla_estable'];
    item.alternativa_casa = {
      option: ['silla_estable', 'sofa', 'escalon'],
      nota: {
        es: 'Usar silla firme apoyada contra pared o base de sofá. Cuidar la altura para no forzar la aducción.',
        en: 'Use sturdy chair against wall or couch base. Control height to prevent adductor strain.'
      }
    };
  } else if (item.id === 'hex-064') { // Drop jump
    item.material_preferido = ['cajon_bajo'];
    item.alternativa_casa = {
      option: ['escalon'],
      nota: {
        es: 'El escalón doméstico reduce la altura de caída respecto a un cajón pliométrico. Asegurar superficie que amortigüe el impacto y controlar el ruido para vecinos.',
        en: 'Household step reduces drop height compared to a plyo box. Ensure cushioned impact surface and control noise for downstairs neighbors.'
      }
    };
  } else if (item.id === 'hex-087') { // Monster walk
    item.material_preferido = ['banda_elastica'];
    item.alternativa_casa = {
      option: ['peso_corporal'],
      nota: {
        es: 'Sin banda no hay resistencia elástica progresiva; mantener patrón como activación muscular pero no como fortalecimiento equivalente. Alternativa: puente monopodal o empuje contra marco de puerta.',
        en: 'Without band there is no progressive elastic resistance; maintain pattern as activation but not equivalent strengthening. Alternative: single-leg bridge or isometric doorframe press.'
      }
    };
  } else if (item.id === 'hex-093') { // Estiramiento isquios toalla
    item.material_preferido = ['toalla'];
    item.alternativa_casa = {
      option: ['toalla', 'peso_corporal'],
      nota: {
        es: 'Usar toalla de baño doblada o cinturón de tela. Tracción suave y progresiva.',
        en: 'Use folded bath towel or cloth belt. Smooth progressive traction.'
      }
    };
  } else if (item.id === 'hex-062') { // Equilibrio cojín
    item.material_preferido = ['wobble_pad'];
    item.alternativa_casa = {
      option: ['cojin'],
      nota: {
        es: 'El cojín reduce la inestabilidad en comparación con una superficie inestable profesional (Bosu/wobble pad); mantener concentración en la alineación del tobillo.',
        en: 'A cushion provides less instability than professional equipment (Bosu/wobble board); maintain focus on ankle alignment.'
      }
    };
  } else if (rawMats.includes('pared')) {
    item.material_preferido = ['pared'];
    item.alternativa_casa = {
      option: ['pared'],
      nota: {
        es: 'Requiere pared lisa despejada sin enchufes ni elementos frágiles.',
        en: 'Requires solid clear wall with no sockets or fragile items.'
      }
    };
  } else if (rawMats.includes('balon')) {
    item.material_preferido = ['pelota'];
    item.alternativa_casa = {
      option: ['pelota'],
      nota: {
        es: 'En interiores se recomienda balón de fútbol sala o pelota blanda si el espacio es reducido.',
        en: 'Indoors use futsal or soft foam ball if training in compact room.'
      }
    };
  } else if (rawMats.includes('cuerda')) {
    item.material_preferido = ['cuerda'];
    item.alternativa_casa = {
      option: ['peso_corporal'],
      nota: {
        es: 'Si no dispones de comba, realizar salto imitativo con giros rítmicos de muñeca.',
        en: 'If without jump rope, mimic hops with rhythmic wrist rotations.'
      }
    };
  } else if (rawMats.includes('toalla')) {
    item.material_preferido = ['toalla'];
    item.alternativa_casa = {
      option: ['toalla'],
      nota: {
        es: 'Usar toalla sobre suelo liso (parquet/baldosa) o calcetines gruesos.',
        en: 'Use towel on smooth tile/wood floor or thick socks.'
      }
    };
  } else if (rawMats.includes('silla') || rawMats.includes('silla_o_sofa')) {
    item.material_preferido = ['silla_estable'];
    item.alternativa_casa = {
      option: ['silla_estable', 'sofa'],
      nota: {
        es: 'Asegurar que la silla esté firmemente apoyada contra una pared.',
        en: 'Ensure chair is firmly backed against a wall.'
      }
    };
  } else if (rawMats.includes('escalon')) {
    item.material_preferido = ['escalon'];
    item.alternativa_casa = {
      option: ['escalon'],
      nota: {
        es: 'Utilizar el primer escalón de una escalera con barandilla disponible para seguridad.',
        en: 'Use bottom step with banister nearby for safety.'
      }
    };
  } else if (rawMats.includes('conos_o_botellas')) {
    item.material_preferido = ['conos'];
    item.alternativa_casa = {
      option: ['botella'],
      nota: {
        es: 'Usar botellas de plástico vacías o zapatillas como marcas delimitadoras.',
        en: 'Use empty plastic bottles or shoes as delimiting markers.'
      }
    };
  } else {
    item.material_preferido = ['peso_corporal'];
    item.alternativa_casa = {
      option: ['peso_corporal', 'colchoneta'],
      nota: {
        es: 'No requiere material adicional; realizar sobre suelo cómodo o colchoneta.',
        en: 'No additional gear needed; perform on comfortable floor or mat.'
      }
    };
  }

  // Umbrales de edad y supervisión clínica (LTAD Lloyd 2016 + ACSM 2022)
  if (item.id === 'hex-078') { // Nordic
    item.age_min = 14;
    item.age_max = null;
    item.edad_minima_segura = 14;
    item.requiere_supervision_presencial = true;
    item.safety_notes = {
      es: 'No prescribir sin base de fuerza previa. Progresar de isométrico a asistido a full. Supervisión obligatoria.',
      en: 'Do not prescribe without prior strength base. Progress from isometric to assisted to full. Mandatory supervision.'
    };
    item.source = {
      type: 'estudio_peer_reviewed',
      citation: 'Petersen et al. 2011, Am J Sports Med'
    };
  } else if (item.id === 'hex-076') { // Copenhagen nivel 2
    item.age_min = 14;
    item.age_max = null;
    item.edad_minima_segura = 14;
    item.requiere_supervision_presencial = true;
    item.safety_notes = {
      es: 'Carga alta en inserción del aductor largo. Detener si hay molestia en sínfisis púbica.',
      en: 'High load on adductor longus insertion. Stop immediately if pubic discomfort occurs.'
    };
    item.source = {
      type: 'estudio_peer_reviewed',
      citation: 'Thorborg/Hölmich, Copenhagen adduction exercise literature; Harøy et al. 2019'
    };
  } else if (item.id === 'hex-077') { // Copenhagen suelo nivel 1
    item.age_min = 12;
    item.age_max = null;
    item.edad_minima_segura = 12;
    item.requiere_supervision_presencial = false;
    item.safety_notes = {
      es: 'Palanca corta adecuada para formación formativa sub-12/sub-14.',
      en: 'Short lever arm appropriate for youth u12/u14 athlete progression.'
    };
    item.source = {
      type: 'estudio_peer_reviewed',
      citation: 'Harøy et al. 2019, Br J Sports Med'
    };
  } else if (['hex-064', 'hex-065', 'hex-092'].includes(item.id)) { // Pliometría alta / drop jump
    item.age_min = 16;
    item.age_max = null;
    item.edad_minima_segura = 16;
    item.requiere_supervision_presencial = true;
    item.safety_notes = {
      es: 'Superficie que amortigüe, espacio vertical y calzado adecuado. No prescribir sin base de fuerza y técnica de aterrizaje.',
      en: 'Cushioned landing surface, vertical clearance and proper footwear. Do not prescribe without strength base and landing mechanics.'
    };
    item.source = {
      type: 'consenso_fisio_colegiado',
      citation: 'ACSM 2022 Guidelines; Lloyd 2016 LTAD'
    };
  } else if (['hex-080', 'hex-081', 'hex-082'].includes(item.id)) { // Unipodales intensos / pistol
    item.age_min = 14;
    item.age_max = null;
    item.edad_minima_segura = 14;
    item.requiere_supervision_presencial = true;
    item.safety_notes = {
      es: 'Exige dorsiflexión y control de valgo; no permitir colapso medial de la rodilla.',
      en: 'Requires dorsiflexion and valgus knee control; avoid medial knee collapse.'
    };
    item.source = {
      type: 'consenso_fisio_colegiado',
      citation: 'ACSM 2022 Guidelines'
    };
  } else if (['hex-020', 'hex-056', 'hex-057', 'hex-058', 'hex-059'].includes(item.id)) { // Pogo / multisaltos
    item.age_min = 12;
    item.age_max = null;
    item.edad_minima_segura = 12;
    item.requiere_supervision_presencial = false;
    item.safety_notes = {
      es: 'Rebote elástico sobre metatarsos; suspender ante sobrecarga en gemelos o tendón de Aquiles.',
      en: 'Elastic forefoot rebound; stop if calf or Achilles tendon tightness occurs.'
    };
    item.source = {
      type: 'consenso_fisio_colegiado',
      citation: 'ACSM 2022 Guidelines; Lloyd 2016 LTAD'
    };
  } else if (item.targetZones.some(z => z.includes('tobillo') || z.includes('propiocepcion'))) {
    item.age_min = 10;
    item.age_max = null;
    item.edad_minima_segura = 10;
    item.requiere_supervision_presencial = false;
    item.safety_notes = {
      es: 'Mantener apoyo cerca de pared por seguridad si se pierde el equilibrio.',
      en: 'Keep support hand near wall for safety if balance is lost.'
    };
    item.source = {
      type: 'estudio_peer_reviewed',
      citation: 'Verhagen et al. 2004, ankle injury prevention'
    };
  } else if (item.category === 'vuelta_calma') {
    item.age_min = 8;
    item.age_max = null;
    item.edad_minima_segura = 8;
    item.requiere_supervision_presencial = false;
    item.safety_notes = {
      es: 'Estiramientos suaves y progresivos sin rebotes ni dolor agudo.',
      en: 'Gentle progressive stretches without bouncing or sharp pain.'
    };
    item.source = {
      type: 'consenso_fisio_colegiado',
      citation: 'ACSM 2022 flexibility; Page 2012 stretching concepts'
    };
  } else {
    // Calentamiento, core, técnica general
    item.age_min = 10;
    item.age_max = null;
    item.edad_minima_segura = 10;
    item.requiere_supervision_presencial = false;
    item.safety_notes = {
      es: 'Alinear columna neutra y mantener respiración fluida.',
      en: 'Maintain neutral spine and steady breathing.'
    };
    item.source = {
      type: 'guia_fifa',
      citation: 'FIFA 11+ Programme Manual, FIFA/F-MARC'
    };
  }

  // Regla de salvaguarda biomecánica: respetar umbrales mínimos por targetZones críticas
  if (item.targetZones.some(z => z.includes('aductor') || z.includes('pubalgia'))) {
    item.edad_minima_segura = Math.max(item.edad_minima_segura, 12);
    item.age_min = item.edad_minima_segura;
    item.safety_notes = item.safety_notes || {
      es: 'Controlar alineación pélvica y tensión en aductores.',
      en: 'Monitor pelvic alignment and adductor tension.'
    };
  }
  if (item.targetZones.some(z => z.includes('prevencion_lca') || z.includes('hombro_manguito'))) {
    item.edad_minima_segura = Math.max(item.edad_minima_segura, 12);
    item.age_min = item.edad_minima_segura;
  }
  if (item.targetZones.some(z => z.includes('isquiosurales_excentrico') || z.includes('absorcion_impactos'))) {
    item.edad_minima_segura = Math.max(item.edad_minima_segura, 14);
    item.age_min = item.edad_minima_segura;
    item.requiere_supervision_presencial = true;
  }
  if (item.targetZones.some(z => z.includes('cuello') || z.includes('prevencion_conmocion_cuello_gk'))) {
    item.edad_minima_segura = Math.max(item.edad_minima_segura, 14);
    item.age_min = item.edad_minima_segura;
    item.requiere_supervision_presencial = true;
  }

  return item;
});

// Incorporar el ejercicio representativo de cuello / cervical de portero (hex-108)
const neckExercise = {
  id: 'hex-108',
  name: 'Isométrico Cervical Multidireccional de Portero',
  nameEs: 'Isométrico Cervical Multidireccional de Portero',
  nameEn: 'Goalkeeper Multidirectional Neck Isometric',
  category: 'fuerza_preventiva',
  level: 'intermedio',
  series: 3,
  durationSeconds: 15,
  reps: 0,
  restSeconds: 30,
  materials: ['toalla'],
  materialsEs: ['toalla o propia mano'],
  materialsEn: ['towel or own hand'],
  material_preferido: ['toalla'],
  alternativa_casa: {
    option: ['peso_corporal'],
    nota: {
      es: 'Resistencia manual con la palma de la mano o toalla doblada; mantener cuello rígido y neutro. Prohibido autoprescribir sin supervisión técnica o médica previa.',
      en: 'Manual resistance using palm or folded towel; keep neck rigid and neutral. Forbidden to self-prescribe without prior coaching or medical clearance.'
    }
  },
  contexto: 'casa',
  age_min: 14,
  age_max: null,
  edad_minima_segura: 14,
  requiere_supervision_presencial: true,
  safety_notes: {
    es: 'Presión submáxima progresiva en 4 direcciones (frontal, occipital, laterales). Cero sacudidas o movimientos balísticos para prevenir lesiones cervicales o conmociones.',
    en: 'Submaximal progressive pressure in 4 directions (front, back, sides). Zero jerking or ballistic motions to prevent cervical injury or concussion risk.'
  },
  description: 'De pie o sentado con columna erguida, aplicar fuerza isométrica moderada con la mano o toalla en frente, nuca y sienes resistiendo sin mover la cabeza.',
  descriptionEs: 'De pie o sentado con columna erguida, aplicar fuerza isométrica moderada con la mano o toalla en frente, nuca y sienes resistiendo sin mover la cabeza.',
  descriptionEn: 'Seated or standing tall, apply moderate isometric resistance with hand or towel to forehead, back of head, and temples holding head rock-steady.',
  coachingPoints: ['Contracción isométrica pura sin movimiento articular', 'Respiración constante sin apnea'],
  coachingPointsEs: ['Contracción isométrica pura sin movimiento articular', 'Respiración constante sin apnea'],
  coachingPointsEn: ['Pure isometric hold with zero neck motion', 'Breathe continuously without breath holding'],
  targetZones: ['cuello', 'prevencion_conmocion_cuello_gk', 'trapecio'],
  source: {
    type: 'guia_federacion',
    citation: 'Federación/programa de porteros; protocolo de fortalecimiento cervical para prevención de conmociones'
  }
};

if (!transformed.some(e => e.id === 'hex-108')) {
  transformed.push(neckExercise);
}

// Serializar a código JS limpio
const serializedArray = JSON.stringify(transformed, null, 2);

const finalFileContent = `${newHeaderAndCategories}

export const HOME_EXERCISES_107 = ${serializedArray};

export default HOME_EXERCISES_107;
`;

fs.writeFileSync(catalogPath, finalFileContent, 'utf8');
console.log(`--- Migración completada exitosamente. Total ejercicios en catálogo: ${transformed.length} ---`);
